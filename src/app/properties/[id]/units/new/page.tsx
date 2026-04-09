"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Save, Loader2, Home, Info, Ruler, ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@mantine/core";

import { EjarUnitTypes, EjarUsageTypes } from "@/lib/ejar-lookups";

const unitSchema = z.object({
  property_id: z.string().uuid(),
  unit_number: z.string().min(1, "يرجى إدخال رقم الوحدة"),
  floor_number: z.string().optional(),
  unit_type: z.string().min(1, "يرجى اختيار نوع الوحدة"),
  usage_type: z.string().optional(),
  area: z.coerce.number().min(0, "المساحة يجب أن تكون موجبة"),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  furnished: z.boolean().default(false),
  electricity_no: z.string().optional(),
  water_no: z.string().optional(),
  meter_info: z.string().optional(),
  advertisement_number: z.string().optional(),
  rent_expected: z.coerce.number().min(0, "السعر يجب أن يكون موجباً"),
  status: z.string().default("available"),
  description: z.string().optional(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

export default function NewUnitPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      property_id: propertyId,
      status: "available",
      unit_type: "apartment",
      furnished: false,
    },
  });

  // Fetch Property Name for header
  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("name").eq("id", propertyId).single();
      if (error) throw error;
      return data;
    },
  });

  const createUnit = useMutation({
    mutationFn: async (values: UnitFormValues) => {
      const { data, error } = await supabase.from("units").insert([values]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      router.push(`/properties/${propertyId}`);
      router.refresh();
    },
  });

  const onSubmit = (values: UnitFormValues) => {
    createUnit.mutate(values);
  };

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={`/properties/${propertyId}`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div>
              <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="xs">
                إدارة الوحدات
              </Badge>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                إضافة وحدة جديدة
              </h1>
              <p className="mt-1 text-sm font-medium text-emerald-50/80">للعقار: <span className="font-black text-white">{property?.name}</span></p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-8">
        {/* Basic Unit Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Home className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">بيانات الوحدة الأساسية</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم الوحدة</label>
                <input
                  type="text"
                  {...register("unit_number")}
                  placeholder="مثال: شقة 101"
                  className={`w-full rounded-2xl border ${errors.unit_number ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.unit_number && <p className="text-xs font-bold text-rose-500">{errors.unit_number.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع الوحدة</label>
                <select
                  {...register("unit_type")}
                  className={`w-full rounded-2xl border ${errors.unit_type ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  {EjarUnitTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.unit_type && <p className="text-xs font-bold text-rose-500">{errors.unit_type.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الدور</label>
                <input
                  type="text"
                  {...register("floor_number")}
                  placeholder="الأرضي، الأول..."
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الاستخدام</label>
                <select
                  {...register("usage_type")}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                >
                  {EjarUsageTypes.map((usage) => (
                    <option key={usage.value} value={usage.value}>{usage.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الإيجار السنوي المتوقع</label>
                <div className="relative">
                  <input
                    type="number"
                    {...register("rent_expected", { valueAsNumber: true })}
                    placeholder="0.00"
                    className={`w-full rounded-2xl border ${errors.rent_expected ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 pr-4 pl-16 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase">ريال</span>
                </div>
                {errors.rent_expected && <p className="text-xs font-bold text-rose-500">{errors.rent_expected.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الحالة</label>
                <select
                  {...register("status")}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                >
                  <option value="available">متاحة</option>
                  <option value="reserved">محجوزة</option>
                  <option value="occupied">مؤجرة</option>
                  <option value="maintenance">تحت الصيانة</option>
                  <option value="inactive">غير نشطة</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Unit Specifications */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Ruler className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">المواصفات والقياسات</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">المساحة (م²)</label>
                <input
                  type="number"
                  {...register("area", { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">عدد الغرف</label>
                <input
                  type="number"
                  {...register("bedrooms", { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">عدد دورات المياه</label>
                <input
                  type="number"
                  {...register("bathrooms", { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register("furnished")}
                      className="sr-only peer"
                    />
                    <div className="h-7 w-12 rounded-full bg-emerald-100 transition-all peer-checked:bg-emerald-600 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                  </div>
                  <span className="text-sm font-black text-emerald-900">مفروشة؟</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Utility Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">معلومات الخدمات والوصف</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم حساب الكهرباء</label>
                <input
                  type="text"
                  {...register("electricity_no")}
                  placeholder="رقم العداد أو الحساب"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم حساب المياه</label>
                <input
                  type="text"
                  {...register("water_no")}
                  placeholder="رقم العداد أو الحساب"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest text-blue-600">رقم الإعلان (إيجار)</label>
                <input
                  type="text"
                  {...register("advertisement_number")}
                  placeholder="مثال: 7123456"
                  className="w-full rounded-2xl border border-blue-100 bg-blue-50/10 p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">معلومات العدادات الأخرى</label>
                <input
                  type="text"
                  {...register("meter_info")}
                  placeholder="غاز، خدمات أخرى..."
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">وصف إضافي</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="وصف مميزات الوحدة أو أي ملاحظات إضافية..."
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 pb-12">
          <Link
            href={`/properties/${propertyId}`}
            className="rounded-2xl px-8 py-3.5 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={createUnit.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-10 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            {createUnit.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            حفظ الوحدة
          </button>
        </div>
      </form>
    </main>
  );
}
