'use client';

import { useTranslation } from '@/lib/i18n';

export function SummaryCards() {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">how_to_reg</span>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t('status.NORMAL')}</span>
                </div>
                <p className="text-slate-500 text-sm">{t('dashboard.presentCount')}</p>
                <h3 className="text-3xl font-bold mt-1">142</h3>
                <p className="text-xs text-slate-400 mt-2">94% tổng nhân sự</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">schedule</span>
                    </div>
                </div>
                <p className="text-slate-500 text-sm">{t('dashboard.lateCount')}</p>
                <h3 className="text-3xl font-bold mt-1">08</h3>
                <p className="text-xs text-slate-400 mt-2">+2 so với hôm qua</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">person_off</span>
                    </div>
                </div>
                <p className="text-slate-500 text-sm">{t('dashboard.absentCount')}</p>
                <h3 className="text-3xl font-bold mt-1">03</h3>
                <p className="text-xs text-slate-400 mt-2">Đã có phép: 02</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-lg">
                        <span className="material-symbols-outlined">priority_high</span>
                    </div>
                </div>
                <p className="text-slate-500 text-sm">{t('dashboard.missedCount')}</p>
                <h3 className="text-3xl font-bold mt-1">05</h3>
                <p className="text-xs text-slate-400 mt-2">Cần xử lý ngay</p>
            </div>
        </div>
    );
}
