'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import vn from '@/messages/vn.json';
import ko from '@/messages/ko.json';
import en from '@/messages/en.json';

export type Locale = 'vn' | 'ko' | 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
    vn: 'VI',
    ko: 'KO',
    en: 'EN',
};

type DeepRecord = { [key: string]: string | DeepRecord };

const messages: Record<Locale, DeepRecord> = {
    vn: vn as unknown as DeepRecord,
    ko: ko as unknown as DeepRecord,
    en: en as unknown as DeepRecord,
};

function resolve(obj: DeepRecord, path: string): string {
    const keys = path.split('.');
    let cur: string | DeepRecord = obj;
    for (const key of keys) {
        if (typeof cur !== 'object' || cur === null) return path;
        cur = (cur as DeepRecord)[key];
    }
    return typeof cur === 'string' ? cur : path;
}

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('vn');

    useEffect(() => {
        const saved = localStorage.getItem('preferred_locale') as Locale;
        if (saved && LOCALE_LABELS[saved]) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('preferred_locale', newLocale);
    };

    const t = (key: string) => resolve(messages[locale], key);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useTranslation must be inside I18nProvider');
    return ctx;
}
