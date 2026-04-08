"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, Building2, MapPin, Info, Home, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@mantine/core";

const propertySchema = z.object({
  office_id: z.string().uuid("يرجى اختيار المكتب"),
  name: z.string().min(2, "اسم العقار يجب أن يكون أكثر من حرفين"),
  property_code: z.string().min(1, "يرجى إدخال كود العقار"),
  property_type: z.string().min(1, "يرجى اختيار نوع العقار"),
  usage_type: z.string().min(1, "يرجى اختيار نوع الاستخدام"),
  city: z.string().min(1, "يرجى إدخال المدينة"),
  district: z.string().min(1, "يرجى إدخال الحي"),
  street: z.string().optional(),
  building_no: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.string().optional().or(z.number().optional()),
  longitude: z.string().optional().or(z.number().optional()),
  status: z.string().default("draft"),
  description: z.string().optional(),
  // Ownership Document Fields
  document_type: z.string().min(1, "يرجى اختيار نوع الصك"),
  document_number: z.string().min(1, "يرجى إدخال رقم الصك"),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  issuer_name: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema) as any,
    defaultValues: {
      status: "draft",
      property_type: "building",
      usage_type: "residential",
      document_type: "electronic_deed",
    },
  });

  // Fetch Offices
  const { data: offices } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offices").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const createProperty = useMutation({
    mutationFn: async (values: PropertyFormValues) => {
      // 1. Insert Property
      const propertyData = {
        office_id: values.office_id,
        name: values.name,
        property_code: values.property_code,
        property_type: values.property_type,
        usage_type: values.usage_type,
        city: values.city,
        district: values.district,
        street: values.street,
        building_no: values.building_no,
        postal_code: values.postal_code,
        latitude: values.latitude ? parseFloat(values.latitude.toString()) : null,
        longitude: values.longitude ? parseFloat(values.longitude.toString()) : null,
        status: values.status,
        description: values.description,
      };

      const { data: prop, error: propError } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (propError) throw propError;

      // 2. Insert Ownership Document
      const docData = {
        property_id: prop.id,
        document_type: values.document_type,
        document_number: values.document_number,
        issue_date: values.issue_date || null,
        expiry_date: values.expiry_date || null,
        issuer_name: values.issuer_name || null,
        status: "active",
      };

      const { error: docError } = await supabase
        .from("property_ownership_documents")
        .insert([docData]);

      if (docError) throw docError;

      return prop;
    },
    onSuccess: (data) => {
      router.push(`/properties/${data.id}`);
      router.refresh();
    },
  });

  const onSubmit = (values: any) => {
    createProperty.mutate(values as PropertyFormValues);
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
              href="/properties"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div>
              <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="xs">
                إدارة العقارات
              </Badge>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                إضافة عقار جديد
              </h1>
              <p className="mt-1 text-sm font-medium text-emerald-50/80">قم بتعبئة بيانات العقار الأساسية والعناوين</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-8">
        {/* Basic Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">المعلومات الأساسية</h2>
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
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">اسم العقار</label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="مثال: برج اليمامة"
                  className={`w-full rounded-2xl border ${errors.name ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.name && <p className="text-xs font-bold text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">كود العقار</label>
                <input
                  type="text"
                  {...register("property_code")}
                  placeholder="مثال: PR-001"
                  className={`w-full rounded-2xl border ${errors.property_code ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.property_code && <p className="text-xs font-bold text-rose-500">{errors.property_code.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع العقار</label>
                <select
                  {...register("property_type")}
                  className={`w-full rounded-2xl border ${errors.property_type ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="building">عمارة</option>
                  <option value="villa">فيلا</option>
                  <option value="apartment_building">مبنى شقق</option>
                  <option value="commercial_complex">مجمع تجاري</option>
                  <option value="land">أرض</option>
                </select>
                {errors.property_type && <p className="text-xs font-bold text-rose-500">{errors.property_type.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع الاستخدام</label>
                <select
                  {...register("usage_type")}
                  className={`w-full rounded-2xl border ${errors.usage_type ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="residential">سكني</option>
                  <option value="commercial">تجاري</option>
                  <option value="industrial">صناعي</option>
                  <option value="agricultural">زراعي</option>
                </select>
                {errors.usage_type && <p className="text-xs font-bold text-rose-500">{errors.usage_type.message}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Ownership Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">بيانات الملكية والصك</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع الصك</label>
                <select
                  {...register("document_type")}
                  className={`w-full rounded-2xl border ${errors.document_type ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                >
                  <option value="electronic_deed">صك إلكتروني</option>
                  <option value="manual_deed">صك يدوي</option>
                  <option value="contract">عقد استثمار/أخرى</option>
                </select>
                {errors.document_type && <p className="text-xs font-bold text-rose-500">{errors.document_type.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم الصك</label>
                <input
                  type="text"
                  {...register("document_number")}
                  placeholder="مثال: 1234567890"
                  className={`w-full rounded-2xl border ${errors.document_number ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.document_number && <p className="text-xs font-bold text-rose-500">{errors.document_number.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">تاريخ الإصدار</label>
                <input
                  type="date"
                  {...register("issue_date")}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">جهة الإصدار</label>
                <input
                  type="text"
                  {...register("issuer_name")}
                  placeholder="مثال: كتابة عدل الرياض"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Location Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">العنوان والموقع</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">المدينة</label>
                <input
                  type="text"
                  {...register("city")}
                  placeholder="الرياض"
                  className={`w-full rounded-2xl border ${errors.city ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.city && <p className="text-xs font-bold text-rose-500">{errors.city.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الحي</label>
                <input
                  type="text"
                  {...register("district")}
                  placeholder="الملز"
                  className={`w-full rounded-2xl border ${errors.district ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.district && <p className="text-xs font-bold text-rose-500">{errors.district.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الشارع</label>
                <input
                  type="text"
                  {...register("street")}
                  placeholder="شارع الأمير سلطان"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم المبنى</label>
                <input
                  type="text"
                  {...register("building_no")}
                  placeholder="1234"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الرمز البريدي</label>
                <input
                  type="text"
                  {...register("postal_code")}
                  placeholder="12345"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">خط العرض (Latitude)</label>
                <input
                  type="text"
                  {...register("latitude")}
                  placeholder="24.7136"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">خط الطول (Longitude)</label>
                <input
                  type="text"
                  {...register("longitude")}
                  placeholder="46.6753"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">معلومات إضافية</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">وصف العقار</label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="وصف إضافي للعقار، المميزات، الخدمات القريبة..."
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                ></textarea>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">حالة العقار</label>
                <select
                  {...register("status")}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                >
                  <option value="draft">مسودة</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 pb-12">
          <Link
            href="/properties"
            className="rounded-2xl px-8 py-3.5 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={createProperty.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-10 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            {createProperty.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            حفظ العقار
          </button>
        </div>
      </form>
    </main>
  );
}
