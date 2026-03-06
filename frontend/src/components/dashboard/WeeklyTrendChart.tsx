'use client';

import { useTranslation } from '@/lib/i18n';

const chartData = [
    { label: 'Thứ 2', normal: 85, late: 10, absent: 5 },
    { label: 'Thứ 3', normal: 85, late: 8, absent: 7 },
    { label: 'Thứ 4', normal: 90, late: 5, absent: 5 },
    { label: 'Thứ 5', normal: 75, late: 15, absent: 10 },
    { label: 'Thứ 6', normal: 82, late: 10, absent: 8 },
    { label: 'Thứ 7', normal: 40, late: 5, absent: 55, dimmed: true },
    { label: 'Hôm nay', normal: 88, late: 4, absent: 8 },
];

export function WeeklyTrendChart() {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold">{t('dashboard.weeklyTrend')}</h3>
                    <p className="text-sm text-slate-500">Tình trạng chấm công 7 ngày gần nhất</p>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-primary"></span>
                        <span>{t('status.NORMAL')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                        <span>{t('status.LATE')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                        <span>{t('status.ABSENT')}</span>
                    </div>
                </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 px-2">
                {chartData.map(({ label, normal, late, absent, dimmed }) => (
                    <div
                        key={label}
                        className={`flex-1 flex flex-col items-center gap-2 group cursor-pointer ${dimmed ? 'opacity-50' : ''}`}
                    >
                        <div className="w-full flex flex-col-reverse rounded overflow-hidden h-full">
                            <div
                                className="bg-primary/90 hover:bg-primary transition-all"
                                style={{ height: `${normal}%` }}
                            ></div>
                            <div
                                className="bg-amber-400/90 hover:bg-amber-400 transition-all"
                                style={{ height: `${late}%` }}
                            ></div>
                            <div
                                className="bg-red-400/90 hover:bg-red-400 transition-all"
                                style={{ height: `${absent}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
