'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface Device { id: number; name: string; serial_number: string; ip_address: string; port: number; location: string; status: string; last_sync_at: string; }

const mockDevices: Device[] = [
  { id: 1, name: 'Main Entrance', serial_number: 'HIK-001', ip_address: '192.168.1.100', port: 80, location: 'HCMC office', status: 'online', last_sync_at: '2026-03-07T08:00:00Z' },
];

export default function DevicesPage() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formPort, setFormPort] = useState('80');
  const [formSerial, setFormSerial] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addIp, setAddIp] = useState('');
  const [addPort, setAddPort] = useState('80');
  const [addLocation, setAddLocation] = useState('HCMC office');
  const [addSerial, setAddSerial] = useState('');

  const loadDevices = () => {
    fetch('/api/devices')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d) && d.length > 0) setDevices(d as Device[]); })
      .catch(() => {});
  };

  useEffect(() => { loadDevices(); }, []);

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await fetch('/api/devices/' + id + '/sync', { method: 'POST' });
      const result = await res.json();
      setDevices(ds => ds.map(d => d.id === id ? { ...d, status: 'online', last_sync_at: result.syncedAt || new Date().toISOString() } : d));
    } catch { /* ignore */ }
    finally { setSyncingId(null); }
  };

  const openEdit = (d: Device) => {
    setEditDevice(d);
    setFormName(d.name);
    setFormLocation(d.location || 'HCMC office');
    setFormIp(d.ip_address || '');
    setFormPort(String(d.port || 80));
    setFormSerial(d.serial_number || '');
  };

  const handleSave = async () => {
    if (!editDevice) return;
    setSaving(true);
    try {
      await fetch('/api/devices/' + editDevice.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, location: formLocation, ip_address: formIp, port: Number(formPort), serial_number: formSerial }),
      });
      setEditDevice(null);
      loadDevices();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.delete') + '?')) return;
    try {
      await fetch('/api/devices/' + id, { method: 'DELETE' });
      loadDevices();
    } catch { /* ignore */ }
  };

  const handleAdd = async () => {
    if (!addName || !addIp) return;
    setSaving(true);
    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName, ip_address: addIp, port: Number(addPort), location: addLocation, serial_number: addSerial }),
      });
      setShowAddForm(false);
      setAddName(''); setAddIp(''); setAddPort('80'); setAddLocation('HCMC office'); setAddSerial('');
      loadDevices();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('devices.title')}</h2>
        <button onClick={() => setShowAddForm(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
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
                <span>{d.location || 'HCMC office'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('devices.lastSync')}</span>
                <span className="text-xs">{d.last_sync_at ? new Date(d.last_sync_at).toLocaleString() : '-'}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => handleSync(d.id)} disabled={syncingId === d.id}
                className="flex-1 text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {syncingId === d.id ? t('common.loading') : t('common.syncNow')}
              </button>
              <button onClick={() => openEdit(d)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button onClick={() => handleDelete(d.id)}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditDevice(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{t('settings.editShift')}</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-medium text-slate-500">Name</span>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">Location</span>
                <input value={formLocation} onChange={e => setFormLocation(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">IP Address</span>
                <input value={formIp} onChange={e => setFormIp(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
              </label>
              <div className="flex gap-2">
                <label className="block flex-1"><span className="text-xs font-medium text-slate-500">Port</span>
                  <input type="number" value={formPort} onChange={e => setFormPort(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
                </label>
                <label className="block flex-1"><span className="text-xs font-medium text-slate-500">Serial</span>
                  <input value={formSerial} onChange={e => setFormSerial(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">{t('common.save')}</button>
              <button onClick={() => setEditDevice(null)}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddForm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{t('devices.addDevice')}</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-medium text-slate-500">Name</span>
                <input value={addName} onChange={e => setAddName(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">IP Address</span>
                <input value={addIp} onChange={e => setAddIp(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
              </label>
              <div className="flex gap-2">
                <label className="block flex-1"><span className="text-xs font-medium text-slate-500">Port</span>
                  <input type="number" value={addPort} onChange={e => setAddPort(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
                </label>
                <label className="block flex-1"><span className="text-xs font-medium text-slate-500">Serial</span>
                  <input value={addSerial} onChange={e => setAddSerial(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
                </label>
              </div>
              <label className="block"><span className="text-xs font-medium text-slate-500">Location</span>
                <input value={addLocation} onChange={e => setAddLocation(e.target.value)} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleAdd} disabled={saving || !addName || !addIp}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">{t('devices.addDevice')}</button>
              <button onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
