import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Vietnamese public holidays per Labor Code - by year
const VN_HOLIDAYS: Record<number, Array<{ date: string; name: string; region: string }>> = {
  2026: [
    { date: '2026-01-01', name: 'Tet Duong Lich (New Year)', region: 'BOTH' },
    { date: '2026-01-28', name: 'Nghi Tet Nguyen Dan (Eve)', region: 'VN' },
    { date: '2026-01-29', name: 'Nghi Tet Nguyen Dan', region: 'VN' },
    { date: '2026-01-30', name: 'Nghi Tet Nguyen Dan', region: 'VN' },
    { date: '2026-01-31', name: 'Nghi Tet Nguyen Dan', region: 'VN' },
    { date: '2026-02-01', name: 'Nghi Tet Nguyen Dan', region: 'VN' },
    { date: '2026-04-07', name: 'Gio To Hung Vuong', region: 'VN' },
    { date: '2026-04-30', name: 'Ngay Giai Phong (Liberation Day)', region: 'VN' },
    { date: '2026-05-01', name: 'Ngay Quoc Te Lao Dong (Labour Day)', region: 'BOTH' },
    { date: '2026-09-02', name: 'Quoc Khanh (National Day)', region: 'VN' },
    { date: '2026-09-03', name: 'Quoc Khanh (bu)', region: 'VN' },
  ],
};

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const holidays = VN_HOLIDAYS[year] || VN_HOLIDAYS[2026];
  const results: string[] = [];
  try {
    for (const h of holidays) {
      await query(
        `INSERT INTO atd_holiday (holiday_date, holiday_name, is_paid, region)
         VALUES ($1, $2, true, $3)
         ON CONFLICT (holiday_date, region) DO NOTHING`,
        [h.date, h.name, h.region]
      );
      results.push(h.date);
    }
    return NextResponse.json({ inserted: results.length, dates: results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
