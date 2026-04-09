"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, Building2, MapPin, Info, Home, Plus, FileText, User, ChevronLeft, Navigation, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge, Stepper, Button, Group, TextInput, NumberInput, Select, Stack, Paper, SimpleGrid, Divider, Text, ActionIcon } from "@mantine/core";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

import { EjarPropertyTypes, EjarUsageTypes, EjarDocumentTypes } from "@/lib/ejar-lookups";

const propertySchema = z.object({
  // Step 1: Basic Info
  office_id: z.string().uuid("يرجى اختيار المكتب"),
  name: z.string().min(2, "اسم العقار يجب أن يكون أكثر من حرفين"),
  property_code: z.string().min(1, "يرجى إدخال كود العقار"),
  property_type: z.string().min(1, "يرجى اختيار نوع العقار"),
  usage_type: z.string().min(1, "يرجى اختيار نوع الاستخدام"),
  status: z.string().default("draft"),
  description: z.string().optional(),

  // Step 2: Address & Location
  city: z.string().min(1, "يرجى إدخال المدينة"),
  district: z.string().min(1, "يرجى إدخال الحي"),
  street: z.string().optional(),
  building_no: z.string().optional(),
  additional_no: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),

  // Step 3: Ownership Document
  document_type: z.string().min(1, "يرجى اختيار نوع الصك"),
  document_number: z.string().min(1, "يرجى إدخال رقم الصك"),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  issuer_name: z.string().optional().nullable(),

  // Owners
  owners: z.array(z.object({
    name: z.string().min(1, "اسم المالك مطلوب"),
    owner_type: z.enum(["individual", "organization"]),
    national_id_or_cr: z.string().optional(),
    mobile: z.string().optional(),
    ownership_ratio: z.coerce.number().min(1).max(100).default(100),
  })).default([{ name: "", owner_type: "individual", ownership_ratio: 100 }]),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
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
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema) as any,
    defaultValues: {
      status: "draft",
      property_type: "building",
      usage_type: "residential",
      document_type: "electronic_deed",
      owners: [{ name: "", owner_type: "individual", ownership_ratio: 100 }],
    },
  });

  const { fields: ownerFields, append: appendOwner, remove: removeOwner } = useFieldArray({
    control,
    name: "owners",
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
      const { data: prop, error: propError } = await supabase
        .from("properties")
        .insert([
          {
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
            latitude: values.latitude,
            longitude: values.longitude,
            status: values.status,
            description: values.description,
          },
        ])
        .select()
        .single();

      if (propError) throw propError;

      // 2. Insert Ownership Document
      const { data: doc, error: docError } = await supabase
        .from("property_ownership_documents")
        .insert([
          {
            property_id: prop.id,
            document_type: values.document_type,
            document_number: values.document_number,
            issue_date: values.issue_date || null,
            expiry_date: values.expiry_date || null,
            issuer_name: values.issuer_name || null,
            status: "active",
          },
        ])
        .select()
        .single();

      if (docError) throw docError;

      // 3. Insert Owners
      if (values.owners && values.owners.length > 0) {
        const { error: ownersError } = await supabase
          .from("property_owners")
          .insert(
            values.owners.map((owner) => ({
              ownership_document_id: doc.id,
              name: owner.name,
              owner_type: owner.owner_type,
              national_id_or_cr: owner.national_id_or_cr,
              mobile: owner.mobile,
              ownership_ratio: owner.ownership_ratio,
            }))
          );

        if (ownersError) throw ownersError;
      }

      return prop;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "تم بنجاح",
        message: "تم إضافة العقار بنجاح",
        color: "emerald",
        icon: <CheckCircle2 size={18} />,
      });
      router.push(`/properties/${data.id}`);
      router.refresh();
    },
    onError: (error: any) => {
      notifications.show({
        title: "خطأ",
        message: error.message || "حدث خطأ أثناء إضافة العقار",
        color: "red",
      });
    },
  });

  const nextStep = async () => {
    const fieldsToValidate: any = {
      0: ["office_id", "name", "property_code", "property_type", "usage_type"],
      1: ["city", "district", "street", "building_no", "postal_code"],
      2: ["document_type", "document_number", "owners"],
    };

    const isStepValid = await trigger(fieldsToValidate[activeStep]);
    if (isStepValid) {
      setActiveStep((current) => (current < 3 ? current + 1 : current));
    }
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const onSubmit = (values: PropertyFormValues) => {
    createProperty.mutate(values);
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
            description="بيانات العقار ونوعه"
            icon={<Building2 size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">المعلومات الأساسية</h2>
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
                      {EjarPropertyTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع الاستخدام</label>
                    <select
                      {...register("usage_type")}
                      className={`w-full rounded-2xl border ${errors.usage_type ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                    >
                      {EjarUsageTypes.map((usage) => (
                        <option key={usage.value} value={usage.value}>{usage.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الحالة</label>
                    <select
                      {...register("status")}
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500"
                    >
                      <option value="draft">مسودة</option>
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </SimpleGrid>

                <div className="space-y-3">
                  <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">وصف العقار</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="وصف إضافي للعقار، المميزات، الخدمات القريبة..."
                    className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                  ></textarea>
                </div>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 2: العنوان والموقع */}
          <Stepper.Step
            label="العنوان"
            description="الموقع والإحداثيات"
            icon={<MapPin size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">العنوان والموقع التفصيلي</h2>
                </div>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">المدينة</label>
                    <input
                      type="text"
                      {...register("city")}
                      placeholder="الرياض"
                      className={`w-full rounded-2xl border ${errors.city ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الحي</label>
                    <input
                      type="text"
                      {...register("district")}
                      placeholder="الملز"
                      className={`w-full rounded-2xl border ${errors.district ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">الشارع</label>
                    <input
                      type="text"
                      {...register("street")}
                      placeholder="شارع الأمير سلطان"
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest text-blue-600">رقم المبنى</label>
                    <input
                      type="text"
                      {...register("building_no")}
                      placeholder="1234"
                      className="w-full rounded-2xl border border-blue-100 bg-blue-50/10 p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest text-blue-600">الرقم الإضافي</label>
                    <input
                      type="text"
                      {...register("additional_no")}
                      placeholder="5678"
                      className="w-full rounded-2xl border border-blue-100 bg-blue-50/10 p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest text-blue-600">الرمز البريدي</label>
                    <input
                      type="text"
                      {...register("postal_code")}
                      placeholder="12345"
                      className="w-full rounded-2xl border border-blue-100 bg-blue-50/10 p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                </SimpleGrid>

                <Divider label="الإحداثيات الجغرافية (اختياري)" labelPosition="center" />
                
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">خط العرض (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      {...register("latitude", { valueAsNumber: true })}
                      placeholder="24.7136"
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">خط الطول (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      {...register("longitude", { valueAsNumber: true })}
                      placeholder="46.6753"
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 3: الملكية والصك */}
          <Stepper.Step
            label="الملكية"
            description="الصك والملاك"
            icon={<FileText size={18} />}
          >
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="white">
              <Stack gap="xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">بيانات صك الملكية</h2>
                </div>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">نوع الصك</label>
                    <select
                      {...register("document_type")}
                      className={`w-full rounded-2xl border ${errors.document_type ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500`}
                    >
                      {EjarDocumentTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">رقم الصك</label>
                    <input
                      type="text"
                      {...register("document_number")}
                      placeholder="مثال: 1234567890"
                      className={`w-full rounded-2xl border ${errors.document_number ? 'border-rose-500' : 'border-emerald-100'} bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none transition-all focus:border-emerald-500 placeholder:text-emerald-200`}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">تاريخ الإصدار</label>
                    <input
                      type="date"
                      {...register("issue_date")}
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-emerald-800/60 uppercase tracking-widest">جهة الإصدار</label>
                    <input
                      type="text"
                      {...register("issuer_name")}
                      placeholder="مثال: كتابة عدل الرياض"
                      className="w-full rounded-2xl border border-emerald-100 bg-white p-3.5 text-sm font-bold text-emerald-950 outline-none"
                    />
                  </div>
                </SimpleGrid>

                <Divider label="الملاك والشركاء" labelPosition="center" mt="xl" />

                <div className="flex items-center justify-between">
                  <Text size="sm" fw={800} c="emerald.9">قائمة الملاك ونسب التملك</Text>
                  <Button
                    variant="light"
                    color="emerald"
                    radius="xl"
                    leftSection={<Plus size={16} />}
                    onClick={() => appendOwner({ name: "", owner_type: "individual", ownership_ratio: 0 })}
                  >
                    إضافة مالك
                  </Button>
                </div>

                <Stack gap="md">
                  {ownerFields.map((field, index) => (
                    <Paper key={field.id} withBorder p="md" radius="xl" bg="emerald-50/10">
                      <Group align="flex-end" grow>
                        <TextInput
                          label="اسم المالك"
                          placeholder="الاسم الكامل"
                          {...register(`owners.${index}.name`)}
                          error={errors.owners?.[index]?.name?.message}
                        />
                        <Select
                          label="نوع المالك"
                          data={[
                            { label: 'فرد', value: 'individual' },
                            { label: 'منشأة', value: 'organization' },
                          ]}
                          onChange={(val) => setValue(`owners.${index}.owner_type`, (val as any) || "individual")}
                        />
                        <TextInput
                          label="الهوية/السجل"
                          placeholder="رقم الهوية"
                          {...register(`owners.${index}.national_id_or_cr`)}
                        />
                        <NumberInput
                          label="النسبة (%)"
                          placeholder="100"
                          min={1}
                          max={100}
                          onChange={(val) => setValue(`owners.${index}.ownership_ratio`, Number(val))}
                        />
                        <ActionIcon color="red" variant="subtle" size="lg" onClick={() => removeOwner(index)} disabled={ownerFields.length === 1}>
                          <Trash2 size={20} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 4: المراجعة */}
          <Stepper.Completed>
            <Paper withBorder radius="32px" p="xl" mt="xl" bg="emerald-50/20" className="border-emerald-200">
              <Stack gap="xl" align="center" py="xl">
                <div className="h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={40} />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black text-emerald-950">جاهز للحفظ؟</h2>
                  <p className="text-emerald-700/70 font-bold mt-2">يرجى مراجعة كافة البيانات قبل تأكيد إضافة العقار</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
                  <div className="bg-white p-6 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                    <Text size="xs" fw={900} c="dimmed" tt="uppercase">اسم العقار</Text>
                    <Text size="lg" fw={900} c="emerald.9">{watch("name")}</Text>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                    <Text size="xs" fw={900} c="dimmed" tt="uppercase">المدينة والحي</Text>
                    <Text size="lg" fw={900} c="emerald.9">{watch("city")} - {watch("district")}</Text>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-emerald-100 text-center shadow-sm">
                    <Text size="xs" fw={900} c="dimmed" tt="uppercase">رقم الصك</Text>
                    <Text size="lg" fw={900} c="emerald.9">{watch("document_number")}</Text>
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

          {activeStep < 3 ? (
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
              loading={createProperty.isPending}
              onClick={handleSubmit(onSubmit)}
              leftSection={<Save size={18} />}
              radius="xl"
              size="lg"
              className="font-black px-10 shadow-lg shadow-emerald-500/20"
            >
              تأكيد وحفظ العقار
            </Button>
          )}
        </Group>
      </div>
    </main>
  );
}
