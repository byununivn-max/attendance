'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface Device { id: number; name: string; serial_number: string; ip_address: string; port: number; location: string; status: string; last_sync_at: string; }

const mockDevices: Device[] = [
  { id: 1, name: 'Main Entrance', serial_number: 'HIK-001', ip_address: '192.168.1.100', port: 80, location: 'Gate A', status: 'online', last_sync_at: '2026-03-07T08:00:00Z' },
  { id: 2, name: 'Factory Floor', serial_number: 'HIK-002', ip_address: '192.168.1.101', port: 80, location: 'Building B', status: 'online', last_sync_at: '2026-03-07T07:55:00Z' },
  { id: 3, name: 'Warehouse Entry', serial_number: 'HIK-003', ip_address: '192.168.1.102', port: 80, location: 'Warehouse A1', status: 'offline', last_sync_at: '2026-03-06T23:10:00Z' },
];

export default function DevicesPage() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/devices')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d) && d.length > 0) setDevices(d as Device[]); })
      .catch(() => {});
  }, []);

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await fetch('/api/devices/' + id + '/sync', { method: 'POST' });
      const result = await res.json();
      setDevices(ds => ds.map(d => d.id === id ? { ...d, status: 'online', last_sync_at: result.syncedAt || new Date().toISOString() } : d));
    } catch {
      // ignore
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('devices.title')}</h2>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>{t('devices.addDevice')}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(d => (
          <div key={d.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base">{d.name}</h3>
                <p className="text-xs text-slate-500">{d.serial_number}</p>
              </div>
              <span className={'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ' + (d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                <span className={'w-1.5 h-1.5 rounded-full ' + (d.status === 'online' ? 'bg-green-500' : 'bg-red-500')}></span>
                {t('common.' + d.status)}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('devices.ipAddress')}</span>
                <span className="font-mono text-xs">{d.ip_address}:{d.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('devices.location')}</span>
                <span>{d.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('devices.lastSync')}</span>
                <span className="text-xs">{d.last_sync_at ? new Date(d.last_sync_at).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => handleSync(d.id)} disabled={syncingId === d.id} className="flex-1 text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {syncingId === d.id ? t('common.loading') : t('common.syncNow')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
