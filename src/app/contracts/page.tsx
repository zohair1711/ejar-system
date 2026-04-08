"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  Filter, 
  ChevronLeft,
  ArrowUpRight,
  MoreVertical,
  Download,
  History,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Badge, Group, Stack, Text, ActionIcon, Menu, TextInput, Select } from "@mantine/core";
import { useState } from "react";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("all");

  const { data: contracts, isLoading, error } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_contract_overview")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredContracts = contracts?.filter(c => {
    const matchesSearch = 
      c.contract_number_internal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.property_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status_internal === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="md">
              إدارة العمليات التعاقدية
            </Badge>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              سجل العقود الموحد
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/80 md:text-base font-medium">
              استعرض، فلتر، وأدر جميع عقود الإيجار الخاصة بالمنشأة من واجهة تحكم ذكية واحدة.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link 
              href="/contracts/new" 
              className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-700 shadow-lg transition hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              إنشاء عقد جديد
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
          title="إجمالي العقود" 
          value={contracts?.length || 0} 
          icon={FileText} 
          color="emerald" 
          hint="كافة العقود المسجلة" 
        />
        <KPI 
          title="عقود نشطة" 
          value={contracts?.filter(c => c.status_internal === 'active').length || 0} 
          icon={History} 
          color="teal" 
          hint="عقود سارية حالياً" 
        />
        <KPI 
          title="عقود مسودة" 
          value={contracts?.filter(c => c.status_internal === 'draft').length || 0} 
          icon={Building2} 
          color="green" 
          hint="تحتاج لإكمال الإجراءات" 
        />
        <KPI 
          title="عقود منتهية" 
          value={contracts?.filter(c => c.status_internal === 'expired').length || 0} 
          icon={Calendar} 
          color="emerald" 
          hint="عقود تجاوزت التاريخ" 
        />
      </div>

      {/* Main Content Area */}
      <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
        {/* Filters & Search Bar */}
        <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث برقم العقد، اسم المستأجر، أو اسم العقار..."
                className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-2 shadow-xs">
                <Filter className="h-4 w-4 text-emerald-500" />
                <select 
                  value={statusFilter || "all"}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-black text-emerald-900 outline-none"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="active">نشط</option>
                  <option value="draft">مسودة</option>
                  <option value="expired">منتهي</option>
                  <option value="ready">جاهز</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-rose-500">
              <AlertCircle className="h-12 w-12" />
              <p className="font-black text-lg">حدث خطأ أثناء تحميل سجل العقود</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-rose-50 px-6 py-2 text-sm font-bold transition hover:bg-rose-100"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredContracts && filteredContracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-emerald-50/30 text-emerald-800/50">
                  <tr>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">رقم العقد</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">المستأجر</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">العقار / الوحدة</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">الفترة الزمنية</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">الحالة</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="font-black text-emerald-950 text-base">{contract.contract_number_internal}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 border border-emerald-200">
                            {contract.tenant_name?.slice(0, 2) || "؟"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-900">{contract.tenant_name || "—"}</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">مستأجر نشط</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-800">{contract.property_name || "—"}</span>
                          <span className="text-xs font-medium text-emerald-600/60">وحدة رقم {contract.unit_number || "—"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-[11px] font-black text-emerald-700/70">
                          <span className="rounded-md bg-emerald-50 px-2 py-1 border border-emerald-100">
                            {new Date(contract.start_date).toLocaleDateString('ar-SA')}
                          </span>
                          <ChevronLeft className="h-3 w-3" />
                          <span className="rounded-md bg-emerald-50 px-2 py-1 border border-emerald-100 text-rose-600/70">
                            {new Date(contract.end_date).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black tracking-tight ${getStatusStyles(contract.status_internal)}`}>
                          {getStatusLabel(contract.status_internal)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-left">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/contracts/${contract.id}`} 
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700"
                          >
                            التفاصيل
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          
                          <Menu shadow="md" width={200} position="bottom-end" radius="lg">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="emerald" radius="md" size="lg">
                                <MoreVertical className="h-5 w-5" />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>إجراءات سريعة</Menu.Label>
                              <Menu.Item leftSection={<Download className="h-4 w-4" />}>تحميل العقد</Menu.Item>
                              <Menu.Item leftSection={<History className="h-4 w-4" />}>سجل التغييرات</Menu.Item>
                              <Menu.Divider />
                              <Menu.Item color="red" leftSection={<Plus className="h-4 w-4 rotate-45" />}>إلغاء العقد</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-6 text-emerald-300">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <FileText className="h-10 w-10" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-emerald-900">لا توجد نتائج مطابقة</p>
                <p className="mt-1 text-sm font-medium text-emerald-600/50">جرب تغيير كلمات البحث أو فلاتر التصفية</p>
              </div>
              <button 
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                className="text-sm font-black text-emerald-600 hover:underline"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>
      </section>
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

function getStatusStyles(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'draft': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'expired': return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'canceled': return 'bg-slate-50 text-slate-700 border border-slate-200';
    default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'active': return 'نشط';
    case 'draft': return 'مسودة';
    case 'expired': return 'منتهي';
    case 'canceled': return 'ملغى';
    default: return status;
  }
}
