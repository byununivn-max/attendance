import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const mockEmployees = [
  { emp_id: 1, emp_code: 'EXI001', name: 'Nguyen Van An', email: 'an@eximuni.com', department: '' },
  { emp_id: 2, emp_code: 'EXI002', name: 'Tran Thi Binh', email: 'binh@eximuni.com', department: '' },
];

export async function GET() {
  try {
    const rows = await query(
      `SELECT e.emp_id, e.emp_code,
        COALESCE(e.full_name, e.emp_name) AS name,
        COALESCE(e.email, '') AS email,
        COALESCE(e.department, '') AS department
       FROM com_employee e
       JOIN atd_device_employee_map dem ON dem.emp_id = e.emp_id
       ORDER BY e.emp_code`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(mockEmployees, { headers: { 'X-Mock': 'true' } });
  }
}
