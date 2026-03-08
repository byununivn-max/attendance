"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";

interface Holiday { id: number; name: string; date: string; countryCode: string; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MonthCalendar({ year, month, holidays }: { year: number; month: number; holidays: Holiday[] }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const hMap: Record<number, Holiday> = {};
  holidays.forEach(h => { const d = new Date(h.date); if (d.getFullYear() === year && d.getMonth() === month) hMap[d.getDate()] = h; });
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const now = new Date();
  const isToday = (d: number) => now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
  const ccBg = (cc: string) => cc === "VN" ? "bg-red-500 text-white" : cc === "KR" ? "bg-blue-500 text-white" : "bg-purple-500 text-white";
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-sm font-bold text-center mb-2">{MONTHS[month]}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DOW.map(d => <div key={d} className="text-[9px] font-bold text-slate-400 pb-1">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const h = hMap[d]; const dow = (firstDay + d - 1) % 7; const wknd = dow === 0 || dow === 6;
          return (
            <div key={i} className="relative group">
              <div className={["relative text-[11px] w-6 h-6 mx-auto flex items-center justify-center rounded-full overflow-hidden", isToday(d) && !h ? "ring-2 ring-primary font-bold text-primary" : "", !h && wknd ? "text-red-400" : !h ? "text-slate-700 dark:text-slate-300" : "text-white font-bold drop-shadow-md"].join(" ")}>
                {h && h.countryCode === 'KR' && <img src="https://flagcdn.com/1x1/kr.svg" className="absolute inset-0 w-full h-full object-cover brightness-[0.80]" alt="KR" />}
                {h && h.countryCode === 'VN' && <img src="https://flagcdn.com/1x1/vn.svg" className="absolute inset-0 w-full h-full object-cover brightness-[0.80]" alt="VN" />}
                {h && h.countryCode === 'BOTH' && (
                  <div className="absolute inset-0 w-full h-full flex">
                    <img src="https://flagcdn.com/1x1/vn.svg" className="w-1/2 h-full object-cover border-r border-white/20 brightness-[0.80]" alt="VN" />
                    <img src="https://flagcdn.com/1x1/kr.svg" className="w-1/2 h-full object-cover brightness-[0.80]" alt="KR" />
                  </div>
                )}
                <span className="relative z-10">{d}</span>
              </div>
              {h && <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">{h.name}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HolidaysPage() {
  const { t } = useTranslation();
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [form, setForm] = useState({ name: "", date: "", countryCode: "VN" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVN, setLoadingVN] = useState(false);

  const fetchHolidays = useCallback(() => {
    setLoading(true);
    fetch("/api/holidays?year=" + year).then(r => r.json()).then((d: unknown) => { if (Array.isArray(d)) setHolidays(d as Holiday[]); }).catch(() => { }).finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleLoadVN = async () => {
    setLoadingVN(true);
    await fetch("/api/holidays/load-vn?year=" + year, { method: "POST" }).catch(() => { });
    await fetchHolidays();
    setLoadingVN(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/holidays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).catch(() => null);
    if (res && res.ok) { const created = await res.json(); setHolidays(h => [...h, created]); }
    else { setHolidays(h => [...h, { id: Date.now(), ...form }]); }
    setForm({ name: "", date: "", countryCode: "VN" });
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/holidays/" + id, { method: "DELETE" }).catch(() => { });
    setHolidays(h => h.filter(x => x.id !== id));
  };

  const yearHolidays = holidays.filter(h => new Date(h.date).getFullYear() === year);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{t("holidays.title")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 hover:bg-slate-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
          <span className="text-lg font-bold w-16 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 hover:bg-slate-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          <button onClick={handleLoadVN} disabled={loadingVN} className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">flag</span>{loadingVN ? t("common.loading") : t("holidays.loadVN")}
          </button>
          <button onClick={() => setShowForm(s => !s)} className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>{t("holidays.addNew")}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48"><label className="block text-sm font-medium mb-1">{t("holidays.name")}</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">{t("common.date")}</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">{t("holidays.countryCode")}</label><select value={form.countryCode} onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))} className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 outline-none">{["VN", "KR", "BOTH"].map(c => <option key={c} value={c}>{t("holidays." + c)}</option>)}</select></div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">{t("common.save")}</button>
          <button type="button" onClick={() => setShowForm(false)} className="border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm">{t("common.cancel")}</button>
        </form>
      )}

      {loading ? <div className="text-center text-sm text-slate-400 py-8">{t("common.loading")}</div> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }, (_, m) => <MonthCalendar key={m} year={year} month={m} holidays={yearHolidays} />)}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs items-center mt-4">
        <span className="flex items-center gap-1.5"><img src="https://flagcdn.com/1x1/vn.svg" className="w-4 h-4 rounded-full object-cover shadow-sm" alt="VN" />{t("holidays.VN")}</span>
        <span className="flex items-center gap-1.5"><img src="https://flagcdn.com/1x1/kr.svg" className="w-4 h-4 rounded-full object-cover shadow-sm" alt="KR" />{t("holidays.KR")}</span>
        <span className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full overflow-hidden flex shadow-sm"><img src="https://flagcdn.com/1x1/vn.svg" className="w-1/2 h-full object-cover border-r border-slate-200 dark:border-slate-700" alt="VN" /><img src="https://flagcdn.com/1x1/kr.svg" className="w-1/2 h-full object-cover" alt="KR" /></div>{t("holidays.BOTH")}</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full ring-2 ring-primary inline-block bg-white dark:bg-slate-900 drop-shadow-sm" />{t("holidays.today")}</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead><tr className="bg-slate-50 dark:bg-slate-800/50">
            {["holidays.name", "common.date", "holidays.countryCode", "common.action"].map(k => <th key={k} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t(k)}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {[...yearHolidays].sort((a, b) => a.date.localeCompare(b.date)).map(h => (
              <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-2.5 font-medium">{h.name}</td>
                <td className="px-4 py-2.5">{h.date}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {h.countryCode === 'KR' && <img src="https://flagcdn.com/1x1/kr.svg" className="w-3.5 h-3.5 rounded-full object-cover" alt="KR" />}
                    {h.countryCode === 'VN' && <img src="https://flagcdn.com/1x1/vn.svg" className="w-3.5 h-3.5 rounded-full object-cover" alt="VN" />}
                    {h.countryCode === 'BOTH' && (
                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden flex">
                        <img src="https://flagcdn.com/1x1/vn.svg" className="w-1/2 h-full object-cover border-r border-slate-200/50" alt="VN" />
                        <img src="https://flagcdn.com/1x1/kr.svg" className="w-1/2 h-full object-cover" alt="KR" />
                      </div>
                    )}
                    {t("holidays." + h.countryCode)}
                  </span>
                </td>
                <td className="px-4 py-2.5"><button onClick={() => handleDelete(h.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">{t("common.delete")}</button></td>
              </tr>
            ))}
            {yearHolidays.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">{t("common.noData")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
