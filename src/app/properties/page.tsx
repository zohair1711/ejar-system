"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  MoreVertical, 
  LayoutGrid, 
  List, 
  ChevronLeft,
  ArrowUpRight,
  Download,
  Filter,
  Home,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Group, Stack, Text, ActionIcon, Menu, Progress, RingProgress } from "@mantine/core";

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState("");

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          offices (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProperties = properties?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.district?.toLowerCase().includes(searchTerm.toLowerCase())
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
              إدارة المحفظة العقارية
            </Badge>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              إدارة العقارات والمجمعات
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/80 md:text-base font-medium">
              تتبع عقاراتك، وحداتك، وحالة الإشغال في كل مجمع عقاري من واجهة مركزية واحدة.
            </p>
          </div>

          <div className="flex flex-row gap-2 sm:gap-3">
            <Link 
              href="/properties/new" 
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 sm:px-6 text-xs sm:text-sm font-black text-emerald-700 shadow-lg transition hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              إضافة عقار جديد
            </Link>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 sm:px-6 text-xs sm:text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20 whitespace-nowrap">
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              تقرير العقارات
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPI 
          title="إجمالي العقارات" 
          value={properties?.length || 0} 
          icon={Building2} 
          color="emerald" 
          hint="مجمعات وعقارات مسجلة" 
        />
        <KPI 
          title="عقارات نشطة" 
          value={properties?.filter(p => p.status === 'active').length || 0} 
          icon={Home} 
          color="teal" 
          hint="عقود تأجير سارية" 
        />
        <KPI 
          title="عقارات قيد التطوير" 
          value={properties?.filter(p => p.status === 'draft').length || 0} 
          icon={Filter} 
          color="green" 
          hint="تحت التجهيز للنظام" 
        />
        <KPI 
          title="توزيع المناطق" 
          value={new Set(properties?.map(p => p.city)).size || 0} 
          icon={MapPin} 
          color="emerald" 
          hint="تغطية جغرافية حالية" 
        />
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم العقار، المدينة، أو الكود..."
            className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
          />
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:bg-emerald-50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
            شبكة
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:bg-emerald-50'}`}
          >
            <List className="h-4 w-4" />
            جدول
          </button>
        </div>
      </div>

      {/* Loading/Error/Data Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-[32px] bg-rose-50 p-12 text-center border border-rose-100">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <p className="text-xl font-black text-rose-900">فشل في تحميل سجل العقارات</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-black text-rose-600 underline">إعادة المحاولة</button>
        </div>
      ) : filteredProperties && filteredProperties.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <div key={property.id} className="group relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-200">
                <div className="rounded-[30px] p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-colors group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600">
                      <Building2 className="h-7 w-7" />
                    </div>
                    
                    <Menu shadow="md" width={180} position="bottom-end" radius="lg">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="emerald" radius="md" size="lg">
                          <MoreVertical className="h-5 w-5" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<Plus className="h-4 w-4" />}>إضافة وحدة</Menu.Item>
                        <Menu.Item leftSection={<Download className="h-4 w-4" />}>تحميل البيانات</Menu.Item>
                        <Menu.Divider />
                        <Menu.Item color="red" leftSection={<AlertCircle className="h-4 w-4" />}>حذف العقار</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex rounded-full px-3 py-0.5 text-[10px] font-black tracking-tight ${getStatusStyles(property.status)}`}>
                        {getStatusLabel(property.status)}
                      </span>
                      <span className="inline-flex rounded-full px-3 py-0.5 text-[10px] font-black tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                        {property.property_type === 'residential' ? 'سكني' : 'تجاري'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-emerald-950 mb-1 group-hover:text-emerald-700 transition-colors">{property.name}</h3>
                    <div className="flex items-center gap-1.5 text-emerald-600/60 text-xs font-bold mb-6">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{property.city}، {property.district}</span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800/40 uppercase">نسبة الإشغال المتوقعة</span>
                        <span className="font-black text-emerald-950">75%</span>
                      </div>
                      <Progress value={75} color="emerald" size="sm" radius="xl" className="bg-emerald-50" />
                    </div>

                    <div className="flex items-center justify-between border-t border-emerald-50 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-800/30 uppercase tracking-tighter leading-none">المكتب التابع</span>
                        <span className="text-xs font-black text-emerald-800">{(property as any).offices?.name || "مكتب رئيسي"}</span>
                      </div>
                      
                      <Link
                        href={`/properties/${property.id}`}
                        className="flex items-center gap-1 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        التفاصيل
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-emerald-50/30 text-emerald-800/50">
                  <tr>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">اسم العقار</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">الموقع</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">النوع</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">المكتب</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">الحالة</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50">
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-8 py-5 font-black text-emerald-950 text-base">{property.name}</td>
                      <td className="px-8 py-5 font-bold text-emerald-700/70">{property.city}، {property.district}</td>
                      <td className="px-8 py-5">
                        <Badge variant="light" color="emerald" size="sm" radius="md">
                          {property.property_type === 'residential' ? 'سكني' : 'تجاري'}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 font-bold text-emerald-800">{(property as any).offices?.name || "—"}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black tracking-tight ${getStatusStyles(property.status)}`}>
                          {getStatusLabel(property.status)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-left">
                        <Link 
                          href={`/properties/${property.id}`} 
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 transition-all"
                        >
                          عرض
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      ) : (
        <div className="flex h-96 flex-col items-center justify-center gap-6 text-emerald-300 bg-white rounded-[40px] border border-dashed border-emerald-200">
          <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center">
            <Building2 className="h-12 w-12" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-950">سجل العقارات فارغ</p>
            <p className="mt-1 text-sm font-medium text-emerald-600/50">ابدأ بإضافة أول عقار لإدارة وحداته وعقوده في النظام</p>
          </div>
          <Link
            href="/properties/new"
            className="rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
          >
            إضافة أول عقار للمحفظة
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

function getStatusStyles(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'draft': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'inactive': return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'archived': return 'bg-slate-50 text-slate-700 border border-slate-200';
    default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'active': return 'نشط';
    case 'draft': return 'مسودة';
    case 'inactive': return 'غير نشط';
    case 'archived': return 'مؤرشف';
    default: return status;
  }
}
