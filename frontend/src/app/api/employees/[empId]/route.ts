import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ empId: string }> }) {
  const { empId } = await params;
  try {
    const body = await request.json();
    const { employment_status } = body;
    if (!['ACTIVE', 'RESIGNED', 'SHARED'].includes(employment_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    await query(
      `UPDATE com_employee SET employment_status=$1, is_active=($1 = 'ACTIVE'), updated_at=NOW() WHERE emp_id=$2`,
      [employment_status, empId]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
