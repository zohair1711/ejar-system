"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Search, 
  User, 
  Users, 
  Phone, 
  Mail, 
  MoreVertical, 
  ShieldCheck, 
  Building2, 
  Download,
  Filter,
  ArrowUpRight,
  UserCheck,
  UserPlus,
  Building,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Group, Stack, Text, ActionIcon, Menu, Avatar } from "@mantine/core";

export default function PartiesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: parties, isLoading, error } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredParties = parties?.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.national_id?.includes(searchTerm) ||
    p.mobile?.includes(searchTerm) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="md">
              إدارة أطراف النظام
            </Badge>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              المستأجرون والمؤجرون
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/80 md:text-base font-medium">
              قاعدة بيانات شاملة لجميع الأطراف المتعاملة في النظام، مع إمكانية تتبع الحالة والبيانات الشخصية والمنشآت.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link 
              href="/parties/new" 
              className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-700 shadow-lg transition hover:scale-105 active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              إضافة طرف جديد
            </Link>
            <button className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20">
              <Download className="h-5 w-5" />
              تصدير البيانات
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPI 
          title="إجمالي الأطراف" 
          value={parties?.length || 0} 
          icon={Users} 
          color="emerald" 
          hint="كافة الأفراد والمنشآت" 
        />
        <KPI 
          title="أفراد (Individuals)" 
          value={parties?.filter(p => p.party_type === 'individual').length || 0} 
          icon={User} 
          color="teal" 
          hint="مستأجرون ومؤجرون أفراد" 
        />
        <KPI 
          title="منشآت (Organizations)" 
          value={parties?.filter(p => p.party_type === 'organization').length || 0} 
          icon={Building} 
          color="green" 
          hint="شركات ومؤسسات عقارية" 
        />
        <KPI 
          title="أطراف نشطة" 
          value={parties?.filter(p => p.is_active).length || 0} 
          icon={UserCheck} 
          color="emerald" 
          hint="أطراف لديها عقود سارية" 
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، رقم الهوية، السجل التجاري أو الجوال..."
            className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
          />
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-sm">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-all">
            <Filter className="h-4 w-4" />
            تصفية متقدمة
          </button>
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-[32px] bg-rose-50 p-12 text-center border border-rose-100">
          <p className="text-xl font-black text-rose-900">حدث خطأ أثناء تحميل سجل الأطراف</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-black text-rose-600 underline">إعادة المحاولة</button>
        </div>
      ) : filteredParties && filteredParties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredParties.map((party) => (
            <div key={party.id} className="group relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-200">
              <div className="rounded-[30px] p-6">
                <div className="mb-6 flex items-start justify-between">
                  <Avatar 
                    size={56} 
                    radius="xl" 
                    className="border-2 border-emerald-50 shadow-sm"
                    src={null}
                    color={party.party_type === 'individual' ? 'emerald' : 'teal'}
                  >
                    {party.party_type === 'individual' ? <User className="h-6 w-6" /> : <Building className="h-6 w-6" />}
                  </Avatar>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="light" 
                      color={party.is_active ? 'emerald' : 'gray'} 
                      size="sm" 
                      radius="md"
                      className="font-black"
                    >
                      {party.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                    
                    <Menu shadow="md" width={180} position="bottom-end" radius="lg">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="emerald" radius="md" size="lg">
                          <MoreVertical className="h-5 w-5" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<FileText className="h-4 w-4" />}>عرض العقود</Menu.Item>


                        <Menu.Item leftSection={<Mail className="h-4 w-4" />}>إرسال بريد</Menu.Item>
                        <Menu.Divider />
                        <Menu.Item color="red" leftSection={<Plus className="h-4 w-4 rotate-45" />}>تعطيل الطرف</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-black text-emerald-950 mb-1 group-hover:text-emerald-700 transition-colors">{party.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-emerald-600/60 text-xs font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>
                      {party.party_type === 'individual' 
                        ? `رقم الهوية: ${party.national_id || '—'}` 
                        : `سجل تجاري: ${party.cr_number || '—'}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-emerald-50/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-emerald-900">
                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span>{party.mobile || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-emerald-900">
                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate max-w-[180px]">{party.email || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-800/30 uppercase tracking-tighter leading-none">تصنيف الطرف</span>
                    <span className="text-xs font-black text-emerald-700">{getRoleHintLabel(party.role_hint)}</span>
                  </div>
                  
                  <Link
                    href={`/parties/${party.id}`}
                    className="flex items-center gap-1 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    الملف الكامل
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center gap-6 text-emerald-300 bg-white rounded-[40px] border border-dashed border-emerald-200">
          <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center">
            <Users className="h-12 w-12" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-950">سجل الأطراف فارغ</p>
            <p className="mt-1 text-sm font-medium text-emerald-600/50">ابدأ بإضافة أول مستأجر أو مؤجر لإدارة بياناته في النظام</p>
          </div>
          <Link
            href="/parties/new"
            className="rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
          >
            إضافة طرف جديد
          </Link>
        </div>
      )}
    </main>
  );
}

function KPI({
  title,
  value,
  icon: Icon,
  color,
  hint,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  hint?: string;
}) {
  const styles: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-100 border-emerald-200/60 text-emerald-700",
    teal: "from-teal-500/10 to-teal-100 border-teal-200/60 text-teal-700",
    green: "from-green-500/10 to-green-100 border-green-200/60 text-green-700",
  };

  return (
    <div className="group rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">{title}</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-emerald-950">{value}</h3>
          {hint ? <p className="mt-2 text-[10px] font-bold text-emerald-500/50 tracking-tight">{hint}</p> : null}
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${styles[color] ?? styles.emerald}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function getRoleHintLabel(role: string) {
  switch (role) {
    case 'lessor': return 'مؤجر (Lessor)';
    case 'tenant': return 'مستأجر (Tenant)';
    case 'broker': return 'وسيط (Broker)';
    case 'agent': return 'وكيل (Agent)';
    default: return 'طرف متعامل';
  }
}
