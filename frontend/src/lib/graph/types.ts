export interface GraphUser {
  id: string;
  displayName: string | null;
  givenName: string | null;
  surname: string | null;
  mail: string | null;
  userPrincipalName: string;
  department: string | null;
  jobTitle: string | null;
  accountEnabled: boolean;
  manager?: { id: string } | null;
}

export interface GraphLicenseDetail {
  skuId: string;
  skuPartNumber: string;
  servicePlans: Array<{
    servicePlanId: string;
    servicePlanName: string;
    provisioningStatus: string;
  }>;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description: string | null;
  mail: string | null;
}

export interface SyncResult {
  syncId: number;
  syncType: string;
  usersTotal: number;
  usersCreated: number;
  usersUpdated: number;
  usersDeactivated: number;
  duration: number;
}
