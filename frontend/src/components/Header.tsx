'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslation, LOCALE_LABELS, type Locale } from '@/lib/i18n';

function formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
    });
}

function formatTime(date: Date): string {
    return (
        date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: true,
        }) + ' (GMT +7)'
    );
}

export function Header() {
    const [now, setNow] = useState<Date | null>(null);
    const { locale, setLocale } = useTranslation();

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button className="lg:hidden text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {now ? formatDate(now) : '\u00a0'}
                    </p>
                    <p className="text-xs text-slate-400">
                        {now ? formatTime(now) : '\u00a0'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
                        <button
                            key={loc}
                            onClick={() => setLocale(loc)}
                            className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                                locale === loc
                                    ? 'bg-primary text-white'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {LOCALE_LABELS[loc]}
                        </button>
                    ))}
                </div>
                <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">Nguyen Van A</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <Image
                        alt="Profile"
                        className="rounded-full object-cover border-2 border-slate-100 dark:border-slate-800"
                        width={40}
                        height={40}
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwmAnKLNT5bTGYQ0_R0TxSj0WM9eGTDT6CtMHl2uMkZQOG3Vd87X0I95SkUeEt2PvTWH-6dHAYHX9A0doJVs0AdldfzmMNtbvOQyYR7RYGpZ5HZ04YRN7OCce0992aDaC1o3cYVV0ZUFjhFPwB0FkzhSLDPBAXifKmFwG8oyVmt6aaIA1VSt4y0S969Kpez0g51_dsuJNXFmquqqlxnDEirO3DMx6eiE7aHRNLrClwluPJcyNn8hPbGifOTPXw_ELqWhmUZHdy3Dc"
                    />
                </div>
            </div>
        </header>
    );
}
