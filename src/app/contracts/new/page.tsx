"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, Building, User, MapPin, Calendar, FileText, ChevronLeft, Plus, Trash2, Info, CheckCircle2, DollarSign, Settings2, ShieldCheck, Briefcase } from "lucide-react";
import Link from "next/link";
import { Badge, Stepper, Button, Group, TextInput, NumberInput, Select, MultiSelect, Checkbox, Textarea, Divider, Text, Paper, SimpleGrid, Stack, ActionIcon, Tooltip } from "@mantine/core";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

const contractSchema = z.object({
  // Basic Info
  office_id: z.string().uuid("يرجى اختيار المكتب"),
  property_id: z.string().uuid("يرجى اختيار العقار"),
  unit_id: z.string().uuid("يرجى اختيار الوحدة"),
  contract_category: z.enum(["residential", "commercial"]),

  // Parties
  lessor_party_id: z.string().uuid("يرجى اختيار المؤجر"),
  tenant_party_id: z.string().uuid("يرجى اختيار المستأجر"),

  // Dates & Numbers
  contract_number_internal: z.string().min(1, "يرجى إدخال رقم العقد الداخلي"),
  start_date: z.string().min(1, "يرجى تحديد تاريخ البدء"),
  end_date: z.string().min(1, "يرجى تحديد تاريخ الانتهاء"),

  // Financial Info
  rent_amount: z.coerce.number().min(0, "يجب أن يكون مبلغ الإيجار 0 أو أكثر"),
  payment_frequency: z.enum(["monthly", "quarterly", "semi-annual", "annual"]),
  payment_method: z.string().optional(),
  security_deposit: z.coerce.number().min(0).default(0),
  brokerage_fee: z.coerce.number().min(0).default(0),
  vat_amount: z.coerce.number().min(0).default(0),
  lessor_iban_id: z.string().uuid().optional().nullable(),
  tenant_iban_id: z.string().uuid().optional().nullable(),

  // Services
  services: z.array(z.object({
    service_name: z.string().min(1, "اسم الخدمة مطلوب"),
    service_type: z.string().optional(),
    amount: z.coerce.number().min(0).default(0),
    billing_cycle: z.string().optional(),
  })).default([]),

  // Fees
  fees: z.array(z.object({
    fee_type: z.string().min(1, "نوع الرسوم مطلوب"),
    amount: z.coerce.number().min(0).default(0),
    vat_amount: z.coerce.number().min(0).default(0),
    is_recurring: z.boolean().default(false),
  })).default([]),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function NewContractPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: {
      contract_category: "residential",
      payment_frequency: "monthly",
      rent_amount: 0,
      security_deposit: 0,
      brokerage_fee: 0,
      vat_amount: 0,
      services: [],
      fees: [],
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: "services",
  });

  const { fields: feeFields, append: appendFee, remove: removeFee } = useFieldArray({
    control,
    name: "fees",
  });

  const selectedOfficeId = watch("office_id");
   const selectedPropertyId = watch("property_id");
   const selectedLessorId = watch("lessor_party_id");
   const selectedTenantId = watch("tenant_party_id");

  // Fetch Bank Accounts for Lessor
  const { data: lessorBankAccounts } = useQuery({
    queryKey: ["bank-accounts", selectedLessorId],
    queryFn: async () => {
      if (!selectedLessorId) return [];
      const { data, error } = await supabase.from("party_bank_accounts").select("id, iban, bank_name").eq("party_id", selectedLessorId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLessorId,
  });

  // Fetch Bank Accounts for Tenant
  const { data: tenantBankAccounts } = useQuery({
    queryKey: ["bank-accounts", selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return [];
      const { data, error } = await supabase.from("party_bank_accounts").select("id, iban, bank_name").eq("party_id", selectedTenantId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTenantId,
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
            payment_method: values.payment_method,
            security_deposit: values.security_deposit,
            brokerage_fee: values.brokerage_fee,
            vat_amount: values.vat_amount,
            total_amount: values.rent_amount + values.security_deposit + values.brokerage_fee + values.vat_amount,
            lessor_iban_id: values.lessor_iban_id,
            tenant_iban_id: values.tenant_iban_id,
          },
        ]);

      if (financialError) throw financialError;

      // 3. Insert services
      if (values.services && values.services.length > 0) {
        const { error: servicesError } = await supabase
          .from("contract_unit_services")
          .insert(
            values.services.map(s => ({
              contract_id: contractData.id,
              service_name: s.service_name,
              service_type: s.service_type,
              amount: s.amount,
              billing_cycle: s.billing_cycle,
            }))
          );
        if (servicesError) throw servicesError;
      }

      // 4. Insert fees
      if (values.fees && values.fees.length > 0) {
        const { error: feesError } = await supabase
          .from("contract_rental_fees")
          .insert(
            values.fees.map(f => ({
              contract_id: contractData.id,
              fee_type: f.fee_type,
              amount: f.amount,
              vat_amount: f.vat_amount,
              is_recurring: f.is_recurring,
            }))
          );
        if (feesError) throw feesError;
      }

      return contractData;
    },
    onSuccess: () => {
      notifications.show({
        title: "تم بنجاح",
        message: "تم إنشاء العقد بنجاح",
        color: "emerald",
        icon: <CheckCircle2 size={18} />,
      });
      router.push("/contracts");
      router.refresh();
    },
    onError: (error: any) => {
      notifications.show({
        title: "خطأ",
        message: error.message || "حدث خطأ أثناء إنشاء العقد",
        color: "red",
      });
    }
  });

  const nextStep = async () => {
    const fieldsToValidate: any = {
      0: ["office_id", "property_id", "unit_id", "contract_category"],
      1: ["lessor_party_id", "tenant_party_id"],
      2: ["contract_number_internal", "start_date", "end_date"],
      3: ["rent_amount", "payment_frequency", "security_deposit", "brokerage_fee"],
      4: ["services", "fees"],
    };

    const isStepValid = await trigger(fieldsToValidate[activeStep]);
    if (isStepValid) {
      setActiveStep((current) => (current < 5 ? current + 1 : current));
    }
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

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

      <div className="mx-auto max-w-5xl">
        <Stepper
          active={activeStep}
          onStepClick={setActiveStep}
          allowNextStepsSelect={false}
          color="emerald"
          size="sm"
          radius="xl"
          classNames={{
            step: "transition-all",
            stepIcon: "border-2",
          }}
        >
          {/* Step 1: الأساسيات */}
          <Stepper.Step
            label="الأساسيات"
            description="العقار والوحدة"
            icon={<Building size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Building className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">بيانات العقار والوحدة</h2>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
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
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 2: الأطراف */}
          <Stepper.Step
            label="الأطراف"
            description="المؤجر والمستأجر"
            icon={<User size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <User className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">أطراف العقد</h2>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
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
                    
                    {selectedLessorId && (
                      <div className="space-y-2 mt-2">
                        <label className="text-xs font-bold text-emerald-800/40 uppercase tracking-widest">حساب بنك المؤجر (لتحويل الإيجار)</label>
                        <select
                          {...register("lessor_iban_id")}
                          className="w-full rounded-xl border border-emerald-50 bg-emerald-50/30 p-2.5 text-xs font-bold text-emerald-900 outline-none"
                        >
                          <option value="">اختر الحساب...</option>
                          {lessorBankAccounts?.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.iban}</option>
                          ))}
                        </select>
                      </div>
                    )}
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

                    {selectedTenantId && (
                      <div className="space-y-2 mt-2">
                        <label className="text-xs font-bold text-emerald-800/40 uppercase tracking-widest">حساب بنك المستأجر</label>
                        <select
                          {...register("tenant_iban_id")}
                          className="w-full rounded-xl border border-emerald-50 bg-emerald-50/30 p-2.5 text-xs font-bold text-emerald-900 outline-none"
                        >
                          <option value="">اختر الحساب...</option>
                          {tenantBankAccounts?.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.iban}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 3: التواريخ والأرقام */}
          <Stepper.Step
            label="المواعيد"
            description="التواريخ والترقيم"
            icon={<Calendar size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">تفاصيل العقد والتواريخ</h2>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
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
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 4: التفاصيل المالية */}
          <Stepper.Step
            label="المالية"
            description="الإيجار والرسوم"
            icon={<DollarSign size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">التفاصيل المالية</h2>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
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
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">دورة الدفع</label>
                    <select
                      {...register("payment_frequency")}
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500"
                    >
                      <option value="monthly">شهري</option>
                      <option value="quarterly">ربع سنوي</option>
                      <option value="semi-annual">نصف سنوي</option>
                      <option value="annual">سنوي</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest text-orange-600">مبلغ الضمان (تأمين)</label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register("security_deposit")}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-orange-100 bg-orange-50/20 p-3.5 pr-4 pl-16 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-orange-500 uppercase">ريال</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest text-blue-600">عمولة السعي (Brokerage)</label>
                    <div className="relative">
                      <input
                        type="number"
                        {...register("brokerage_fee")}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-blue-100 bg-blue-50/20 p-3.5 pr-4 pl-16 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-blue-500 uppercase">ريال</span>
                    </div>
                  </div>
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 5: الخدمات والرسوم */}
          <Stepper.Step
            label="الخدمات"
            description="خدمات ورسوم إضافية"
            icon={<Settings2 size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <Settings2 className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-emerald-950">الخدمات والرسوم الإضافية</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="light"
                      color="emerald"
                      radius="xl"
                      leftSection={<Plus size={16} />}
                      onClick={() => appendService({ service_name: "", amount: 0, service_type: "utility" })}
                    >
                      إضافة خدمة
                    </Button>
                    <Button
                      variant="light"
                      color="blue"
                      radius="xl"
                      leftSection={<Plus size={16} />}
                      onClick={() => appendFee({ fee_type: "", amount: 0, vat_amount: 0, is_recurring: false })}
                    >
                      إضافة رسوم
                    </Button>
                  </div>
                </div>

                <Divider label="خدمات الوحدة (كهرباء، مياه، إلخ)" labelPosition="center" />
                
                {serviceFields.length === 0 ? (
                  <Text c="dimmed" ta="center" size="sm" py="xl" className="bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-100">لا توجد خدمات مضافة</Text>
                ) : (
                  <Stack gap="md">
                    {serviceFields.map((field, index) => (
                      <Paper key={field.id} withBorder p="md" radius="xl" bg="emerald-50/10">
                        <Group align="flex-end" grow>
                          <TextInput
                            label="اسم الخدمة"
                            placeholder="مثال: مياه"
                            {...register(`services.${index}.service_name`)}
                            error={errors.services?.[index]?.service_name?.message}
                          />
                          <NumberInput
                            label="المبلغ"
                            placeholder="0.00"
                            onChange={(val) => setValue(`services.${index}.amount`, Number(val))}
                            error={errors.services?.[index]?.amount?.message}
                          />
                          <Select
                            label="دورة الفوترة"
                            placeholder="اختر..."
                            data={[
                              { label: 'شهرية', value: 'monthly' },
                              { label: 'سنوية', value: 'annual' },
                              { label: 'لمرة واحدة', value: 'once' },
                            ]}
                            onChange={(val) => setValue(`services.${index}.billing_cycle`, val || "")}
                          />
                          <ActionIcon color="red" variant="subtle" size="lg" onClick={() => removeService(index)}>
                            <Trash2 size={20} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}

                <Divider label="رسوم إضافية (موقف، صيانة، إلخ)" labelPosition="center" mt="xl" />

                {feeFields.length === 0 ? (
                  <Text c="dimmed" ta="center" size="sm" py="xl" className="bg-blue-50/30 rounded-2xl border border-dashed border-blue-100">لا توجد رسوم مضافة</Text>
                ) : (
                  <Stack gap="md">
                    {feeFields.map((field, index) => (
                      <Paper key={field.id} withBorder p="md" radius="xl" bg="blue-50/10">
                        <Group align="flex-end" grow>
                          <TextInput
                            label="نوع الرسوم"
                            placeholder="مثال: رسوم موقف"
                            {...register(`fees.${index}.fee_type`)}
                            error={errors.fees?.[index]?.fee_type?.message}
                          />
                          <NumberInput
                            label="المبلغ"
                            placeholder="0.00"
                            onChange={(val) => setValue(`fees.${index}.amount`, Number(val))}
                            error={errors.fees?.[index]?.amount?.message}
                          />
                          <Checkbox
                            label="رسوم متكررة"
                            mt="xl"
                            {...register(`fees.${index}.is_recurring`)}
                          />
                          <ActionIcon color="red" variant="subtle" size="lg" onClick={() => removeFee(index)}>
                            <Trash2 size={20} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 6: المراجعة */}
          <Stepper.Completed>
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="emerald-50/20" className="border-emerald-200">
              <Stack gap="xl" align="center" py="xl">
                <div className="h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={40} />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black text-emerald-950">جاهز للحفظ؟</h2>
                  <p className="text-emerald-700/70 font-bold mt-2">يرجى مراجعة كافة البيانات قبل تأكيد إنشاء العقد</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
                  <div className="bg-white p-6 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                    <Text size="xs" fw={900} c="dimmed" tt="uppercase">إجمالي الإيجار</Text>
                    <Text size="xl" fw={900} c="emerald.9">{watch("rent_amount")} ريال</Text>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                    <Text size="xs" fw={900} c="dimmed" tt="uppercase">تاريخ البدء</Text>
                    <Text size="xl" fw={900} c="emerald.9">{watch("start_date")}</Text>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                    <Text size="xs" fw={900} c="dimmed" tt="uppercase">رقم العقد</Text>
                    <Text size="xl" fw={900} c="emerald.9">{watch("contract_number_internal")}</Text>
                  </div>
                </div>
              </Stack>
            </Paper>
          </Stepper.Completed>
        </Stepper>

        {/* Form Actions */}
        <Group justify="space-between" mt="xl" pb="xl">
          <Button
            variant="subtle"
            color="gray"
            onClick={prevStep}
            disabled={activeStep === 0}
            leftSection={<ArrowRight size={16} />}
            radius="xl"
            size="lg"
            className="font-black"
          >
            السابق
          </Button>

          {activeStep < 5 ? (
            <Button
              color="emerald"
              onClick={nextStep}
              rightSection={<ChevronLeft size={16} />}
              radius="xl"
              size="lg"
              className="font-black px-10 shadow-lg shadow-emerald-500/20"
            >
              المتابعة
            </Button>
          ) : (
            <Button
              color="emerald"
              loading={createContract.isPending}
              onClick={handleSubmit(onSubmit)}
              leftSection={<Save size={18} />}
              radius="xl"
              size="lg"
              className="font-black px-10 shadow-lg shadow-emerald-500/20"
            >
              تأكيد وحفظ العقد
            </Button>
          )}
        </Group>
      </div>
    </main>
  );
}
