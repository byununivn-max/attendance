'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

const navItems = [
    { href: '/', icon: 'dashboard', key: 'nav.dashboard' },
    { href: '/employees', icon: 'group', key: 'nav.employees' },
    { href: '/attendance', icon: 'calendar_today', key: 'nav.dailyAttendance' },
    { href: '/report', icon: 'bar_chart', key: 'nav.monthlyReport' },
    { href: '/corrections', icon: 'edit_calendar', key: 'nav.corrections' },
    { href: '/holidays', icon: 'holiday_village', key: 'nav.holidays' },
    { href: '/devices', icon: 'devices', key: 'nav.devices' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full transition-all">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary rounded-lg font-black text-white w-8 h-8 flex items-center justify-center">
                        C
                    </div>
                    <h1 className="font-bold text-xl tracking-tight">UNI Customs</h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map(({ href, icon, key }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span>{t(key)}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800">
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${pathname === '/settings'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <span>{t('nav.settings')}</span>
                </Link>
            </div>
        </aside>
    );
}
