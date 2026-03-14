'use client';
import { useState, useEffect } from 'react';
import { useTranslation, LOCALE_LABELS, type Locale } from '@/lib/i18n';

interface Shift {
  shift_id?: number; shift_code: string; shift_name: string;
  start_time: string; end_time: string;
  lunch_start?: string; lunch_end?: string;
  grace_period_in?: number; grace_period_out?: number;
  min_work_hours: number;
}
interface SyncUsersResult { usersTotal: number; usersCreated: number; usersUpdated: number; usersDeactivated: number; duration: number; }
interface SyncResults { users?: SyncUsersResult; licenses?: { synced: number }; groups?: { groupsSynced: number; membersSynced: number }; }
interface SyncLog { sync_id: number; sync_type: string; status: string; users_synced: number; users_created: number; users_updated: number; started_at: string; completed_at: string; error_message: string; }
interface License { license_id: number; emp_code: string; name: string; sku_name: string; synced_at: string; }
interface Group { group_id: number; display_name: string; description: string; mail: string; member_count: number; synced_at: string; }

const START_TIME_OPTIONS = ['08:00', '08:30', '09:00', '09:30', '10:00'];

const defaultShift: Shift = { shift_code: '', shift_name: '', start_time: '08:30', end_time: '17:30', lunch_start: '12:00', lunch_end: '13:00', grace_period_in: 10, grace_period_out: 10, min_work_hours: 8.0 };

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [isNewShift, setIsNewShift] = useState(false);
  const [shiftSaving, setShiftSaving] = useState(false);
  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResults | null>(null);
  const [syncError, setSyncError] = useState('');
  // Sync data display
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingSync, setLoadingSync] = useState(false);

  const loadShifts = () => {
    fetch('/api/shifts').then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setShifts(d as Shift[]); })
      .catch(() => {});
  };

  useEffect(() => { loadShifts(); }, []);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const handleSync = async (type?: string) => {
    setSyncing(true); setSyncError(''); setSyncResult(null);
    try {
      const res = await fetch('/api/graph/sync' + (type ? '?type=' + type : ''), { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult(data.results);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally { setSyncing(false); }
  };

  const toggleSyncHistory = async () => {
    if (!showSyncHistory) {
      setLoadingSync(true);
      try {
        const res = await fetch('/api/graph/sync');
        const data = await res.json();
        setSyncLogs(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      finally { setLoadingSync(false); }
    }
    setShowSyncHistory(v => !v);
  };

  const toggleLicenses = async () => {
    if (!showLicenses) {
      setLoadingSync(true);
      try {
        const res = await fetch('/api/graph/licenses');
        const data = await res.json();
        setLicenses(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      finally { setLoadingSync(false); }
    }
    setShowLicenses(v => !v);
  };

  const toggleGroups = async () => {
    if (!showGroups) {
      setLoadingSync(true);
      try {
        const res = await fetch('/api/graph/groups');
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      finally { setLoadingSync(false); }
    }
    setShowGroups(v => !v);
  };

  const openNewShift = (isHalfHalf = false) => {
    if (isHalfHalf) {
      setEditShift({ shift_code: 'HALF_HALF_' + Date.now(), shift_name: '반반차 (2시간)', start_time: '08:30', end_time: '10:30', min_work_hours: 2.0 });
    } else {
      setEditShift({ ...defaultShift });
    }
    setIsNewShift(true);
  };

  const openEditShift = (s: Shift) => {
    setEditShift({ ...s });
    setIsNewShift(false);
  };

  const handleShiftSave = async () => {
    if (!editShift) return;
    setShiftSaving(true);
    try {
      if (isNewShift) {
        await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editShift) });
      } else {
        await fetch('/api/shifts/' + editShift.shift_id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editShift) });
      }
      setEditShift(null);
      loadShifts();
    } catch { /* ignore */ }
    finally { setShiftSaving(false); }
  };

  const handleShiftDelete = async (shiftId: number) => {
    if (!confirm(t('settings.deleteShift') + '?')) return;
    try {
      await fetch('/api/shifts/' + shiftId, { method: 'DELETE' });
      loadShifts();
    } catch { /* ignore */ }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>{t('settings.saved')}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">{t('settings.generalSettings')}</h3>
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Language / Ngon ngu / 언어</label>
            <div className="flex gap-2">
              {(Object.keys(LOCALE_LABELS) as Locale[]).map(loc => (
                <button key={loc} onClick={() => setLocale(loc)}
                  className={'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' + (locale === loc ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50')}>
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('nav.settings')} - Timezone</label>
            <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">{t('common.timezone')}</p>
          </div>
        </div>
      </div>

      {/* Shift Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{t('settings.shiftSettings')}</h3>
          <div className="flex gap-2">
            <button onClick={() => openNewShift(true)}
              className="border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">more_time</span>{t('settings.halfHalfDay')}
            </button>
            <button onClick={() => openNewShift(false)}
              className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span>{t('settings.addShift')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.shiftName')}</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.startTime')}</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.endTime')}</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.minWorkHours')}</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.action')}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {shifts.map(s => (
                <tr key={s.shift_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">{s.shift_name}</td>
                  <td className="px-4 py-3 font-mono">{s.start_time}</td>
                  <td className="px-4 py-3 font-mono">{s.end_time}</td>
                  <td className="px-4 py-3">{s.min_work_hours}h</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEditShift(s)}
                      className="text-primary text-xs hover:underline flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">edit</span>{t('settings.editShift')}
                    </button>
                    <button onClick={() => s.shift_id && handleShiftDelete(s.shift_id)}
                      className="text-red-500 text-xs hover:underline flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">delete</span>{t('settings.deleteShift')}
                    </button>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Microsoft 365 / Entra ID Sync */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-2">Microsoft 365 / Entra ID Sync</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Pull employee data, licenses, and groups from Microsoft 365 via Graph API
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => handleSync()} disabled={syncing}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {syncing && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
            {syncing ? 'Syncing...' : 'Full Sync'}
          </button>
          <button onClick={() => handleSync('users')} disabled={syncing}
            className="border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
            Users Only
          </button>
          <button onClick={() => handleSync('licenses')} disabled={syncing}
            className="border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
            Licenses Only
          </button>
          <button onClick={() => handleSync('groups')} disabled={syncing}
            className="border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
            Groups Only
          </button>
        </div>
        {syncError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-3">{syncError}</div>
        )}
        {syncResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm space-y-1 mb-3">
            {syncResult.users && <p className="text-green-700 dark:text-green-400">Users: {syncResult.users.usersTotal} total, {syncResult.users.usersCreated} created, {syncResult.users.usersUpdated} updated ({Math.round(syncResult.users.duration / 1000)}s)</p>}
            {syncResult.licenses && <p className="text-green-700 dark:text-green-400">Licenses: {syncResult.licenses.synced} users synced</p>}
            {syncResult.groups && <p className="text-green-700 dark:text-green-400">Groups: {syncResult.groups.groupsSynced} groups, {syncResult.groups.membersSynced} member links</p>}
          </div>
        )}

        {/* Sync Data View Buttons */}
        <div className="flex flex-wrap gap-2 mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button onClick={toggleSyncHistory}
            className="border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">history</span>{t('settings.syncHistory')}
            <span className="material-symbols-outlined text-sm">{showSyncHistory ? 'expand_less' : 'expand_more'}</span>
          </button>
          <button onClick={toggleLicenses}
            className="border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">badge</span>{t('settings.viewLicenses')}
            <span className="material-symbols-outlined text-sm">{showLicenses ? 'expand_less' : 'expand_more'}</span>
          </button>
          <button onClick={toggleGroups}
            className="border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>{t('settings.viewGroups')}
            <span className="material-symbols-outlined text-sm">{showGroups ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>

        {loadingSync && <p className="text-sm text-slate-400 mt-2">{t('common.loading')}</p>}

        {/* Sync History Table */}
        {showSyncHistory && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
                {['Type', 'Status', 'Created', 'Updated', 'Started', 'Duration'].map(h => (
                  <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {syncLogs.map(l => (
                  <tr key={l.sync_id}>
                    <td className="px-3 py-2 font-mono">{l.sync_type}</td>
                    <td className="px-3 py-2"><span className={'px-1.5 py-0.5 rounded text-xs ' + (l.status === 'completed' ? 'bg-green-100 text-green-700' : l.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{l.status}</span></td>
                    <td className="px-3 py-2 text-center">{l.users_created}</td>
                    <td className="px-3 py-2 text-center">{l.users_updated}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{l.started_at ? new Date(l.started_at).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">{l.started_at && l.completed_at ? Math.round((new Date(l.completed_at).getTime() - new Date(l.started_at).getTime()) / 1000) + 's' : '-'}</td>
                  </tr>
                ))}
                {syncLogs.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-400">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Licenses Table */}
        {showLicenses && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
                {['Code', 'Name', 'License', 'Synced'].map(h => (
                  <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {licenses.map(l => (
                  <tr key={l.license_id}>
                    <td className="px-3 py-2 font-mono">{l.emp_code}</td>
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2 text-slate-500">{l.sku_name}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{l.synced_at ? new Date(l.synced_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {licenses.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Groups Table */}
        {showGroups && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
                {['Group Name', 'Mail', 'Members', 'Synced'].map(h => (
                  <th key={h} className="px-3 py-2 font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groups.map(g => (
                  <tr key={g.group_id}>
                    <td className="px-3 py-2 font-medium">{g.display_name}</td>
                    <td className="px-3 py-2 text-slate-500">{g.mail || '-'}</td>
                    <td className="px-3 py-2 text-center">{g.member_count}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{g.synced_at ? new Date(g.synced_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {groups.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={save} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">{t('common.save')}</button>
      </div>

      {/* Shift Edit/Add Modal */}
      {editShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditShift(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{isNewShift ? t('settings.addShift') : t('settings.editShift')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2"><span className="text-xs font-medium text-slate-500">{t('settings.shiftName')}</span>
                <input value={editShift.shift_name} onChange={e => setEditShift({ ...editShift, shift_name: e.target.value })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
              {isNewShift && (
                <label className="block col-span-2"><span className="text-xs font-medium text-slate-500">{t('settings.shiftCode')}</span>
                  <input value={editShift.shift_code} onChange={e => setEditShift({ ...editShift, shift_code: e.target.value })}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
                </label>
              )}
              <label className="block"><span className="text-xs font-medium text-slate-500">{t('settings.startTime')}</span>
                <select value={editShift.start_time} onChange={e => setEditShift({ ...editShift, start_time: e.target.value })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono">
                  {START_TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  {!START_TIME_OPTIONS.includes(editShift.start_time) && <option value={editShift.start_time}>{editShift.start_time}</option>}
                </select>
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">{t('settings.endTime')}</span>
                <input type="time" value={editShift.end_time} onChange={e => setEditShift({ ...editShift, end_time: e.target.value })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">{t('settings.lunchStart')}</span>
                <input type="time" value={editShift.lunch_start || ''} onChange={e => setEditShift({ ...editShift, lunch_start: e.target.value })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">{t('settings.lunchEnd')}</span>
                <input type="time" value={editShift.lunch_end || ''} onChange={e => setEditShift({ ...editShift, lunch_end: e.target.value })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none font-mono" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">{t('settings.minWorkHours')}</span>
                <input type="number" step="0.5" value={editShift.min_work_hours} onChange={e => setEditShift({ ...editShift, min_work_hours: Number(e.target.value) })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
              <label className="block"><span className="text-xs font-medium text-slate-500">{t('settings.gracePeriod')}</span>
                <input type="number" value={editShift.grace_period_in || 10} onChange={e => setEditShift({ ...editShift, grace_period_in: Number(e.target.value), grace_period_out: Number(e.target.value) })}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleShiftSave} disabled={shiftSaving || !editShift.shift_name}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">{t('common.save')}</button>
              <button onClick={() => setEditShift(null)}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
