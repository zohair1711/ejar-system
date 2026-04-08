"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, User, Building, Phone, Mail, Globe, MapPin, Landmark, ChevronLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@mantine/core";

const partySchema = z.object({
  party_type: z.enum(["individual", "organization"]),
  role_hint: z.enum(["lessor", "tenant", "broker", "agent"]),
  full_name: z.string().min(2, "الاسم الكامل مطلوب"),
  arabic_name: z.string().optional(),
  national_id: z.string().optional(),
  cr_number: z.string().optional(),
  mobile: z.string().min(10, "رقم الجوال غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

const bankAccountSchema = z.object({
  iban: z.string().min(24, "رقم الـ IBAN يجب أن يكون 24 حرفاً").max(24),
  bank_name: z.string().min(1, "اسم البنك مطلوب"),
  account_holder_name: z.string().min(1, "اسم صاحب الحساب مطلوب"),
});

type PartyFormValues = z.infer<typeof partySchema> & { bank_accounts?: z.infer<typeof bankAccountSchema>[] };

export default function NewPartyPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      party_type: "individual",
      role_hint: "tenant",
    },
  });

  const partyType = watch("party_type");

  const createParty = useMutation({
    mutationFn: async (values: PartyFormValues) => {
      // 1. Insert Party
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .insert([
          {
            party_type: values.party_type,
            role_hint: values.role_hint,
            full_name: values.full_name,
            arabic_name: values.arabic_name,
            national_id: values.national_id,
            cr_number: values.cr_number,
            mobile: values.mobile,
            email: values.email || null,
            nationality: values.nationality,
            notes: values.notes,
          },
        ])
        .select()
        .single();

      if (partyError) throw partyError;

  // 2. Insert Bank Account if provided
      if (values.bank_accounts?.[0]?.iban) {
        const { error: bankError } = await supabase.from("party_bank_accounts").insert([
          {
            party_id: partyData.id,
            iban: values.bank_accounts[0].iban,
            bank_name: values.bank_accounts[0].bank_name,
            account_holder_name: values.bank_accounts[0].account_holder_name,
            is_default: true,
          },
        ]);
        if (bankError) {
          console.error("Bank Error:", bankError);
          // Don't throw, we already created the party
        }
      }

      return partyData;
    },
    onSuccess: () => {
      router.push("/parties");
      router.refresh();
    },
  });

  const onSubmit = (values: PartyFormValues) => {
    createParty.mutate(values);
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
              href="/parties"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div>
              <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="xs">
                إدارة الأطراف
              </Badge>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                إضافة طرف جديد
              </h1>
              <p className="mt-1 text-sm font-medium text-emerald-50/80">قم بتسجيل بيانات المؤجر أو المستأجر في النظام</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-8">
        {/* Party Type & Role */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <h2 className="text-lg font-black text-emerald-950">تصنيف الطرف</h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع الطرف</label>
                <div className="flex gap-4 p-1.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-all has-[:checked]:bg-emerald-600 has-[:checked]:text-white has-[:checked]:shadow-lg text-emerald-600">
                    <input type="radio" {...register("party_type")} value="individual" className="sr-only" />
                    <User className="h-4 w-4" />
                    فرد
                  </label>
                  <label className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-all has-[:checked]:bg-emerald-600 has-[:checked]:text-white has-[:checked]:shadow-lg text-emerald-600">
                    <input type="radio" {...register("party_type")} value="organization" className="sr-only" />
                    <Building className="h-4 w-4" />
                    منشأة
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الدور الأساسي</label>
                <select
                  {...register("role_hint")}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                >
                  <option value="tenant">مستأجر</option>
                  <option value="lessor">مؤجر</option>
                  <option value="broker">وسيط</option>
                  <option value="agent">وكيل</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Identity Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">بيانات الهوية والاسم</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الاسم الكامل</label>
                <input
                  type="text"
                  {...register("full_name")}
                  placeholder="محمد بن عبدالله العلي"
                  className={`w-full rounded-2xl border ${errors.full_name ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                />
                {errors.full_name && <p className="text-xs font-bold text-rose-500">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">
                  {partyType === 'individual' ? 'رقم الهوية / الإقامة' : 'رقم السجل التجاري'}
                </label>
                <input
                  type="text"
                  {...register(partyType === 'individual' ? "national_id" : "cr_number")}
                  placeholder={partyType === 'individual' ? "10XXXXXXXX" : "70XXXXXXXX"}
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الجنسية</label>
                <div className="relative">
                  <Globe className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    {...register("nationality")}
                    placeholder="سعودي"
                    className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pr-12 pl-4 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">بيانات التواصل</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="tel"
                    {...register("mobile")}
                    placeholder="05XXXXXXXX"
                    className={`w-full rounded-2xl border ${errors.mobile ? 'border-rose-500' : 'border-emerald-100'} bg-white py-3.5 pr-12 pl-4 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                  />
                </div>
                {errors.mobile && <p className="text-xs font-bold text-rose-500">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="example@mail.com"
                    className={`w-full rounded-2xl border ${errors.email ? 'border-rose-500' : 'border-emerald-100'} bg-white py-3.5 pr-12 pl-4 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200`}
                  />
                </div>
                {errors.email && <p className="text-xs font-bold text-rose-500">{errors.email.message}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Bank Info */}
        <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Landmark className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">الحساب البنكي الافتراضي</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3 md:col-span-2">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم الآيبان (IBAN)</label>
                <input
                  type="text"
                  {...register("bank_accounts.0.iban")}
                  placeholder="SAXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-black text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200 font-mono"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">اسم البنك</label>
                <input
                  type="text"
                  {...register("bank_accounts.0.bank_name")}
                  placeholder="مصرف الراجحي"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">اسم صاحب الحساب</label>
                <input
                  type="text"
                  {...register("bank_accounts.0.account_holder_name")}
                  placeholder="كما يظهر في البنك"
                  className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 pb-12">
          <Link
            href="/parties"
            className="rounded-2xl px-8 py-3.5 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={createParty.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-10 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            {createParty.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            حفظ الطرف
          </button>
        </div>
      </form>
    </main>
  );
}
