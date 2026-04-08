"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Wallet,
  Bell,
  Search,
  ChevronDown,
  Menu as MenuIcon,
  User,
  Plus
} from "lucide-react";
import { Menu } from "@mantine/core";
import { supabase } from "@/lib/supabase";
import MobileMenu from "./MobileMenu";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/contracts", label: "العقود", icon: FileText },
  { href: "/properties", label: "العقارات", icon: Building2 },
  { href: "/parties", label: "الأطراف", icon: Users },
  { href: "/finance", label: "المالية", icon: Wallet },
  { href: "/offices", label: "المكتب العقاري", icon: Building2 },
];

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [opened, { open, close }] = useDisclosure(false);
  const pathname = usePathname();
  const router = useRouter();

  // If we are on the login page, just render the children without sidebar/header
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-screen">
      {/* Sidebar for Desktop */}
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
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-emerald-100/70 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 group-hover:bg-emerald-500/20 group-hover:text-emerald-400"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{label}</span>
                </Link>
              );
            })}
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

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-emerald-900/5 bg-white/80 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Toggle */}
              <button 
                onClick={open}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm transition-all hover:bg-emerald-50 lg:hidden shrink-0"
                aria-label="القائمة"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm overflow-hidden lg:hidden shrink-0">
                <Image 
                  src="/logos/logoe.png" 
                  alt="Logo Green" 
                  width={28} 
                  height={28} 
                  className="object-contain"
                />
              </div>

              <div className="hidden xs:flex flex-col">
                <h2 className="text-base font-black text-emerald-950 sm:text-xl leading-none">
                  لوحة التحكم
                </h2>
                <p className="text-[10px] text-emerald-600/70 font-medium mt-1">
                  إدارة النظام العقاري
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/50 px-4 py-2.5 shadow-sm focus-within:border-emerald-300 focus-within:bg-white transition-all">
                <Search className="h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  placeholder="ابحث هنا..."
                  className="w-48 xl:w-64 bg-transparent text-sm outline-none placeholder:text-emerald-300 font-medium"
                />
              </div>

              <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:bg-emerald-50 hover:border-emerald-200 shrink-0">
                <Bell className="h-5 w-5 text-emerald-700" />
                <span className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>
              </button>

                <Menu shadow="md" width={200} position="bottom-end" radius="lg">
                  <Menu.Target>
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-1.5 sm:px-3 sm:py-2 shadow-sm shrink-0 cursor-pointer hover:bg-emerald-50 transition-colors">
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-black text-white">
                        ZM
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs font-black text-emerald-950 leading-tight">زهير</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">مدير النظام</p>
                      </div>
                      <ChevronDown className="hidden h-3 w-3 text-emerald-300 sm:block" />
                    </div>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>إعدادات الحساب</Menu.Label>
                    <Menu.Item leftSection={<User className="h-4 w-4" />}>الملف الشخصي</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item 
                      color="red" 
                      leftSection={<Plus className="h-4 w-4 rotate-45" />}
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                      }}
                    >
                      تسجيل الخروج
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
            </div>
          </div>
        </header>

        {/* Mobile Menu Component */}
        <MobileMenu opened={opened} onClose={close} />

        {/* Page content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
