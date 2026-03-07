'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface ReportRow { emp_code: string; name: string; dept: string; work_days: number; normal_days: number; late_days: number; absent_days: number; leave_days: number; overtime_hours: number; }

const mockData: ReportRow[] = [
  { emp_code: 'VN001', name: 'Nguyen Van An', dept: 'Logistics', work_days: 22, normal_days: 20, late_days: 1, absent_days: 0, leave_days: 1, overtime_hours: 3.5 },
  { emp_code: 'VN002', name: 'Tran Thi Binh', dept: 'Ke toan', work_days: 22, normal_days: 18, late_days: 3, absent_days: 1, leave_days: 0, overtime_hours: 0 },
  { emp_code: 'VN003', name: 'Le Van Cuong', dept: 'Kho hang A1', work_days: 22, normal_days: 19, late_days: 2, absent_days: 0, leave_days: 1, overtime_hours: 1.5 },
  { emp_code: 'VN004', name: 'Pham Thi Dung', dept: 'Hanh chinh', work_days: 22, normal_days: 17, late_days: 1, absent_days: 2, leave_days: 2, overtime_hours: 0 },
  { emp_code: 'VN005', name: 'Hoang Van Em', dept: 'IT', work_days: 22, normal_days: 21, late_days: 1, absent_days: 0, leave_days: 0, overtime_hours: 5.0 },
];

export default function ReportPage() {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear().toString());
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [data, setData] = useState<ReportRow[]>(mockData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/report?year=' + year + '&month=' + month)
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d) && d.length > 0) setData(d as ReportRow[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('report.title')}</h2>
        <button className="border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">download</span>{t('common.download')}
        </button>
      </div>
      <div className="flex gap-3">
        <select value={year} onChange={e => setYear(e.target.value)} className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 outline-none">
          {['2024','2025','2026'].map(y => <option key={y} value={y}>{t('common.year')} {y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 outline-none">
          {Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(m => <option key={m} value={m}>{t('common.month')} {m}</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && <div className="p-4 text-center text-sm text-slate-400">{t('common.loading')}</div>}
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
            {[
              ['attendance.table.empCode','w-24'],['attendance.table.name',''],['attendance.table.department',''],
              ['report.table.workDays','text-right'],['report.table.normalDays','text-right'],
              ['report.table.lateDays','text-right'],['report.table.absentDays','text-right'],
              ['report.table.leaveDays','text-right'],['report.table.overtime','text-right'],
            ].map(([k, align]) => (
              <th key={k} className={'px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap ' + align}>{t(k)}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map(r => (
              <tr key={r.emp_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.emp_code}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.dept}</td>
                <td className="px-4 py-3 text-right">{r.work_days}</td>
                <td className="px-4 py-3 text-right text-green-600">{r.normal_days}</td>
                <td className="px-4 py-3 text-right text-amber-600">{r.late_days}</td>
                <td className="px-4 py-3 text-right text-red-600">{r.absent_days}</td>
                <td className="px-4 py-3 text-right text-blue-600">{r.leave_days}</td>
                <td className="px-4 py-3 text-right">{Number(r.overtime_hours).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
