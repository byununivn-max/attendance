'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Hide navigation elements on login page
    if (pathname === '/login') {
        return <main className="flex-1 flex flex-col">{children}</main>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 flex flex-col">
                <Header />
                {children}
                <MobileNav />
            </main>
        </div>
    );
}
