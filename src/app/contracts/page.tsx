"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Search, FileText, Calendar, Building, User } from "lucide-react";
import Link from "next/link";

export default function ContractsPage() {
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

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">إدارة العقود</h1>
            <p className="mt-1 text-slate-500">إدارة ومتابعة جميع عقود الإيجار في النظام</p>
          </div>

          <Link
            href="/contracts/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>إنشاء عقد جديد</span>
          </Link>
        </div>

        {/* Stats Summary (Optional but nice) */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "إجمالي العقود", value: contracts?.length || 0, icon: FileText, color: "blue" },
            { label: "عقود نشطة", value: contracts?.filter(c => c.status_internal === 'active').length || 0, icon: Calendar, color: "green" },
            { label: "عقود مسودة", value: contracts?.filter(c => c.status_internal === 'draft').length || 0, icon: Building, color: "orange" },
            { label: "عقود منتهية", value: contracts?.filter(c => c.status_internal === 'expired').length || 0, icon: User, color: "red" },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl bg-${stat.color}-50 p-3 text-${stat.color}-600`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="البحث برقم العقد، اسم المستأجر أو العقار..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500">
            <option>جميع الحالات</option>
            <option>نشط</option>
            <option>مسودة</option>
            <option>منتهي</option>
          </select>
        </div>

        {/* Contracts Table/Grid */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-500">
              <p>حدث خطأ أثناء جلب البيانات</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-blue-600 underline"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : contracts && contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">رقم العقد</th>
                    <th className="px-6 py-4 font-semibold">المستأجر</th>
                    <th className="px-6 py-4 font-semibold">العقار / الوحدة</th>
                    <th className="px-6 py-4 font-semibold">التاريخ</th>
                    <th className="px-6 py-4 font-semibold">الحالة</th>
                    <th className="px-6 py-4 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                        {contract.contract_number_internal}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{contract.tenant_name}</span>
                          <span className="text-xs text-slate-500">مستأجر</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{contract.property_name}</span>
                          <span className="text-xs text-slate-500">وحدة: {contract.unit_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-slate-500">
                          <span>من: {new Date(contract.start_date).toLocaleDateString('ar-SA')}</span>
                          <span>إلى: {new Date(contract.end_date).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyles(contract.status_internal)}`}>
                          {getStatusLabel(contract.status_internal)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">عرض التفاصيل</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-500">
              <FileText className="h-12 w-12 text-slate-300" />
              <div className="text-center">
                <p className="font-medium">لا توجد عقود مسجلة</p>
                <p className="text-sm">ابدأ بإنشاء أول عقد في النظام</p>
              </div>
              <Link
                href="/contracts/new"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                إنشاء عقد جديد
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 border border-green-200';
    case 'draft': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'expired': return 'bg-red-50 text-red-700 border border-red-200';
    case 'canceled': return 'bg-slate-50 text-slate-700 border border-slate-200';
    default: return 'bg-blue-50 text-blue-700 border border-blue-200';
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