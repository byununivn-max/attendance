
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

function formatDate(date: Date): string {
  return date.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function formatTime(date: Date): string {
  return (
    date.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh", hour12: true,
    }) + " (GMT +7)"
  );
}

interface Notification {
  id: number; empCode: string; name: string; date: string; punchType: string;
}

export function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const { locale, setLocale } = useTranslation();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { data: session } = useSession();
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/corrections?status=PENDING")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotifications(d.slice(0, 5)); })
      .catch(() => { });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-600 dark:text-slate-400">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div>
          <p className="text-sm font-medium text-slate-500">{now ? formatDate(now) : " "}</p>
          <p className="text-xs text-slate-400">{now ? formatTime(now) : " "}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
            <button key={loc} onClick={() => setLocale(loc)}
              className={"px-2.5 py-1 text-xs font-semibold transition-colors " + (locale === loc ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
            className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-sm">Pending Corrections</span>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">No pending items</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((n) => (
                    <li key={n.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <p className="text-sm font-medium">{n.name || n.empCode}</p>
                      <p className="text-xs text-slate-500">{String(n.date)} &middot; {n.punchType}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                <Link href="/corrections" onClick={() => setShowNotif(false)}
                  className="text-xs text-primary hover:underline">View all corrections &rarr;</Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button onClick={() => { setShowUser(!showUser); setShowNotif(false); }}
            className="flex items-center gap-3 cursor-pointer group rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                {session?.user?.name || "Administrator"}
              </p>
              <p className="text-xs text-slate-500">UNI Customs</p>
            </div>
            {session?.user?.image ? (
              <img src={session.user.image} alt="User" className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-slate-100 dark:border-slate-800">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}
              </div>
            )}
          </button>
          {showUser && (
            <div className="absolute right-0 top-12 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold">{session?.user?.name || "Administrator"}</p>
                <p className="text-xs text-slate-500">{session?.user?.email || "admin@eximuni.com"}</p>
              </div>
              <ul className="py-1">
                <li>
                  <Link href="/settings" onClick={() => setShowUser(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-base text-slate-500">settings</span>
                    Settings
                  </Link>
                </li>
                <li>
                  <button onClick={() => { setShowUser(false); signOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
