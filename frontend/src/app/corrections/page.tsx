'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Correction { id: number; name: string; dept: string; date: string; punchType: string; punchTime: string; reason: string; status: string; requestedAt: string; }

const mockData: Correction[] = [
  { id: 1, name: 'Nguyen Van An', dept: 'Logistics', date: '2026-03-05', punchType: 'OUT', punchTime: '17:00', reason: 'Forgot to check out', status: 'pending', requestedAt: '2026-03-06 09:00' },
  { id: 2, name: 'Tran Thi Binh', dept: 'Ke toan', date: '2026-03-04', punchType: 'IN', punchTime: '08:00', reason: 'Device error', status: 'approved', requestedAt: '2026-03-05 10:30' },
  { id: 3, name: 'Le Van Cuong', dept: 'Kho hang A1', date: '2026-03-03', punchType: 'BOTH', punchTime: '', reason: 'Was on field', status: 'rejected', requestedAt: '2026-03-04 14:00' },
];

const punchBadge: Record<string, string> = {
  OUT: 'bg-red-100 text-red-700', IN: 'bg-amber-100 text-amber-700', BOTH: 'bg-red-100 text-red-700',
};

export default function CorrectionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('pending');
  const [data, setData] = useState<Correction[]>(mockData);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback((status: string) => {
    setLoading(true);
    fetch('/api/corrections?status=' + status)
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setData(d as Correction[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(tab); }, [tab, loadData]);

  const handleApprove = async (id: number) => {
    await fetch('/api/corrections/' + id + '/approve', { method: 'POST' });
    loadData(tab);
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    await fetch('/api/corrections/' + id + '/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    loadData(tab);
  };

  const tabs = ['pending', 'approved', 'rejected'];
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('nav.corrections')}</h2>
        <Link href="/corrections/new" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>{t('corrections.applyCorrection')}
        </Link>
      </div>
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(s => (
          <button key={s} onClick={() => setTab(s)} className={'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ' + (tab === s ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700')}>
            {t('corrections.tab' + s.charAt(0).toUpperCase() + s.slice(1))}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && <div className="p-4 text-center text-sm text-slate-400">{t('common.loading')}</div>}
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
            {['attendance.table.name','common.date','corrections.requestTime','dashboard.missedType','common.reason','common.action'].map(k=>(
              <th key={k} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{t(k)}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.dept}</p>
                </td>
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{r.requestedAt}</td>
                <td className="px-4 py-3"><span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium '+(punchBadge[r.punchType]||'')}>{t('punch_type.'+r.punchType)}</span></td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{r.reason}</td>
                <td className="px-4 py-3">
                  {tab === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.id)} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">{t('common.approve')}</button>
                      <button onClick={() => handleReject(r.id)} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">{t('common.reject')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
