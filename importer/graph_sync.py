"""
Microsoft Graph API -> com_employee 동기화
==========================================
Azure AD Client Credentials Flow 로 사용자 목록을 가져와
com_employee 테이블에 upsert 한다.
"""
import os
import requests
import msal
from collector.db_conn import get_conn


def _get_access_token():
    tenant_id = os.getenv("AZURE_AD_TENANT_ID")
    client_id = os.getenv("AZURE_AD_CLIENT_ID")
    client_secret = os.getenv("AZURE_AD_CLIENT_SECRET")

    if not all([tenant_id, client_id, client_secret]):
        raise RuntimeError(
            "AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET "
            "환경변수를 .env 에 설정하세요."
        )

    app = msal.ConfidentialClientApplication(
        client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
        client_credential=client_secret,
    )
    result = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    )
    if "access_token" not in result:
        raise RuntimeError(f"Token error: {result.get('error_description', result)}")
    return result["access_token"]


def _fetch_all_users(token):
    headers = {"Authorization": f"Bearer {token}"}
    url = (
        "https://graph.microsoft.com/v1.0/users"
        "?=id,displayName,mail,userPrincipalName,department,jobTitle"
        "&=999"
    )
    users = []
    while url:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        users.extend(data.get("value", []))
        url = data.get("@odata.nextLink")
    return users


def sync_employees(dry_run=False):
    """Graph API 에서 사용자 목록을 가져와 com_employee 에 upsert."""
    token = _get_access_token()
    users = _fetch_all_users(token)

    inserted = updated = skipped = 0
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            for u in users:
                email = (u.get("mail") or u.get("userPrincipalName") or "").strip().lower()
                if not email:
                    skipped += 1
                    continue

                display_name = u.get("displayName") or ""
                department = u.get("department") or ""
                job_title = u.get("jobTitle") or ""
                external_id = u.get("id") or ""

                if dry_run:
                    print(f"  [DRY] {email} | {display_name} | {department} | {job_title}")
                    continue

                cur.execute(
                    """INSERT INTO com_employee
                           (email, display_name, department, job_title,
                            scim_external_id, is_active)
                       VALUES (%s, %s, %s, %s, %s, true)
                       ON CONFLICT (email) DO UPDATE SET
                           display_name     = EXCLUDED.display_name,
                           department       = EXCLUDED.department,
                           job_title        = EXCLUDED.job_title,
                           scim_external_id = EXCLUDED.scim_external_id,
                           is_active        = true,
                           updated_at       = now()
                       RETURNING (xmax = 0) AS is_insert""",
                    (email, display_name, department, job_title, external_id),
                )
                row = cur.fetchone()
                if row and row[0]:
                    inserted += 1
                else:
                    updated += 1

        if not dry_run:
            conn.commit()
    finally:
        conn.close()

    stats = {"total": len(users), "inserted": inserted, "updated": updated, "skipped": skipped}
    print(f"Sync complete: {stats}")
    return stats
