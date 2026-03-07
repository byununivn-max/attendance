'use client';
import { useState } from 'react';
import { useTranslation, LOCALE_LABELS, type Locale } from '@/lib/i18n';
interface Shift{id:number;name:string;start:string;end:string;minHours:number;}
const initShifts:Shift[]=[
  {id:1,name:'Standard',start:'08:00',end:'17:00',minHours:8.0},
  {id:2,name:'Morning Half',start:'08:00',end:'12:00',minHours:4.0},
  {id:3,name:'Afternoon Half',start:'13:00',end:'17:00',minHours:4.0},
];
export default function SettingsPage(){
  const{t,locale,setLocale}=useTranslation();
  const[saved,setSaved]=useState(false);
  const[shifts]=useState<Shift[]>(initShifts);
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);};
  return(
    <div className="p-4 lg:p-8 space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
      {saved&&(
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {t('settings.saved')}
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">{t('settings.generalSettings')}</h3>
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Language / Ngon ngu / 언어</label>
            <div className="flex gap-2">
              {(Object.keys(LOCALE_LABELS) as Locale[]).map(loc=>(
                <button key={loc} onClick={()=>setLocale(loc)}
                  className={'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors '+(locale===loc?'bg-primary text-white border-primary':'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50')}>
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">{t('settings.shiftSettings')}</h3>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.shiftName')}</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.startTime')}</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.endTime')}</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('settings.minWorkHours')}</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {shifts.map(s=>(
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono">{s.start}</td>
                <td className="px-4 py-3 font-mono">{s.end}</td>
                <td className="px-4 py-3">{s.minHours}h</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <div className="flex gap-3">
        <button onClick={save} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">{t('common.save')}</button>
      </div>
    </div>
  );
}
