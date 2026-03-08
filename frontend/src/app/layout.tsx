import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'UNI Customs - Hệ Thống Quản Lý Chấm Công',
  description: 'Hikvision Facial Recognition-based Attendance Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="light">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={`${inter.variable} font-display bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-slate-100 min-h-screen antialiased`}>
        <Providers>
          <I18nProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
