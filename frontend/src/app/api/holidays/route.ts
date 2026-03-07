import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
const MOCK = [
  { id:1, date:'2026-01-01', name:'New Year Day', country:'BOTH' },
  { id:2, date:'2026-01-29', name:'Tet Holiday', country:'VN' },
  { id:3, date:'2026-04-30', name:'Reunification Day', country:'VN' },
  { id:4, date:'2026-05-01', name:'Labor Day', country:'BOTH' },
  { id:5, date:'2026-09-02', name:'National Day VN', country:'VN' },
  { id:6, date:'2026-10-03', name:'National Foundation Day KR', country:'KR' },
];
export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();
  try {
    const rows = await query(
      'SELECT holiday_id AS id, TO_CHAR(holiday_date, $1) AS date, holiday_name AS name, region AS country FROM atd_holiday WHERE EXTRACT(YEAR FROM holiday_date) = $2 ORDER BY holiday_date',
      ['YYYY-MM-DD', year]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(MOCK, { headers: { 'X-Mock': 'true' } });
  }
}
export async function POST(req: NextRequest) {
  const { date, name, country } = await req.json();
  try {
    const [row] = await query('INSERT INTO atd_holiday (holiday_date, holiday_name, region) VALUES ($1, $2, $3) RETURNING holiday_id AS id', [date, name, country]);
    return NextResponse.json({ ...(row as object), date, name, country }, { status: 201 });
  } catch {
    return NextResponse.json({ id: Date.now(), date, name, country, _mock: true }, { status: 201 });
  }
}
