"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, Building, User, MapPin, Calendar, FileText, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@mantine/core";

const contractSchema = z.object({
  office_id: z.string().uuid("يرجى اختيار المكتب"),
  property_id: z.string().uuid("يرجى اختيار العقار"),
  unit_id: z.string().uuid("يرجى اختيار الوحدة"),
  lessor_party_id: z.string().uuid("يرجى اختيار المؤجر"),
  tenant_party_id: z.string().uuid("يرجى اختيار المستأجر"),
  contract_number_internal: z.string().min(1, "يرجى إدخال رقم العقد الداخلي"),
  start_date: z.string().min(1, "يرجى تحديد تاريخ البدء"),
  end_date: z.string().min(1, "يرجى تحديد تاريخ الانتهاء"),
  contract_category: z.enum(["residential", "commercial"]),
  rent_amount: z.coerce.number().min(0, "يجب أن يكون مبلغ الإيجار 0 أو أكثر"),
  payment_frequency: z.enum(["monthly", "quarterly", "semi-annual", "annual"]),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function NewContractPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: {
      contract_category: "residential",
      payment_frequency: "monthly",
      rent_amount: 0,
    },
  });

  const selectedOfficeId = watch("office_id");
  const selectedPropertyId = watch("property_id");

  // Fetch Offices
  const { data: offices } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offices").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch Properties for selected office
  const { data: properties } = useQuery({
    queryKey: ["properties", selectedOfficeId],
    queryFn: async () => {
      if (!selectedOfficeId) return [];
      const { data, error } = await supabase.from("properties").select("id, name").eq("office_id", selectedOfficeId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOfficeId,
  });

  // Fetch Units for selected property
  const { data: units } = useQuery({
    queryKey: ["units", selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      const { data, error } = await supabase.from("units").select("id, unit_number").eq("property_id", selectedPropertyId).eq("status", "available");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPropertyId,
  });

  // Fetch Parties (Lessor & Tenant)
  const { data: parties } = useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parties").select("id, full_name, role_hint");
      if (error) throw error;
      return data;
    },
  });

  const createContract = useMutation({
    mutationFn: async (values: ContractFormValues) => {
      // 1. Insert into contracts
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .insert([
          {
            office_id: values.office_id,
            property_id: values.property_id,
            unit_id: values.unit_id,
            lessor_party_id: values.lessor_party_id,
            tenant_party_id: values.tenant_party_id,
            contract_number_internal: values.contract_number_internal,
            start_date: values.start_date,
            end_date: values.end_date,
            contract_category: values.contract_category,
          },
        ])
        .select()
        .single();

      if (contractError) throw contractError;

      // 2. Insert into contract_financial_info
      const { error: financialError } = await supabase
        .from("contract_financial_info")
        .insert([
          {
            contract_id: contractData.id,
            rent_amount: values.rent_amount,
            payment_frequency: values.payment_frequency,
          },
        ]);

      if (financialError) throw financialError;

      return contractData;
    },
    onSuccess: () => {
      router.push("/contracts");
      router.refresh();
    },
  });

  const onSubmit = (values: ContractFormValues) => {
    createContract.mutate(values);
  };

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/contracts"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div>
              <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="xs">
                إدارة العقود
              </Badge>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                إنشاء عقد جديد
              </h1>
              <p className="mt-1 text-sm font-medium text-emerald-50/80">قم بتعبئة البيانات التالية لإنشاء عقد إيجار</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-8">
        {/* Office & Property Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Building className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">بيانات العقار والوحدة</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">المكتب العقاري</label>
                <select
                  {...register("office_id")}
                  className={`w-full rounded-2xl border ${errors.office_id ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="">اختر المكتب...</option>
                  {offices?.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                {errors.office_id && <p className="text-xs font-bold text-rose-500">{errors.office_id.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">العقار</label>
                <select
                  {...register("property_id")}
                  disabled={!selectedOfficeId}
                  className={`w-full rounded-2xl border ${errors.property_id ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 disabled:bg-emerald-50/50 disabled:text-emerald-300`}
                >
                  <option value="">اختر العقار...</option>
                  {properties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.property_id && <p className="text-xs font-bold text-rose-500">{errors.property_id.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الوحدة</label>
                <select
                  {...register("unit_id")}
                  disabled={!selectedPropertyId}
                  className={`w-full rounded-2xl border ${errors.unit_id ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 disabled:bg-emerald-50/50 disabled:text-emerald-300`}
                >
                  <option value="">اختر الوحدة...</option>
                  {units?.map((u) => (
                    <option key={u.id} value={u.id}>وحدة رقم {u.unit_number}</option>
                  ))}
                </select>
                {errors.unit_id && <p className="text-xs font-bold text-rose-500">{errors.unit_id.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع العقد</label>
                <div className="flex gap-4 p-1.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-all has-[:checked]:bg-emerald-600 has-[:checked]:text-white has-[:checked]:shadow-lg text-emerald-600">
                    <input type="radio" {...register("contract_category")} value="residential" className="sr-only" />
                    سكني
                  </label>
                  <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-all has-[:checked]:bg-emerald-600 has-[:checked]:text-white has-[:checked]:shadow-lg text-emerald-600">
                    <input type="radio" {...register("contract_category")} value="commercial" className="sr-only" />
                    تجاري
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parties Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">أطراف العقد</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">المؤجر</label>
                <select
                  {...register("lessor_party_id")}
                  className={`w-full rounded-2xl border ${errors.lessor_party_id ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="">اختر المؤجر...</option>
                  {parties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                {errors.lessor_party_id && <p className="text-xs font-bold text-rose-500">{errors.lessor_party_id.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">المستأجر</label>
                <select
                  {...register("tenant_party_id")}
                  className={`w-full rounded-2xl border ${errors.tenant_party_id ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="">اختر المستأجر...</option>
                  {parties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                {errors.tenant_party_id && <p className="text-xs font-bold text-rose-500">{errors.tenant_party_id.message}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Contract Details */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">تفاصيل العقد</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم العقد الداخلي</label>
                <input
                  type="text"
                  {...register("contract_number_internal")}
                  placeholder="مثال: CTR-2024-001"
                  className={`w-full rounded-2xl border ${errors.contract_number_internal ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.contract_number_internal && <p className="text-xs font-bold text-rose-500">{errors.contract_number_internal.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">تاريخ البدء</label>
                  <input
                    type="date"
                    {...register("start_date")}
                    className={`w-full rounded-2xl border ${errors.start_date ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                  />
                  {errors.start_date && <p className="text-xs font-bold text-rose-500">{errors.start_date.message}</p>}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    {...register("end_date")}
                    className={`w-full rounded-2xl border ${errors.end_date ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                  />
                  {errors.end_date && <p className="text-xs font-bold text-rose-500">{errors.end_date.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Details */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">التفاصيل المالية</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">مبلغ الإيجار (سنوي)</label>
                <div className="relative">
                  <input
                    type="number"
                    {...register("rent_amount")}
                    placeholder="0.00"
                    className={`w-full rounded-2xl border ${errors.rent_amount ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 pr-4 pl-16 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500 uppercase">ريال</span>
                </div>
                {errors.rent_amount && <p className="text-xs font-bold text-rose-500">{errors.rent_amount.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">دورة الدفع</label>
                <select
                  {...register("payment_frequency")}
                  className={`w-full rounded-2xl border ${errors.payment_frequency ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="monthly">شهري</option>
                  <option value="quarterly">ربع سنوي</option>
                  <option value="semi-annual">نصف سنوي</option>
                  <option value="annual">سنوي</option>
                </select>
                {errors.payment_frequency && <p className="text-xs font-bold text-rose-500">{errors.payment_frequency.message}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 pb-12">
          <Link
            href="/contracts"
            className="rounded-2xl px-8 py-3.5 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={createContract.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-10 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            {createContract.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            حفظ العقد
          </button>
        </div>
      </form>
    </main>
  );
}
