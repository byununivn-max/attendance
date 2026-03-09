'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
type AS = 'NORMAL'|'LATE'|'EARLY_LEAVE'|'ABSENT'|'MISSED_PUNCH'|'PAID_LEAVE'|'HOLIDAY';
interface AR{empCode:string;name:string;dept:string;checkIn:string;checkOut:string;workHours:number;overtime:number;lateMins:number;earlyMins:number;status:AS;}
const badge:Record<AS,string>={
  NORMAL:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LATE:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EARLY_LEAVE:'bg-orange-100 text-orange-700',ABSENT:'bg-red-100 text-red-700',
  MISSED_PUNCH:'bg-purple-100 text-purple-700',PAID_LEAVE:'bg-blue-100 text-blue-700',
  HOLIDAY:'bg-slate-100 text-slate-700',
};
export default function AttendancePage(){
  const{t}=useTranslation();
  const[selDate,setSelDate]=useState(()=>new Date().toISOString().slice(0,10));
  const[selDept,setSelDept]=useState('');
  const[data,setData]=useState<AR[]>([]);
  const[depts,setDepts]=useState<string[]>([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    setLoading(true);
    const p=new URLSearchParams();
    p.set('date',selDate);
    if(selDept) p.set('dept',selDept);
    fetch('/api/attendance?'+p.toString())
      .then(r=>r.json())
      .then((d:unknown)=>{
        const rows=Array.isArray(d)?d as AR[]:[];
        setData(rows);
        if(!selDept){
          const ds=[...new Set(rows.map(r=>r.dept).filter(Boolean))].sort();
          setDepts(ds);
        }
      })
      .catch(()=>setData([]))
      .finally(()=>setLoading(false));
  },[selDate,selDept]);

  const filtered=data.filter(r=>!selDept||r.dept===selDept);
  return(
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('attendance.title')}</h2>
        <button className="border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">download</span>{t('common.download')}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
          <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="text-sm bg-transparent outline-none" />
        </div>
        <select value={selDept} onChange={e=>setSelDept(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="">{t('attendance.filterByDept')}</option>
          {depts.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading&&<div className="p-4 text-center text-sm text-slate-400">{t('common.loading')}</div>}
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
            {['empCode','name','department','checkIn','checkOut','workHours','overtime','lateMins','earlyMins'].map(c=>(
              <th key={c} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                {t('attendance.table.'+c)}
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.status')}</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {!loading&&filtered.length===0&&(
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">{t('attendance.noData')}</td></tr>
            )}
            {filtered.map(r=>(
              <tr key={r.empCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.empCode}</td>
                <td className="px-4 py-3"><Link href={'/attendance/'+r.empCode} className="font-medium text-primary hover:underline">{r.name}</Link></td>
                <td className="px-4 py-3 text-slate-500">{r.dept}</td>
                <td className="px-4 py-3">{r.checkIn||'-'}</td>
                <td className="px-4 py-3">{r.checkOut||'-'}</td>
                <td className="px-4 py-3">{r.workHours>0?r.workHours.toFixed(1):'-'}</td>
                <td className="px-4 py-3">{r.overtime>0?r.overtime.toFixed(1):'-'}</td>
                <td className="px-4 py-3">{r.lateMins>0?r.lateMins:'-'}</td>
                <td className="px-4 py-3">{r.earlyMins>0?r.earlyMins:'-'}</td>
                <td className="px-4 py-3"><span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium '+badge[r.status]}>{t('status.'+r.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">{filtered.length} / {data.length}</div>
      </div>
    </div>
  );
}
