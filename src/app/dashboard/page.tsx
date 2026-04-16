"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlusCircle,
  TrendingUp,
  Building2,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { RingProgress, Text, Group, Stack, Progress, Badge } from "@mantine/core";

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      // Contracts counts by status
      const statuses = ["active", "draft", "expired", "ready"] as const;
      const contractCounts: Record<string, number> = {};
      await Promise.all(
        statuses.map(async (s) => {
          const { count, error } = await supabase
            .from("contracts")
            .select("id", { count: "exact", head: true })
            .eq("status_internal", s);
          if (error) throw error;
          contractCounts[s] = count ?? 0;
        })
      );
      const { count: contractsTotal, error: contractsTotalErr } = await supabase
        .from("contracts")
        .select("id", { count: "exact", head: true });
      if (contractsTotalErr) throw contractsTotalErr;

      // Units counts by status
      const unitStatuses = ["available", "occupied", "maintenance"] as const;
      const unitCounts: Record<string, number> = {};
      await Promise.all(
        unitStatuses.map(async (s) => {
          const { count, error } = await supabase
            .from("units")
            .select("id", { count: "exact", head: true })
            .eq("status", s);
          if (error) throw error;
          unitCounts[s] = count ?? 0;
        })
      );
      const { count: unitsTotal, error: unitsTotalErr } = await supabase
        .from("units")
        .select("id", { count: "exact", head: true });
      if (unitsTotalErr) throw unitsTotalErr;

      // Invoices sums by status (paid / pending / overdue)
      const fetchInvoicesByStatus = async (status: string) => {
        const { data, error } = await supabase
          .from("contract_invoices")
          .select("total_amount")
          .eq("status", status);
        if (error) throw error;
        const sum =
          data?.reduce((acc, row) => acc + (Number(row.total_amount) || 0), 0) ??
          0;
        return sum;
      };
      const [sumPaid, sumPending, sumOverdue] = await Promise.all([
        fetchInvoicesByStatus("paid"),
        fetchInvoicesByStatus("pending"),
        fetchInvoicesByStatus("overdue"),
      ]);

      // Latest contracts
      const { data: latestContracts, error: latestContractsErr } = await supabase
        .from("v_contract_overview")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (latestContractsErr) throw latestContractsErr;

      // Upcoming due invoices (next 30 days, pending)
      const today = new Date();
      const next30 = new Date();
      next30.setDate(today.getDate() + 30);
      const { data: upcomingInvoices, error: upcomingErr } = await supabase
        .from("contract_invoices")
        .select("id, invoice_number, total_amount, due_date, status")
        .eq("status", "pending")
        .gte("due_date", today.toISOString().slice(0, 10))
        .lte("due_date", next30.toISOString().slice(0, 10))
        .order("due_date", { ascending: true })
        .limit(5);
      if (upcomingErr) throw upcomingErr;

      // Overdue invoices (top 5)
      const { data: overdueInvoices, error: overdueErr } = await supabase
        .from("contract_invoices")
        .select("id, invoice_number, total_amount, due_date, status")
        .eq("status", "overdue")
        .order("due_date", { ascending: true })
        .limit(5);
      if (overdueErr) throw overdueErr;

      // Calculations
      const occupancyRate = unitsTotal ? Math.round((unitCounts.occupied / unitsTotal) * 100) : 0;
      const totalFinance = sumPaid + sumPending + sumOverdue;
      const collectionRate = totalFinance ? Math.round((sumPaid / totalFinance) * 100) : 0;

      return {
        contractsTotal: contractsTotal ?? 0,
        contractCounts,
        unitsTotal: unitsTotal ?? 0,
        unitCounts,
        sumPaid,
        sumPending,
        sumOverdue,
        latestContracts: latestContracts ?? [],
        upcomingInvoices: upcomingInvoices ?? [],
        overdueInvoices: overdueInvoices ?? [],
        occupancyRate,
        collectionRate,
        totalFinance
      };
    },
  });

  return (
    <main className="space-y-8" dir="rtl">
      {/* Hero Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="relative col-span-1 overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl lg:col-span-3">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

          <div className="relative">
            <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="md">
              نظرة عامة على النظام
            </Badge>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              أهلاً بك في نظام إيجار الحديث
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50/80 md:text-base font-medium">
              إدارة العقارات، العقود، والتحصيل المالي أصبحت أسهل. راقب مؤشرات الأداء والعمليات اليومية من واجهة واحدة متكاملة.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/contracts/new" className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-700 shadow-lg transition hover:scale-105 active:scale-95">
                <PlusCircle className="h-5 w-5" />
                إنشاء عقد جديد
              </Link>
              <Link href="/properties/new" className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20">
                <Building2 className="h-5 w-5" />
                إضافة عقار
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Mini-Card */}
        <div className="flex flex-col gap-4 rounded-[32px] border border-emerald-100 bg-emerald-50/30 p-6 backdrop-blur-sm shadow-sm">
          <h3 className="text-xs font-black text-emerald-800/50 uppercase tracking-wider">إحصائيات سريعة</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-bold text-emerald-900">عقود نشطة</span>
              </div>
              <span className="text-sm font-black text-emerald-900">{data?.contractCounts.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                <span className="text-sm font-bold text-emerald-900">وحدات متاحة</span>
              </div>
              <span className="text-sm font-black text-emerald-900">{data?.unitCounts.available || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                <span className="text-sm font-bold text-emerald-900">فواتير متأخرة</span>
              </div>
              <span className="text-sm font-black text-rose-600">{data?.overdueInvoices.length || 0}</span>
            </div>
          </div>
          <div className="mt-auto">
            <Link href="/dashboard" className="flex items-center justify-between rounded-xl bg-white/50 border border-emerald-100 p-3 text-xs font-black text-emerald-700 transition hover:bg-white hover:shadow-sm">
              تقرير مفصل
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-center text-rose-600 border border-rose-100">
          حدث خطأ أثناء تحميل البيانات.
        </div>
      ) : data ? (
        <>
          {/* Visual Performance Indicators */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Occupancy Rate */}
            <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200">
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text size="xs" fw={900} c="dimmed" tt="uppercase" className="tracking-wider">نسبة الإشغال</Text>
                  <Text size="xl" fw={900} className="text-emerald-950 mt-1">{data.occupancyRate}%</Text>
                  <Text size="xs" mt={4} c="dimmed" fw={500}>
                    {data.unitCounts.occupied} من {data.unitsTotal} وحدات
                  </Text>
                </Stack>
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[{ value: data.occupancyRate, color: 'emerald' }]}
                  label={
                    <center>
                      <Home className="h-4 w-4 text-emerald-600" />
                    </center>
                  }
                />
              </Group>
              <Progress value={data.occupancyRate} color="emerald" size="sm" radius="xl" mt="xl" className="bg-emerald-50" />
            </div>

            {/* Collection Rate */}
            <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200">
              <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text size="xs" fw={900} c="dimmed" tt="uppercase" className="tracking-wider">نسبة التحصيل</Text>
                  <Text size="xl" fw={900} className="text-emerald-950 mt-1">{data.collectionRate}%</Text>
                  <Text size="xs" mt={4} c="dimmed" fw={500}>
                    من إجمالي {formatCurrency(data.totalFinance)}
                  </Text>
                </Stack>
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[{ value: data.collectionRate, color: 'teal' }]}
                  label={
                    <center>
                      <TrendingUp className="h-4 w-4 text-teal-600" />
                    </center>
                  }
                />
              </Group>
              <Progress value={data.collectionRate} color="teal" size="sm" radius="xl" mt="xl" className="bg-teal-50" />
            </div>

            {/* Total Contracts KPI */}
            <KPI
              title="إجمالي العقود"
              value={data.contractsTotal}
              icon={FileText}
              color="emerald"
              hint={`نشط: ${data.contractCounts.active ?? 0}`}
            />

            {/* Total Revenue KPI */}
            <KPI
              title="المبالغ المحصلة"
              value={formatCurrency(data.sumPaid)}
              icon={CheckCircle2}
              color="teal"
              hint="إجمالي الإيرادات الفعلية"
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Latest Contracts Table */}
            <section className="lg:col-span-2 overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-50 px-8 py-6">
                <div>
                  <h3 className="text-xl font-black text-emerald-950">أحدث العقود</h3>
                  <p className="mt-1 text-sm font-medium text-emerald-600/50">متابعة آخر العمليات التعاقدية</p>
                </div>
                <Link
                  href="/contracts"
                  className="group flex items-center gap-1 text-sm font-black text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  عرض الكل
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>

              {data.latestContracts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-emerald-50/30 text-emerald-800/50">
                      <tr>
                        <th className="px-8 py-5 font-black uppercase tracking-wider">رقم العقد</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider">المستأجر</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider">العقار / الوحدة</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider">الحالة</th>
                        <th className="px-8 py-5 font-black uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/50">
                      {data.latestContracts.map((c: any) => (
                        <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors group">
                          <td className="px-8 py-5">
                            <span className="font-black text-emerald-950">{c.contract_number_internal}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700">
                                {c.tenant_name?.slice(0, 2) || "؟"}
                              </div>
                              <span className="font-bold text-emerald-900">{c.tenant_name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-emerald-700/70 font-bold">
                            {c.property_name || "—"} • {c.unit_number || "—"}
                          </td>
                          <td className="px-8 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black tracking-tight ${getContractStatusChip(c.status_internal)}`}
                            >
                              {statusLabel(c.status_internal)}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                             <Link href={`/contracts/${c.id}`} className="text-emerald-600 hover:text-emerald-800 font-black text-xs">التفاصيل</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-emerald-200" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-emerald-300">لا توجد عقود مسجلة حالياً</p>
                </div>
              )}
            </section>

            {/* Financial Alerts Sidebar */}
            <div className="space-y-6">
              {/* Overdue Alerts */}
              <section className="overflow-hidden rounded-[32px] border border-rose-100 bg-rose-50/30 p-1 shadow-sm">
                <div className="rounded-[30px] bg-white p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-black text-emerald-950 tracking-tight">متأخرات مالية</h3>
                    </div>
                    <Badge color="red" variant="light" size="sm" radius="md">{data.overdueInvoices.length}</Badge>
                  </div>

                  {data.overdueInvoices.length > 0 ? (
                    <div className="space-y-4">
                      {data.overdueInvoices.map((inv: any) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between rounded-2xl border border-emerald-50 p-4 transition hover:border-rose-200 hover:bg-rose-50/50"
                        >
                          <div>
                            <p className="text-sm font-black text-emerald-950">
                              {inv.invoice_number || `INV-${inv.id.slice(0, 6)}`}
                            </p>
                            <p className="text-[10px] font-bold text-rose-500 mt-1">
                              تأخر: {formatDate(inv.due_date)}
                            </p>
                          </div>
                          <p className="text-sm font-black text-rose-600">
                            {formatCurrency(inv.total_amount)}
                          </p>
                        </div>
                      ))}
                      <Link href="/finance" className="block text-center text-xs font-black text-rose-600 hover:underline mt-2">
                        متابعة التحصيل المالي
                      </Link>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm font-bold text-emerald-300">
                      لا توجد متأخرات حالياً ✨
                    </div>
                  )}
                </div>
              </section>

              {/* Upcoming Payments */}
              <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-emerald-950 tracking-tight">دفعات قادمة</h3>
                  <Clock className="h-5 w-5 text-emerald-500" />
                </div>

                {data.upcomingInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcomingInvoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                          <div>
                            <p className="text-xs font-bold text-emerald-900">{inv.invoice_number}</p>
                            <p className="text-[10px] font-bold text-emerald-400">{formatDate(inv.due_date)}</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-emerald-950">
                          {formatCurrency(inv.total_amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs font-bold text-emerald-300">
                    لا توجد دفعات قريبة
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
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

function getContractStatusChip(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "draft":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "expired":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "ready":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-emerald-50/50 text-emerald-600 border border-emerald-100";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "نشط";
    case "draft":
      return "مسودة";
    case "expired":
      return "منتهي";
    case "ready":
      return "جاهز";
    default:
      return status;
  }
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ar-SA");
  } catch {
    return d;
  }
}

function formatCurrency(n?: number | null) {
  const x = Number(n || 0);
  return `${x.toLocaleString('ar-SA')} ر.س`;
}
