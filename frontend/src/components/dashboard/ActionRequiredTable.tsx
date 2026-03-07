'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

interface PendingItem { id: number; initials: string; name: string; dept: string; date: string; punchType: string; status: string; }

const defaultData: PendingItem[] = [
    { id: 1, initials: 'TH', name: 'Tran Van Hoang', dept: 'Phong Logistics', date: '21/05/2024', punchType: 'OUT', status: 'pending' },
    { id: 2, initials: 'ML', name: 'Mai Thi Linh', dept: 'Phong Ke toan', date: '20/05/2024', punchType: 'IN', status: 'unsubmitted' },
    { id: 3, initials: 'PN', name: 'Pham Van Nam', dept: 'Kho hang A1', date: '21/05/2024', punchType: 'BOTH', status: 'pending' },
];

const punchTypeBadgeClass: Record<string, string> = {
    OUT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    IN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    BOTH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ActionRequiredTable() {
    const { t } = useTranslation();
    const [items, setItems] = useState<PendingItem[]>(defaultData);

    useEffect(() => {
        fetch('/api/corrections?status=pending')
            .then(r => r.json())
            .then((d: unknown[]) => {
                if (Array.isArray(d) && d.length > 0) {
                    setItems(d.slice(0, 5).map((c: unknown) => {
                        const item = c as Record<string, unknown>;
                        const name = String(item.name || '');
                        return {
                            id: Number(item.id),
                            initials: name.split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase(),
                            name,
                            dept: String(item.dept || ''),
                            date: String(item.date || ''),
                            punchType: String(item.punchType || item.punch_type || 'OUT'),
                            status: String(item.status || 'pending'),
                        };
                    }));
                }
            })
            .catch(() => {});
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">{t('dashboard.pendingCorrections')}</h3>
                    <p className="text-sm text-slate-500">{t('dashboard.missedList')}</p>
                </div>
                <Link className="text-primary text-sm font-semibold hover:underline" href="/corrections">
                    {t('common.viewAll')}
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('attendance.table.name')}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.date')}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('dashboard.missedType')}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.status')}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('common.action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {items.map(({ id, initials, name, dept, date, punchType, status }) => (
                            <tr key={id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-xs">{initials}</div>
                                        <div>
                                            <p className="text-sm font-medium">{name}</p>
                                            <p className="text-xs text-slate-500">{dept}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">{date}</td>
                                <td className="px-6 py-4">
                                    <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ' + (punchTypeBadgeClass[punchType] || '')}>
                                        {t('punch_type.' + punchType)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-slate-500 italic">
                                        {status === 'pending' ? t('corrections.tabPending') : t('status.MISSED_PUNCH')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {status === 'pending' ? (
                                        <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">{t('common.processNow')}</button>
                                    ) : (
                                        <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">{t('common.remind')}</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
