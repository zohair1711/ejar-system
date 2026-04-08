"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  Building2, 
  Wallet, 
  FileText, 
  Building, 
  Users, 
  Edit, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Plus,
  LayoutGrid,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Hash,
  ShieldCheck,
  Globe,
  Info,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { 
  Badge, 
  Group, 
  Stack, 
  Text, 
  Progress, 
  SimpleGrid, 
  Paper, 
  ThemeIcon, 
  Title, 
  Table,
  Modal,
  TextInput,
  Textarea,
  Button,
  Switch,
  ActionIcon,
  Select
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

export default function OfficesPage() {
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [branchModalOpened, { open: openBranchModal, close: closeBranchModal }] = useDisclosure(false);
  const [agreementModalOpened, { open: openAgreementModal, close: closeAgreementModal }] = useDisclosure(false);

  // Fetch first office (assuming single office setup for now)
  const { data: office, isLoading: officeLoading } = useQuery({
    queryKey: ["office_profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Branch Form
  const branchForm = useForm({
    initialValues: {
      name: "",
      office_code: "",
      phone: "",
      email: "",
      city: "",
      is_active: true,
    },
    validate: {
      name: (value) => (value.length > 0 ? null : "اسم الفرع مطلوب"),
    },
  });

  // Agreement Form
  const agreementForm = useForm({
    initialValues: {
      agreement_number: "",
      party_id: "",
      start_date: "",
      end_date: "",
      status: "draft",
    },
    validate: {
      agreement_number: (value) => (value.length > 0 ? null : "رقم الاتفاقية مطلوب"),
      party_id: (value) => (value ? null : "يجب اختيار الطرف الثاني"),
    },
  });

  // Fetch Parties for Agreement Selection
  const { data: parties } = useQuery({
    queryKey: ["parties_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parties")
        .select("id, full_name")
        .eq("is_active", true);
      if (error) throw error;
      return data?.map(p => ({ value: p.id, label: p.full_name })) || [];
    },
  });

  const form = useForm({
    initialValues: {
      name: "",
      office_code: "",
      commercial_registration: "",
      unified_number: "",
      brokerage_license_number: "",
      tax_number: "",
      ejar_office_id: "",
      phone: "",
      email: "",
      notes: "",
      is_active: true,
      city: "",
      district: "",
      street: "",
      building_no: "",
      postal_code: "",
    },
  });

  // Update form when office data is loaded
  useEffect(() => {
    if (office) {
      const address = office.address_json || {};
      form.setValues({
        name: office.name || "",
        office_code: office.office_code || "",
        commercial_registration: office.commercial_registration || "",
        unified_number: (office as any).unified_number || "",
        brokerage_license_number: (office as any).brokerage_license_number || "",
        tax_number: (office as any).tax_number || "",
        ejar_office_id: office.ejar_office_id || "",
        phone: (office as any).phone || "",
        email: (office as any).email || "",
        notes: office.notes || "",
        is_active: office.is_active ?? true,
        city: address.city || "",
        district: address.district || "",
        street: address.street || "",
        building_no: address.building_no || "",
        postal_code: address.postal_code || "",
      });
    }
  }, [office]);

  const updateOffice = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const { city, district, street, building_no, postal_code, ...rest } = values;
      const payload = {
        ...rest,
        address_json: { city, district, street, building_no, postal_code }
      };
      
      const { data, error } = await supabase
        .from("offices")
        .update(payload)
        .eq("id", office.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_profile"] });
      setEditModalOpen(false);
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["office_stats"],
    queryFn: async () => {
      const [properties, units, contracts] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("units").select("id", { count: "exact", head: true }),
        supabase.from("contracts").select("id", { count: "exact", head: true }),
      ]);
      return {
        properties: properties.count || 0,
        units: units.count || 0,
        contracts: contracts.count || 0,
      };
    },
  });

  // Fetch Brokerage Agreements
  const { data: agreements } = useQuery({
    queryKey: ["brokerage_agreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brokerage_agreements")
        .select("*, parties(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch Office Bank Accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["office_bank_accounts", office?.id],
    enabled: !!office?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_bank_accounts")
        .select("*")
        .eq("office_id", office.id)
        .order("is_default", { ascending: false });

      if (error) {
        // If table doesn't exist yet, return empty array gracefully
        if (error.code === '42P01') return [];
        throw error;
      }
      return data;
    },
  });

  const [ibanModalOpen, setIbanModalOpen] = useState(false);
  const ibanForm = useForm({
    initialValues: {
      bank_name: "",
      iban: "",
      account_holder_name: "",
      account_type: "general",
      is_default: false,
    },
  });

  const addBankAccount = useMutation({
    mutationFn: async (values: typeof ibanForm.values) => {
      const { data, error } = await supabase
        .from("office_bank_accounts")
        .insert([{ ...values, office_id: office.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_bank_accounts"] });
      setIbanModalOpen(false);
      ibanForm.reset();
    },
  });

  const addBranchMutation = useMutation({
    mutationFn: async (values: typeof branchForm.values) => {
      const { data, error } = await supabase
        .from("offices")
        .insert([{ ...values, is_active: true }]) // For now, inserting as a new office entry
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة الفرع بنجاح", color: "green" });
      closeBranchModal();
      branchForm.reset();
    },
  });

  const addAgreementMutation = useMutation({
    mutationFn: async (values: typeof agreementForm.values) => {
      const { data, error } = await supabase
        .from("brokerage_agreements")
        .insert([{ ...values, office_id: office.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة اتفاقية الوساطة بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["brokerage_agreements"] });
      closeAgreementModal();
      agreementForm.reset();
    },
  });

  if (officeLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="space-y-8" dir="rtl">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden p-4">
               <Building2 className="h-10 w-10 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="filled" color="emerald.4" size="sm" radius="xl">الملف التعريفي</Badge>
                <Badge variant="light" color="blue" size="sm" radius="xl" className="bg-white/10 text-blue-100 border-white/10">
                  {office?.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <h1 className="text-3xl font-black leading-tight md:text-5xl">{office?.name}</h1>
              <p className="mt-2 text-emerald-50/70 font-medium">كود المكتب: <span className="text-white font-bold">{office?.office_code}</span></p>
            </div>
          </div>

          <div className="flex flex-row gap-2 sm:gap-4">
            <button 
              onClick={() => setEditModalOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20 whitespace-nowrap"
            >
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              تعديل الملف
            </button>
            <button 
              onClick={openBranchModal}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-black text-emerald-700 shadow-xl transition hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              إضافة فرع
            </button>
          </div>
        </div>
      </div>

      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={<Text fw={900} size="xl" className="text-emerald-950">تعديل بيانات المكتب العقاري</Text>}
        size="xl"
        radius="32px"
        padding="xl"
        overlayProps={{
          blur: 8,
          color: "var(--mantine-color-emerald-9)",
          opacity: 0.1,
        }}
      >
        <form onSubmit={form.onSubmit((values) => updateOffice.mutate(values))} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="اسم المكتب"
              placeholder="مثال: شركة اليمامة العقارية"
              {...form.getInputProps("name")}
              required
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="كود المكتب"
              placeholder="مثال: OFFICE-01"
              {...form.getInputProps("office_code")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="رقم السجل التجاري"
              placeholder="مثال: 1010XXXXXX"
              {...form.getInputProps("commercial_registration")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="الرقم الموحد (700)"
              placeholder="مثال: 700XXXXXXX"
              {...form.getInputProps("unified_number")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="رقم ترخيص الوساطة (REGA)"
              placeholder="مثال: 1200XXXXXX"
              {...form.getInputProps("brokerage_license_number")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="الرقم الضريبي (VAT)"
              placeholder="مثال: 300XXXXXXXXXXXX"
              {...form.getInputProps("tax_number")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="رقم تعريف إيجار (Ejar ID)"
              placeholder="مثال: EJ-XXXXX"
              {...form.getInputProps("ejar_office_id")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="رقم التواصل"
              placeholder="مثال: 05XXXXXXXX"
              {...form.getInputProps("phone")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
            <TextInput
              label="البريد الإلكتروني"
              placeholder="office@example.com"
              {...form.getInputProps("email")}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
            />
          </div>

          <div className="border-t border-emerald-50 pt-8 mt-4">
             <Text fw={900} size="sm" className="text-emerald-800 mb-6 flex items-center gap-2">
                <MapPin size={18} />
                العنوان الوطني والتفاصيل الجغرافية
             </Text>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TextInput
                  label="المدينة"
                  placeholder="مثال: الرياض"
                  {...form.getInputProps("city")}
                  classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
                />
                <TextInput
                  label="الحي"
                  placeholder="مثال: الملز"
                  {...form.getInputProps("district")}
                  classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
                />
                <TextInput
                  label="الشارع"
                  placeholder="مثال: شارع الأمير سلطان"
                  {...form.getInputProps("street")}
                  classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
                />
                <TextInput
                  label="رقم المبنى"
                  placeholder="مثال: 1234"
                  {...form.getInputProps("building_no")}
                  classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
                />
                <TextInput
                  label="الرمز البريدي"
                  placeholder="مثال: 12345"
                  {...form.getInputProps("postal_code")}
                  classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold h-12" }}
                />
             </div>
          </div>

          <div className="border-t border-emerald-50 pt-8 mt-4 space-y-6">
            <Text fw={900} size="sm" className="text-emerald-800 mb-2 flex items-center gap-2">
                <Info size={18} />
                معلومات إضافية وحالة المكتب
             </Text>
            <Textarea
              label="ملاحظات إضافية"
              placeholder="أي تفاصيل أو شروط خاصة بالمكتب..."
              {...form.getInputProps("notes")}
              minRows={3}
              classNames={{ input: "rounded-xl border-emerald-100 focus:border-emerald-500 font-bold" }}
            />
            <Switch
              label="حالة المكتب (نشط / غير نشط)"
              {...form.getInputProps("is_active", { type: "checkbox" })}
              color="emerald"
              fw={900}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              color="emerald" 
              size="lg" 
              radius="xl" 
              className="flex-1 font-black shadow-xl shadow-emerald-500/20"
              loading={updateOffice.isPending}
              leftSection={<Save size={20} />}
            >
              حفظ التغييرات
            </Button>
            <Button 
              variant="light" 
              color="rose" 
              size="lg" 
              radius="xl" 
              onClick={() => setEditModalOpen(false)}
              className="font-black"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Branch Modal */}
      <Modal
        opened={branchModalOpened}
        onClose={closeBranchModal}
        title={<Text fw={900} size="xl" className="text-emerald-950">إضافة فرع جديد</Text>}
        radius="32px"
        padding="xl"
      >
        <form onSubmit={branchForm.onSubmit((values) => addBranchMutation.mutate(values))} className="space-y-6">
          <TextInput
            label="اسم الفرع"
            placeholder="مثال: فرع جدة"
            required
            {...branchForm.getInputProps("name")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <TextInput
            label="كود الفرع"
            placeholder="مثال: BRANCH-02"
            {...branchForm.getInputProps("office_code")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <TextInput
            label="رقم التواصل"
            placeholder="05XXXXXXXX"
            {...branchForm.getInputProps("phone")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <TextInput
            label="المدينة"
            placeholder="جدة"
            {...branchForm.getInputProps("city")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <Button 
            type="submit" 
            color="emerald" 
            fullWidth 
            radius="xl" 
            size="lg" 
            className="font-black"
            loading={addBranchMutation.isPending}
          >
            حفظ الفرع
          </Button>
        </form>
      </Modal>

      {/* Add Agreement Modal */}
      <Modal
        opened={agreementModalOpened}
        onClose={closeAgreementModal}
        title={<Text fw={900} size="xl" className="text-emerald-950">إضافة اتفاقية وساطة</Text>}
        radius="32px"
        padding="xl"
      >
        <form onSubmit={agreementForm.onSubmit((values) => addAgreementMutation.mutate(values))} className="space-y-6">
          <TextInput
            label="رقم الاتفاقية"
            placeholder="BR-2024-XXXX"
            required
            {...agreementForm.getInputProps("agreement_number")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <Select
            label="الطرف الثاني (المالك)"
            placeholder="اختر الطرف الثاني"
            required
            data={parties || []}
            {...agreementForm.getInputProps("party_id")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="تاريخ البداية"
              type="date"
              required
              {...agreementForm.getInputProps("start_date")}
              classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
            />
            <TextInput
              label="تاريخ النهاية"
              type="date"
              required
              {...agreementForm.getInputProps("end_date")}
              classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
            />
          </div>
          <Select
            label="الحالة"
            data={[
              { value: 'draft', label: 'مسودة' },
              { value: 'active', label: 'نشطة' },
            ]}
            {...agreementForm.getInputProps("status")}
            classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
          />
          <Button 
            type="submit" 
            color="emerald" 
            fullWidth 
            radius="xl" 
            size="lg" 
            className="font-black"
            loading={addAgreementMutation.isPending}
          >
            حفظ الاتفاقية
          </Button>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Office Sidebar: Wallet, IBANs, Legal Info */}
        <div className="lg:col-span-1 space-y-6">
          <section className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-emerald-950 p-8 text-white shadow-2xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <Wallet className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">المحفظة الإلكترونية</p>
                  <p className="text-xs text-emerald-100/50">الرصيد المتاح حالياً</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{office?.wallet_balance?.toLocaleString()}</span>
                  <span className="text-sm font-bold text-emerald-500">ريال سعودي</span>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                  <CreditCard className="h-5 w-5" />
                  شحن الرصيد
                </button>
              </div>
            </div>
          </section>

          {/* IBANs Section */}
          <section className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-emerald-950">الحسابات البنكية (IBAN)</h3>
              <ActionIcon variant="light" color="emerald" radius="xl" onClick={() => setIbanModalOpen(true)}>
                <Plus size={18} />
              </ActionIcon>
            </div>
            <div className="space-y-4">
              {bankAccounts && bankAccounts.length > 0 ? (
                bankAccounts.map((acc: any) => (
                  <div key={acc.id} className="p-4 rounded-2xl border border-emerald-50 bg-emerald-50/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-emerald-900">{acc.bank_name}</span>
                      {acc.is_default && <Badge color="emerald" size="xs">افتراضي</Badge>}
                    </div>
                    <Text size="xs" fw={900} className="font-mono text-emerald-950 truncate mb-1">{acc.iban}</Text>
                    <div className="flex items-center justify-between">
                      <Text size="10px" fw={700} c="dimmed">{acc.account_holder_name}</Text>
                      <Badge size="xs" variant="outline" color="blue">
                        {acc.account_type === 'rent' ? 'إيجار' : acc.account_type === 'fees' ? 'رسوم' : 'عام'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-emerald-50 rounded-2xl">
                   <p className="text-xs font-bold text-emerald-300">لا توجد حسابات مسجلة</p>
                </div>
              )}
            </div>
          </section>

          <Modal
            opened={ibanModalOpen}
            onClose={() => setIbanModalOpen(false)}
            title={<Text fw={900} size="xl" className="text-emerald-950">إضافة حساب بنكي جديد</Text>}
            radius="32px"
            padding="xl"
          >
            <form onSubmit={ibanForm.onSubmit((values) => addBankAccount.mutate(values))} className="space-y-6">
              <TextInput
                label="اسم البنك"
                placeholder="مثال: مصرف الراجحي"
                {...ibanForm.getInputProps("bank_name")}
                required
                classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
              />
              <TextInput
                label="رقم الآيبان (IBAN)"
                placeholder="SAXXXXXXXXXXXXXXXXXXXXXXXX"
                {...ibanForm.getInputProps("iban")}
                required
                classNames={{ input: "rounded-xl border-emerald-100 font-bold font-mono" }}
              />
              <TextInput
                label="اسم صاحب الحساب"
                placeholder="كما هو مسجل في البنك"
                {...ibanForm.getInputProps("account_holder_name")}
                required
                classNames={{ input: "rounded-xl border-emerald-100 font-bold" }}
              />
              <div className="grid grid-cols-2 gap-4">
                 <select 
                   className="w-full rounded-xl border border-emerald-100 p-2.5 text-sm font-bold"
                   {...ibanForm.getInputProps("account_type")}
                 >
                   <option value="general">عام</option>
                   <option value="rent">تحصيل إيجار</option>
                   <option value="fees">تحصيل رسوم</option>
                 </select>
                 <Switch 
                   label="حساب افتراضي" 
                   {...ibanForm.getInputProps("is_default", { type: "checkbox" })}
                   className="flex items-center"
                 />
              </div>
              <Button 
                type="submit" 
                color="emerald" 
                fullWidth 
                radius="xl" 
                size="lg" 
                className="font-black"
                loading={addBankAccount.isPending}
              >
                حفظ الحساب
              </Button>
            </form>
          </Modal>

          {/* Quick Info Card */}
          <section className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
             <h3 className="text-lg font-black text-emerald-950 mb-6">المعلومات القانونية</h3>
             <div className="space-y-5">
               <InfoItem label="السجل التجاري" value={office?.commercial_registration || 'غير مسجل'} />
               <InfoItem label="الرقم الموحد (700)" value={(office as any)?.unified_number || 'غير مسجل'} />
               <InfoItem label="ترخيص الوساطة" value={(office as any)?.brokerage_license_number || 'غير مسجل'} />
               <InfoItem label="الرقم الضريبي" value={(office as any)?.tax_number || 'غير مسجل'} />
               <InfoItem label="رقم عضوية إيجار" value={office?.ejar_office_id || 'غير مرتبط'} />
               <div className="pt-4 border-t border-emerald-50">
                 <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-widest mb-3">بيانات التواصل</p>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-emerald-900">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Phone size={14} />
                      </div>
                      <span className="text-sm font-bold">{(office as any)?.phone || 'لا يوجد رقم'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-900">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Mail size={14} />
                      </div>
                      <span className="text-sm font-bold">{(office as any)?.email || 'لا يوجد بريد'}</span>
                    </div>
                 </div>
               </div>
               <div className="pt-4 border-t border-emerald-50">
                 <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-widest mb-2">ملاحظات المكتب</p>
                 <p className="text-sm font-bold text-emerald-900/60 leading-relaxed">
                   {office?.notes || 'لا توجد ملاحظات إضافية للمكتب.'}
                 </p>
               </div>
             </div>
          </section>
        </div>

        {/* Stats and Performance */}
        <div className="lg:col-span-2 space-y-8">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
            <StatBox icon={Building} label="العقارات المسجلة" value={stats?.properties || 0} color="emerald" />
            <StatBox icon={LayoutGrid} label="إجمالي الوحدات" value={stats?.units || 0} color="blue" />
            <StatBox icon={FileText} label="العقود النشطة" value={stats?.contracts || 0} color="teal" />
          </SimpleGrid>

          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-emerald-950">نظرة عامة على الأداء</h2>
              </div>
            </div>
            
            <div className="p-8">
               <div className="space-y-8">
                 <PerformanceItem 
                   label="نسبة إشغال الوحدات" 
                   value={75} 
                   color="emerald" 
                   description="75 وحدة مؤجرة من أصل 100" 
                 />
                 <PerformanceItem 
                   label="نسبة التحصيل المالي" 
                   value={92} 
                   color="blue" 
                   description="92% من الإيجارات تم تحصيلها بنجاح" 
                 />
                 <PerformanceItem 
                   label="العقود المنتهية قريباً" 
                   value={12} 
                   color="orange" 
                   description="12 عقد بحاجة للتجديد خلال الـ 30 يوماً القادمة" 
                 />
               </div>
            </div>
          </section>

          {/* Brokerage Agreements */}
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-emerald-950">اتفاقيات الوساطة العقارية</h2>
              </div>
              <button 
                onClick={openAgreementModal}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-md"
              >
                <Plus size={14} />
                اتفاقية جديدة
              </button>
            </div>

            <div className="p-0">
              <Table verticalSpacing="md" horizontalSpacing="xl" className="text-sm">
                <thead className="bg-emerald-50/30">
                  <tr>
                    <th className="font-black text-emerald-800/40 uppercase tracking-widest text-[10px] text-right">رقم الاتفاقية</th>
                    <th className="font-black text-emerald-800/40 uppercase tracking-widest text-[10px] text-right">الطرف الثاني (المالك)</th>
                    <th className="font-black text-emerald-800/40 uppercase tracking-widest text-[10px] text-right">الفترة</th>
                    <th className="font-black text-emerald-800/40 uppercase tracking-widest text-[10px] text-right">الحالة</th>
                    <th className="font-black text-emerald-800/40 uppercase tracking-widest text-[10px] text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {agreements && agreements.length > 0 ? (
                    agreements.map((agreement) => (
                      <tr key={agreement.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="font-black text-emerald-950">{agreement.agreement_number}</td>
                        <td className="font-bold text-emerald-900">{(agreement as any).parties?.full_name}</td>
                        <td className="text-xs font-medium text-emerald-600">
                          {agreement.start_date} إلى {agreement.end_date}
                        </td>
                        <td>
                          <Badge 
                            variant="dot" 
                            color={agreement.status === 'active' ? 'emerald' : 'orange'}
                            className="font-black"
                          >
                            {agreement.status === 'active' ? 'نشطة' : 'مسودة'}
                          </Badge>
                        </td>
                        <td>
                          <button className="p-2 text-emerald-400 hover:text-emerald-600 transition-colors">
                            <ArrowUpRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-emerald-300 font-bold">
                        لا توجد اتفاقيات وساطة مسجلة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-emerald-50 last:border-0">
      <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-emerald-900">{value}</span>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <Paper radius="32px" p="xl" withBorder className="border-emerald-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <ThemeIcon variant="light" color={color} size={54} radius="20px" className="mb-4">
        <Icon size={28} />
      </ThemeIcon>
      <Text size="xs" fw={900} c="dimmed" tt="uppercase" lts="1px">{label}</Text>
      <Text size="32px" fw={900} c="dark.9">{value}</Text>
    </Paper>
  );
}

function PerformanceItem({ label, value, color, description }: { label: string, value: number, color: string, description: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-emerald-950">{label}</p>
          <p className="text-[10px] font-bold text-emerald-600/50">{description}</p>
        </div>
        <span className="text-xl font-black text-emerald-900">{value}%</span>
      </div>
      <Progress value={value} color={color} size="lg" radius="xl" className="bg-emerald-50" />
    </div>
  );
}
