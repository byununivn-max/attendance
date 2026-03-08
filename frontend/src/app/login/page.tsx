'use client';

import { signIn } from 'next-auth/react';
import { useTranslation } from '@/lib/i18n';
import Image from 'next/image';

export default function LoginPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="p-8 text-center sm:p-12">
                    <div className="flex justify-center mb-6">
                        <div className="bg-primary rounded-xl font-black text-white w-16 h-16 flex items-center justify-center text-3xl shadow-lg shadow-primary/30">
                            C
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                        UNI Customs
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                        Sign in to access the Attendance Dashboard
                    </p>

                    <button
                        onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-6 py-3.5 rounded-lg text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    >
                        <svg viewBox="0 0 23 23" className="w-5 h-5">
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        Sign in with Microsoft
                    </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
                    Secure login powered by Microsoft Entra ID
                </div>
            </div>
        </div>
    );
}
