'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

const mobileNavItems = [
    { href: '/', icon: 'dashboard', key: 'nav.dashboard' },
    { href: '/employees', icon: 'group', key: 'nav.employees' },
    { href: '/attendance', icon: 'calendar_today', key: 'nav.dailyAttendance' },
    { href: '/report', icon: 'bar_chart', key: 'nav.monthlyReport' },
    { href: '/corrections', icon: 'edit_calendar', key: 'nav.corrections' },
    { href: '/holidays', icon: 'holiday_village', key: 'nav.holidays' },
    { href: '/settings', icon: 'settings', key: 'nav.settings' },
];

export function MobileNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <>
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-between z-20">
                {mobileNavItems.map(({ href, icon, key }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400'}`}
                        >
                            <span className="material-symbols-outlined text-[22px]">{icon}</span>
                            <span className="text-[9px] font-medium truncate max-w-[48px] text-center">{t(key)}</span>
                        </Link>
                    );
                })}
            </div>
            <div className="lg:hidden h-16"></div>
        </>
    );
}
