import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Link from "next/link";
import Image from "next/image";
import { ColorSchemeScript } from "@mantine/core";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Wallet,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "EJAR System",
  description: "Advanced Real Estate Management System",
};

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/contracts", label: "العقود", icon: FileText },
  { href: "/properties", label: "العقارات", icon: Building2 },
  { href: "/parties", label: "الأطراف", icon: Users },
  { href: "/finance", label: "المالية", icon: Wallet },
  { href: "/offices", label: "المكتب العقاري", icon: Building2 },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="ej-body font-sans antialiased">
        <Providers>
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(52,211,153,0.05),_transparent_25%),linear-gradient(to_bottom,_#fdfdfd,_#f0fdf4)] text-emerald-950">
            <div className="mx-auto flex min-h-screen">
              {/* Sidebar */}
              <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-emerald-900/10 bg-emerald-950 text-emerald-50 shadow-2xl">
                <div className="flex h-24 items-center gap-4 border-b border-white/5 px-6">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl border border-white/10 overflow-hidden p-2">
                    <Image 
                      src="/logos/logo.png" 
                      alt="Logo White" 
                      width={40} 
                      height={40} 
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-emerald-400/60 uppercase tracking-widest">منصة إدارة العقود</p>
                    <h1 className="text-xl font-bold tracking-tight text-white">نظام إيجار</h1>
                  </div>
                </div>

                <div className="flex-1 px-4 py-6">
                  <p className="mb-3 px-3 text-[10px] font-bold tracking-widest text-emerald-500/40 uppercase">
                    التنقل الرئيسي
                  </p>

                  <nav className="space-y-1.5">
                    {navItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-emerald-100/70 transition-all duration-200 hover:bg-white/5 hover:text-white"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-all group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>{label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="border-t border-white/5 p-4">
                  <div className="rounded-3xl bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 p-4 backdrop-blur border border-white/5">
                    <p className="text-[10px] font-bold text-emerald-500/50 uppercase">حالة النظام</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      <p className="text-xs font-bold text-emerald-50">جاهز للعمل</p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main */}
              <div className="flex min-h-screen flex-1 flex-col">
                {/* Topbar */}
                <header className="sticky top-0 z-40 border-b border-emerald-900/5 bg-white/80 backdrop-blur-xl">
                  <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm lg:hidden overflow-hidden">
                        <Image 
                          src="/logos/logoe.png" 
                          alt="Logo Green" 
                          width={32} 
                          height={32} 
                          className="object-contain"
                        />
                      </div>

                      <div>
                        <h2 className="text-lg font-black text-emerald-950 sm:text-xl">
                          لوحة التحكم
                        </h2>
                        <p className="text-xs text-emerald-600/70 font-medium">
                          إدارة النظام العقاري والعمليات
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/50 px-4 py-2.5 shadow-sm focus-within:border-emerald-300 focus-within:bg-white transition-all">
                        <Search className="h-4 w-4 text-emerald-400" />
                        <input
                          type="text"
                          placeholder="ابحث هنا..."
                          className="w-64 bg-transparent text-sm outline-none placeholder:text-emerald-300 font-medium"
                        />
                      </div>

                      <button className="relative rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm transition hover:bg-emerald-50 hover:border-emerald-200">
                        <Bell className="h-5 w-5 text-emerald-700" />
                        <span className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>
                      </button>

                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white">
                          ZM
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-sm font-black text-emerald-950 leading-tight">زهير</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">مدير النظام</p>
                        </div>
                        <ChevronDown className="hidden h-4 w-4 text-emerald-300 sm:block" />
                      </div>
                    </div>
                  </div>
                </header>

                {/* Page content */}
                <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}