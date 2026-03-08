import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className={`${inter.variable} font-display bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-slate-100 min-h-screen antialiased`}>
        <I18nProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 flex flex-col">
              <Header />
              {children}
              <MobileNav />
            </main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
