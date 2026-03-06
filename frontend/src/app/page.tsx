'use client';

import { useTranslation } from '@/lib/i18n';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart';
import { ActionRequiredTable } from '@/components/dashboard/ActionRequiredTable';

export default function DashboardHome() {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.todaySummary')}</h2>
        <div className="flex gap-2">
          <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            {t('common.download')}
          </button>
        </div>
      </div>

      <SummaryCards />
      <WeeklyTrendChart />
      <ActionRequiredTable />
    </div>
  );
}
