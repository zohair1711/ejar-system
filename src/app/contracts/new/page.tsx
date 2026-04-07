"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, Building, User, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

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
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/contracts"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">إنشاء عقد جديد</h1>
              <p className="text-sm text-slate-500">قم بتعبئة البيانات التالية لإنشاء عقد إيجار</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Office & Property Info */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-4">
              <Building className="h-5 w-5" />
              <h2 className="font-bold">بيانات العقار والوحدة</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">المكتب العقاري</label>
                <select
                  {...register("office_id")}
                  className={`w-full rounded-xl border ${errors.office_id ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                >
                  <option value="">اختر المكتب...</option>
                  {offices?.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                {errors.office_id && <p className="text-xs text-red-500">{errors.office_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">العقار</label>
                <select
                  {...register("property_id")}
                  disabled={!selectedOfficeId}
                  className={`w-full rounded-xl border ${errors.property_id ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-slate-50`}
                >
                  <option value="">اختر العقار...</option>
                  {properties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.property_id && <p className="text-xs text-red-500">{errors.property_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">الوحدة</label>
                <select
                  {...register("unit_id")}
                  disabled={!selectedPropertyId}
                  className={`w-full rounded-xl border ${errors.unit_id ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-slate-50`}
                >
                  <option value="">اختر الوحدة...</option>
                  {units?.map((u) => (
                    <option key={u.id} value={u.id}>وحدة رقم {u.unit_number}</option>
                  ))}
                </select>
                {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">نوع العقد</label>
                <div className="flex gap-4 p-1 rounded-xl bg-slate-50 border border-slate-100">
                  <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all has-[:checked]:bg-white has-[:checked]:text-blue-600 has-[:checked]:shadow-sm">
                    <input type="radio" {...register("contract_category")} value="residential" className="sr-only" />
                    سكني
                  </label>
                  <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all has-[:checked]:bg-white has-[:checked]:text-blue-600 has-[:checked]:shadow-sm">
                    <input type="radio" {...register("contract_category")} value="commercial" className="sr-only" />
                    تجاري
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Parties Info */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-4">
              <User className="h-5 w-5" />
              <h2 className="font-bold">أطراف العقد</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">المؤجر</label>
                <select
                  {...register("lessor_party_id")}
                  className={`w-full rounded-xl border ${errors.lessor_party_id ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                >
                  <option value="">اختر المؤجر...</option>
                  {parties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                {errors.lessor_party_id && <p className="text-xs text-red-500">{errors.lessor_party_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">المستأجر</label>
                <select
                  {...register("tenant_party_id")}
                  className={`w-full rounded-xl border ${errors.tenant_party_id ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                >
                  <option value="">اختر المستأجر...</option>
                  {parties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                {errors.tenant_party_id && <p className="text-xs text-red-500">{errors.tenant_party_id.message}</p>}
              </div>
            </div>
          </section>

          {/* Contract Details */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-4">
              <Calendar className="h-5 w-5" />
              <h2 className="font-bold">تفاصيل العقد</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">رقم العقد الداخلي</label>
                <input
                  type="text"
                  {...register("contract_number_internal")}
                  placeholder="مثال: CTR-2024-001"
                  className={`w-full rounded-xl border ${errors.contract_number_internal ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                />
                {errors.contract_number_internal && <p className="text-xs text-red-500">{errors.contract_number_internal.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">تاريخ البدء</label>
                  <input
                    type="date"
                    {...register("start_date")}
                    className={`w-full rounded-xl border ${errors.start_date ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                  />
                  {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    {...register("end_date")}
                    className={`w-full rounded-xl border ${errors.end_date ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                  />
                  {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Financial Details */}
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold">SAR</span>
              <h2 className="font-bold">التفاصيل المالية</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">مبلغ الإيجار (سنوي)</label>
                <div className="relative">
                  <input
                    type="number"
                    {...register("rent_amount")}
                    placeholder="0.00"
                    className={`w-full rounded-xl border ${errors.rent_amount ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 pr-4 pl-12 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">ريال</span>
                </div>
                {errors.rent_amount && <p className="text-xs text-red-500">{errors.rent_amount.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">دورة الدفع</label>
                <select
                  {...register("payment_frequency")}
                  className={`w-full rounded-xl border ${errors.payment_frequency ? 'border-red-500' : 'border-slate-200'} bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all`}
                >
                  <option value="monthly">شهري</option>
                  <option value="quarterly">ربع سنوي</option>
                  <option value="semi-annual">نصف سنوي</option>
                  <option value="annual">سنوي</option>
                </select>
                {errors.payment_frequency && <p className="text-xs text-red-500">{errors.payment_frequency.message}</p>}
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/contracts"
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={createContract.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {createContract.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ العقد
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
