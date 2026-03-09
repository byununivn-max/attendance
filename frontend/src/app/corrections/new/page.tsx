'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function NewCorrectionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({ empCode: '', date: '', punchType: 'IN', punchTime: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.push('/corrections');
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/corrections" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
          <span className="material-symbols-outlined text-sm">arrow_back</span>{t('common.back')}
        </Link>
      </div>
      <h2 className="text-2xl font-bold">{t('corrections.form.title')}</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('corrections.employee')}</label>
          <input value={form.empCode} onChange={e => setForm(f => ({...f, empCode: e.target.value}))} placeholder={t('corrections.selectEmployee')} required className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('corrections.form.correctionDate')}</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('corrections.form.type')}</label>
          <div className="flex gap-4">
            {['IN','OUT','BOTH'].map(pt => (
              <label key={pt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" value={pt} checked={form.punchType===pt} onChange={e => setForm(f => ({...f, punchType: e.target.value}))} />
                {t('punch_type.'+pt)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('corrections.form.correctionTime')}</label>
          <input type="time" value={form.punchTime} onChange={e => setForm(f => ({...f, punchTime: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.reason')}</label>
          <textarea value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} rows={3} required className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? t('common.loading') : t('common.save')}
          </button>
          <Link href="/corrections" className="flex-1 text-center border border-slate-200 dark:border-slate-800 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">{t('common.cancel')}</Link>
        </div>
      </form>
    </div>
  );
}
