import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
const MOCK = [
  { id:1, empCode:'VN001', name:'Nguyen Van An', dept:'Logistics', date:'2026-03-05', punchType:'OUT', requestTime:'2026-03-06 09:12', status:'PENDING' },
  { id:2, empCode:'VN002', name:'Tran Thi Binh', dept:'Ke toan', date:'2026-03-04', punchType:'IN', requestTime:'2026-03-05 10:30', status:'APPROVED' },
  { id:3, empCode:'VN003', name:'Le Van Cuong', dept:'Kho hang A1', date:'2026-03-03', punchType:'BOTH', requestTime:'2026-03-04 08:45', status:'PENDING' },
  { id:4, empCode:'VN005', name:'Hoang Van Em', dept:'IT', date:'2026-03-02', punchType:'OUT', requestTime:'2026-03-03 11:00', status:'REJECTED' },
];
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') || '';
  try {
    const rows = await query(
      `SELECT pc.correction_id AS id, e.emp_code AS "empCode", COALESCE(e.full_name, e.emp_name) AS name,
        COALESCE(e.department, '') AS dept,
        pc.work_date AS date, pc.punch_type AS "punchType",
        TO_CHAR(pc.created_at, 'YYYY-MM-DD HH24:MI') AS "requestTime",
        pc.status, pc.reject_reason AS "rejectReason"
      FROM atd_punch_correction pc
      JOIN com_employee e ON e.emp_id = pc.emp_id
      WHERE ($1 = '' OR pc.status = $1)
      ORDER BY pc.created_at DESC`,
      [status.toUpperCase() || '']
    );
    return NextResponse.json(rows);
  } catch {
    const filtered = status ? MOCK.filter(r => r.status === status.toUpperCase()) : MOCK;
    return NextResponse.json(filtered, { headers: { 'X-Mock': 'true' } });
  }
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const [row] = await query(
      'INSERT INTO atd_punch_correction (emp_id, work_date, punch_type, requested_time, reason, status) SELECT e.emp_id, $2, $3, $4, $5, $6 FROM com_employee e WHERE e.emp_code = $1 RETURNING correction_id AS id',
      [body.empCode, body.date, body.punchType, body.correctionTime, body.reason, 'PENDING']
    );
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ id: Date.now(), ...body, status: 'PENDING', _mock: true }, { status: 201 });
  }
}
