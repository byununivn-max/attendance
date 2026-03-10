'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface Emp {
  emp_id: number; emp_code: string; name: string; email: string; department: string;
  mapId: number | null; hikPersonId: string | null; deviceName: string | null; deviceId: number | null;
}
interface Device { id: number; name: string; }

export default function EmployeesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Emp[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [filterMapping, setFilterMapping] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [loading, setLoading] = useState(true);
  const [editEmp, setEditEmp] = useState<Emp | null>(null);
  const [formDevice, setFormDevice] = useState('');
  const [formHikId, setFormHikId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/employees')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setData(d as Emp[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    fetch('/api/devices').then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setDevices((d as Device[]).map(x => ({ id: (x as unknown as Record<string, number>).id, name: (x as unknown as Record<string, string>).name }))); })
      .catch(() => {});
  }, [loadData]);

  const filtered = data.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.emp_code.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchMapping = filterMapping === 'all' ||
      (filterMapping === 'mapped' && e.mapId != null) ||
      (filterMapping === 'unmapped' && e.mapId == null);
    return matchSearch && matchMapping;
  });

  const openEdit = (emp: Emp) => {
    setEditEmp(emp);
    setFormDevice(emp.deviceId?.toString() || (devices[0]?.id?.toString() || ''));
    setFormHikId(emp.hikPersonId || '');
  };

  const handleSave = async () => {
    if (!editEmp || !formDevice || !formHikId) return;
    setSaving(true);
    try {
      if (editEmp.mapId) {
        await fetch(`/api/mappings/${editEmp.mapId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: Number(formDevice), hikPersonId: formHikId, empId: editEmp.emp_id }),
        });
      } else {
        await fetch('/api/mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: Number(formDevice), hikPersonId: formHikId, empId: editEmp.emp_id }),
        });
      }
      setEditEmp(null);
      loadData();
    } catch { /* */ }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editEmp?.mapId) return;
    setSaving(true);
    try {
      await fetch(`/api/mappings/${editEmp.mapId}`, { method: 'DELETE' });
      setEditEmp(null);
      loadData();
    } catch { /* */ }
    finally { setSaving(false); }
  };

  const mappedCount = data.filter(e => e.mapId != null).length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('employees.title')}</h2>
        <span className="text-sm text-slate-400">
          {t('employees.mapped')}: {mappedCount} / {data.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 max-w-sm flex-1">
          <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('employees.searchPlaceholder')} className="text-sm bg-transparent outline-none w-full" />
        </div>
        <select value={filterMapping} onChange={e => setFilterMapping(e.target.value as 'all' | 'mapped' | 'unmapped')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="all">{t('employees.filterAll')}</option>
          <option value="mapped">{t('employees.mapped')}</option>
          <option value="unmapped">{t('employees.unmapped')}</option>
        </select>
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
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  {t('employees.table.deviceId')}
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(e => (
                <tr key={e.emp_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.emp_code}</td>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-slate-500">{e.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{e.department || '-'}</td>
                  <td className="px-4 py-3">
                    {e.hikPersonId ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="font-mono">{e.hikPersonId}</span>
                        <span className="text-slate-400">({e.deviceName})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {t('employees.unmapped')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(e)}
                      className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
                      <span className="material-symbols-outlined text-sm">link</span>
                      {t('employees.editMapping')}
                    </button>
                    {e.mapId && (
                      <Link href={'/attendance/' + e.emp_code}
                        className="inline-flex items-center gap-1 text-slate-500 text-xs hover:underline">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          {filtered.length} / {data.length}
        </div>
      </div>

      {/* Mapping Edit Modal */}
      {editEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditEmp(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{t('employees.editMapping')}</h3>
            <p className="text-sm text-slate-500">{editEmp.emp_code} — {editEmp.name}</p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-500">{t('employees.device')}</span>
                <select value={formDevice} onChange={e => setFormDevice(e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
                  {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500">{t('employees.hikPersonId')}</span>
                <input type="text" value={formHikId} onChange={e => setFormHikId(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  className="mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none font-mono" />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving || !formHikId}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {t('employees.saveMapping')}
              </button>
              {editEmp.mapId && (
                <button onClick={handleDelete} disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors">
                  {t('employees.deleteMapping')}
                </button>
              )}
              <button onClick={() => setEditEmp(null)}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
