'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

const mockData = [
    { initials: 'TH', name: 'Trần Văn Hoàng', dept: 'Phòng Logistics', date: '21/05/2024', punchType: 'OUT', statusLabel: 'Đang chờ duyệt', action: 'process' },
    { initials: 'ML', name: 'Mai Thị Linh', dept: 'Phòng Kế toán', date: '20/05/2024', punchType: 'IN', statusLabel: 'Chưa gửi đơn', action: 'remind' },
    { initials: 'PN', name: 'Phạm Văn Nam', dept: 'Kho hàng A1', date: '21/05/2024', punchType: 'BOTH', statusLabel: 'Đang chờ duyệt', action: 'process' },
];

const punchTypeBadgeClass: Record<string, string> = {
    OUT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    IN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    BOTH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ActionRequiredTable() {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">{t('dashboard.pendingCorrections')}</h3>
                    <p className="text-sm text-slate-500">Danh sách nhân viên thiếu dữ liệu chấm công</p>
                </div>
                <Link className="text-primary text-sm font-semibold hover:underline" href="/corrections">
                    Xem tất cả
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t('attendance.table.name')}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t('common.date')}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Loại thiếu hụt
                            </th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t('common.status')}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                                {t('common.action')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {mockData.map(({ initials, name, dept, date, punchType, statusLabel, action }) => (
                            <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-xs">
                                            {initials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{name}</p>
                                            <p className="text-xs text-slate-500">{dept}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">{date}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${punchTypeBadgeClass[punchType]}`}>
                                        {t(`punch_type.${punchType}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-slate-500 italic">{statusLabel}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {action === 'process' ? (
                                        <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                            Xử lý ngay
                                        </button>
                                    ) : (
                                        <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                            Nhắc nhở
                                        </button>
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
