"use client";

import { Drawer, ScrollArea, NavLink, Box, Stack, Badge, Group, Text, ThemeIcon } from "@mantine/core";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Users, 
  Wallet,
  X
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/contracts", label: "العقود", icon: FileText },
  { href: "/properties", label: "العقارات", icon: Building2 },
  { href: "/parties", label: "الأطراف", icon: Users },
  { href: "/finance", label: "المالية", icon: Wallet },
  { href: "/offices", label: "المكتب العقاري", icon: Building2 },
];

interface MobileMenuProps {
  opened: boolean;
  onClose: () => void;
}

export default function MobileMenu({ opened, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="xs"
      padding="0"
      withCloseButton={false}
      position="left"
      styles={{
        content: {
          backgroundColor: "#022c22", // emerald-950
          color: "#ecfdf5", // emerald-50
        },
      }}
    >
      <Box className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-24 items-center justify-between border-b border-white/5 px-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl border border-white/10 overflow-hidden p-2">
              <Image 
                src="/logos/logo.png" 
                alt="Logo White" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[8px] font-medium text-emerald-400/60 uppercase tracking-widest">نظام إيجار</p>
              <h1 className="text-lg font-bold tracking-tight text-white">إدارة العقود</h1>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-emerald-100/70 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-8">
          <p className="mb-4 px-3 text-[10px] font-bold tracking-widest text-emerald-500/40 uppercase">
            التنقل الرئيسي
          </p>

          <Stack gap="xs">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-200 ${
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
          </Stack>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-white/5 p-6">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 p-4 backdrop-blur border border-white/5">
            <p className="text-[10px] font-bold text-emerald-500/50 uppercase">حالة النظام</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <p className="text-xs font-bold text-emerald-50">متصل الآن</p>
            </div>
          </div>
        </div>
      </Box>
    </Drawer>
  );
}
