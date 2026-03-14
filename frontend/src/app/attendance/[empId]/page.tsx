'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface DayRecord { date: string; checkIn: string; checkOut: string; workHours: number; overtime: number; lateMins: number; earlyMins: number; status: string; }
interface EmpDetail { empCode: string; name: string; dept: string; normalDays: number; lateDays: number; absentDays: number; records: DayRecord[]; }

const mockDetail: EmpDetail = {
  empCode: '...', name: 'Loading...', dept: '', normalDays: 0, lateDays: 0, absentDays: 0,
  records: [],
};

const badge: Record<string, string> = {
  NORMAL: 'bg-green-100 text-green-700', LATE: 'bg-amber-100 text-amber-700',
  EARLY_LEAVE: 'bg-orange-100 text-orange-700', ABSENT: 'bg-red-100 text-red-700',
  MISSED_PUNCH: 'bg-purple-100 text-purple-700', PAID_LEAVE: 'bg-blue-100 text-blue-700',
  HOLIDAY: 'bg-slate-100 text-slate-700',
};

export default function EmpDetailPage({ params }: { params: { empId: string } }) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<EmpDetail>(mockDetail);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));

  useEffect(() => {
    fetch('/api/attendance/' + params.empId + '?year=' + year + '&month=' + month)
      .then(r => r.json())
      .then((d: unknown) => { if (d && typeof d === 'object') setDetail(d as EmpDetail); })
      .catch(() => {});
  }, [params.empId, year, month]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/attendance" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{t('attendance.backToList')}
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{detail.name}</h2>
          <p className="text-slate-500 text-sm">{detail.empCode} · {detail.dept}</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 outline-none">
            {['2024','2025','2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 outline-none">
            {Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('status.NORMAL'), value: detail.normalDays, color: 'text-green-600' },
          { label: t('status.LATE'), value: detail.lateDays, color: 'text-amber-600' },
          { label: t('status.ABSENT'), value: detail.absentDays, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <p className="text-sm text-slate-500">{label}</p>
            <h3 className={'text-3xl font-bold mt-1 ' + color}>{value}</h3>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
            {['common.date','attendance.table.checkIn','attendance.table.checkOut','attendance.table.workHours','attendance.table.overtime','attendance.table.lateMins','common.status'].map(k=>(
              <th key={k} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t(k)}</th>
            ))}
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.action')}</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {detail.records.map(r=>(
              <tr key={r.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3">{r.checkIn||'-'}</td>
                <td className="px-4 py-3">{r.checkOut||'-'}</td>
                <td className="px-4 py-3">{r.workHours>0?r.workHours.toFixed(1):'-'}</td>
                <td className="px-4 py-3">{r.overtime>0?r.overtime.toFixed(1):'-'}</td>
                <td className="px-4 py-3">{r.lateMins>0?r.lateMins:'-'}</td>
                <td className="px-4 py-3"><span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium '+(badge[r.status]||'')}>{t('status.'+r.status)}</span></td>
                <td className="px-4 py-3">
                  <Link href={'/corrections/new?emp='+detail.empCode+'&date='+r.date}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary hover:underline">
                    <span className="material-symbols-outlined text-sm">edit_calendar</span>
                    {t('attendance.requestCorrection')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
