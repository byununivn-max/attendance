'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Emp { emp_id: number; emp_code: string; name: string; email: string; department: string; }

export default function EmployeesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Emp[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setData(d as Emp[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_code.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('employees.title')}</h2>
        <span className="text-sm text-slate-400">{filtered.length} / {data.length}</span>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 max-w-sm">
        <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('employees.searchPlaceholder')}
          className="text-sm bg-transparent outline-none w-full"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && <div className="p-4 text-center text-sm text-slate-400">{t('common.loading')}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {['empCode', 'name', 'email', 'department'].map(c => (
                  <th key={c} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {t('employees.table.' + c)}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(e => (
                <tr key={e.emp_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.emp_code}</td>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-slate-500">{e.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{e.department || '-'}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={'/attendance/' + e.emp_code}
                      className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      {t('employees.viewAttendance')}
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">{t('common.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
