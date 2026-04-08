"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  ArrowRight, 
  User, 
  Building, 
  Phone, 
  Mail, 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  FileText, 
  Trash2, 
  AlertCircle,
  Calendar,
  Globe,
  MoreVertical,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Badge, 
  Group, 
  Stack, 
  Text, 
  Avatar, 
  Paper, 
  SimpleGrid, 
  ThemeIcon, 
  ActionIcon, 
  Menu, 
  Button, 
  Modal, 
  Divider,
  ScrollArea,
  TextInput
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";

export default function PartyDetailsPage() {
  const params = useParams();
  const partyId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [bankModalOpened, { open: openBankModal, close: closeBankModal }] = useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

  // Bank Form
  const bankForm = useForm({
    initialValues: {
      iban: "",
      bank_name: "",
      account_holder_name: "",
      is_default: false,
    },
    validate: {
      iban: (value) => (value.length === 24 ? null : "يجب أن يكون رقم الآيبان 24 حرفاً"),
      bank_name: (value) => (value.length > 0 ? null : "اسم البنك مطلوب"),
      account_holder_name: (value) => (value.length > 0 ? null : "اسم صاحب الحساب مطلوب"),
    },
  });

  // Edit Form
  const editForm = useForm({
    initialValues: {
      full_name: "",
      mobile: "",
      email: "",
      nationality: "",
      notes: "",
    },
  });

  // Fetch Party Details
  const { data: party, isLoading: partyLoading, error: partyError } = useQuery({
    queryKey: ["party", partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parties")
        .select(`
          *,
          party_bank_accounts (*)
        `)
        .eq("id", partyId)
        .single();

      if (error) throw error;
      
      // Sync edit form
      editForm.setValues({
        full_name: data.full_name,
        mobile: data.mobile,
        email: data.email || "",
        nationality: data.nationality || "",
        notes: data.notes || "",
      });
      
      return data;
    },
  });

  // Add Bank Account Mutation
  const addBankMutation = useMutation({
    mutationFn: async (values: typeof bankForm.values) => {
      const { error } = await supabase.from("party_bank_accounts").insert([
        {
          party_id: partyId,
          ...values,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة الحساب البنكي بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["party", partyId] });
      closeBankModal();
      bankForm.reset();
    },
  });

  // Edit Party Mutation
  const editPartyMutation = useMutation({
    mutationFn: async (values: typeof editForm.values) => {
      const { error } = await supabase
        .from("parties")
        .update(values)
        .eq("id", partyId);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تم التحديث", message: "تم تحديث بيانات الطرف بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["party", partyId] });
      closeEditModal();
    },
  });

  // Fetch Related Contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["party-contracts", partyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_contract_overview")
        .select("*")
        .or(`lessor_party_id.eq.${partyId},tenant_party_id.eq.${partyId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!partyId,
  });

  // Delete Mutation
  const deleteParty = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", partyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({
        title: "تم الحذف",
        message: "تم حذف الطرف بنجاح من النظام",
        color: "green",
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
      router.push("/parties");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
    },
    onError: (err: any) => {
      notifications.show({
        title: "خطأ في الحذف",
        message: err.message || "لا يمكن حذف هذا الطرف لارتباطه بسجلات أخرى",
        color: "red",
        icon: <AlertCircle className="h-5 w-5" />,
      });
      closeDeleteModal();
    },
  });

  if (partyLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (partyError || !party) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-rose-500">
        <AlertCircle className="h-16 w-16" />
        <h2 className="text-2xl font-black">عذراً، الطرف غير موجود</h2>
        <Link href="/parties" className="text-sm font-bold underline">العودة لقائمة الأطراف</Link>
      </div>
    );
  }

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-[40px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-2xl lg:p-12">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/parties"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-7 w-7" />
            </Link>
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="filled" color="emerald.4" size="lg" radius="xl" className="font-black">
                  {party.party_type === 'individual' ? 'فرد' : 'منشأة'}
                </Badge>
                <Badge variant="outline" color={party.is_active ? 'white' : 'rose.3'} size="lg" radius="xl" className="font-black">
                  {party.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                {party.full_name}
              </h1>
              <p className="text-sm font-medium text-emerald-50/70 sm:text-base">
                {party.arabic_name && party.arabic_name !== party.full_name ? party.arabic_name : 'عرض التفاصيل الكاملة والارتباطات'}
              </p>
            </div>
          </div>

          <div className="flex flex-row gap-2 sm:gap-3">
            <Button 
              variant="white" 
              color="emerald" 
              radius="xl" 
              size="md" 
              onClick={openEditModal}
              leftSection={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
              className="flex-1 sm:flex-none font-black text-xs sm:text-sm h-11 sm:h-12"
            >
              تعديل البيانات
            </Button>
            <Button 
              variant="filled" 
              color="red" 
              radius="xl" 
              size="md" 
              onClick={openDeleteModal}
              leftSection={<Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />}
              className="flex-1 sm:flex-none font-black text-xs sm:text-sm h-11 sm:h-12 shadow-lg shadow-rose-900/20"
            >
              حذف الطرف
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Info Column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Identity & Details Card */}
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
              <div className="flex items-center gap-3">
                <ThemeIcon variant="light" color="emerald" size="lg" radius="xl">
                  <ShieldCheck className="h-5 w-5" />
                </ThemeIcon>
                <h2 className="text-xl font-black text-emerald-950">بيانات الهوية والتعريف</h2>
              </div>
            </div>
            <div className="p-8">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                <InfoItem 
                  label={party.party_type === 'individual' ? "رقم الهوية / الإقامة" : "السجل التجاري"} 
                  value={party.party_type === 'individual' ? (party.national_id || party.iqama_no) : party.cr_number} 
                  icon={ShieldCheck} 
                />
                <InfoItem label="الجنسية" value={party.nationality} icon={Globe} />
                <InfoItem label="تاريخ الميلاد" value={party.date_of_birth ? new Date(party.date_of_birth).toLocaleDateString('ar-SA') : null} icon={Calendar} />
                <InfoItem label="نوع الطرف" value={party.party_type === 'individual' ? 'فرد' : 'مؤسسة / شركة'} icon={party.party_type === 'individual' ? User : Building} />
              </SimpleGrid>

              {party.notes && (
                <div className="mt-8 rounded-2xl bg-emerald-50/50 p-6 border border-emerald-100">
                  <Text size="xs" fw={900} c="emerald.8" className="uppercase tracking-widest mb-2">ملاحظات إضافية</Text>
                  <Text size="sm" className="font-medium text-emerald-900 leading-relaxed">{party.notes}</Text>
                </div>
              )}
            </div>
          </section>

          {/* Contact & Address Section */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Contact Card */}
            <Paper radius="32px" withBorder p="xl" className="border-emerald-100 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <ThemeIcon variant="light" color="emerald" size="md" radius="md">
                  <Phone className="h-4 w-4" />
                </ThemeIcon>
                <h3 className="font-black text-emerald-950">بيانات الاتصال</h3>
              </div>
              <Stack gap="md">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-50">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Text size="xs" fw={800} c="emerald.4" className="uppercase">رقم الجوال</Text>
                    <Text fw={900} className="text-emerald-950">{party.mobile || '—'}</Text>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-50">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Text size="xs" fw={800} c="emerald.4" className="uppercase">البريد الإلكتروني</Text>
                    <Text fw={900} className="text-emerald-950 truncate max-w-[200px]">{party.email || '—'}</Text>
                  </div>
                </div>
              </Stack>
            </Paper>

            {/* Address Card */}
            <Paper radius="32px" withBorder p="xl" className="border-emerald-100 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <ThemeIcon variant="light" color="emerald" size="md" radius="md">
                  <MapPin className="h-4 w-4" />
                </ThemeIcon>
                <h3 className="font-black text-emerald-950">العنوان الوطني</h3>
              </div>
              <Stack gap="xs">
                {party.address_json ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                      <Text size="xs" fw={800} c="emerald.3">المدينة</Text>
                      <Text size="sm" fw={900}>{party.address_json.city || '—'}</Text>
                    </div>
                    <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                      <Text size="xs" fw={800} c="emerald.3">الحي</Text>
                      <Text size="sm" fw={900}>{party.address_json.district || '—'}</Text>
                    </div>
                    <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                      <Text size="xs" fw={800} c="emerald.3">الشارع</Text>
                      <Text size="sm" fw={900}>{party.address_json.street || '—'}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="xs" fw={800} c="emerald.3">رقم المبنى</Text>
                      <Text size="sm" fw={900}>{party.address_json.building_no || '—'}</Text>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MapPin className="h-8 w-8 text-emerald-100 mx-auto mb-2" />
                    <Text size="xs" fw={700} c="dimmed">لا يوجد عنوان مسجل</Text>
                  </div>
                )}
              </Stack>
            </Paper>
          </SimpleGrid>

          {/* Bank Accounts Section */}
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ThemeIcon variant="light" color="emerald" size="lg" radius="xl">
                  <CreditCard className="h-5 w-5" />
                </ThemeIcon>
                <h2 className="text-xl font-black text-emerald-950">الحسابات البنكية</h2>
              </div>
              <Button 
                variant="light" 
                color="emerald" 
                radius="xl" 
                size="xs" 
                onClick={openBankModal}
                leftSection={<Plus className="h-4 w-4" />}
              >
                إضافة حساب
              </Button>
            </div>
            <div className="p-8">
              {party.party_bank_accounts && party.party_bank_accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {party.party_bank_accounts.map((acc: any) => (
                    <div key={acc.id} className="relative p-6 rounded-2xl border border-emerald-50 bg-emerald-50/10 group">
                      {acc.is_default && (
                        <Badge variant="filled" color="emerald" size="xs" className="absolute top-4 left-4">أساسي</Badge>
                      )}
                      <Text size="xs" fw={900} c="emerald.3" className="uppercase mb-1">{acc.bank_name || 'البنك'}</Text>
                      <Text fw={900} className="text-emerald-950 font-mono tracking-wider mb-1">{acc.iban}</Text>
                      <Text size="xs" fw={700} c="emerald.7">{acc.account_holder_name}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-emerald-50 rounded-3xl">
                  <CreditCard className="h-10 w-10 text-emerald-100 mx-auto mb-3" />
                  <Text fw={800} c="emerald.2">لا توجد حسابات بنكية مسجلة</Text>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column: Contracts & Activity */}
        <div className="space-y-8">
          {/* Recent Contracts Card */}
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
              <div className="flex items-center gap-3">
                <ThemeIcon variant="light" color="emerald" size="lg" radius="xl">
                  <FileText className="h-5 w-5" />
                </ThemeIcon>
                <h2 className="text-xl font-black text-emerald-950">العقود المرتبطة</h2>
              </div>
            </div>
            <div className="p-6">
              {contractsLoading ? (
                <Stack gap="md">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-emerald-50/50 animate-pulse rounded-2xl" />)}
                </Stack>
              ) : contracts && contracts.length > 0 ? (
                <Stack gap="md">
                  {contracts.map((contract: any) => (
                    <Link 
                      key={contract.id} 
                      href={`/contracts/${contract.id}`}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-emerald-50 hover:bg-emerald-50/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm ${contract.status_internal === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <Text size="sm" fw={900} className="text-emerald-950 group-hover:text-emerald-700">{contract.contract_number_internal}</Text>
                          <Text size="xs" fw={700} c="dimmed">{contract.property_name || '—'}</Text>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-200 rotate-180 group-hover:text-emerald-500 transition-colors" />
                    </Link>
                  ))}
                  <Button variant="subtle" color="emerald" fullWidth radius="xl" className="font-black mt-2">مشاهدة جميع العقود</Button>
                </Stack>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-emerald-100 mx-auto mb-3" />
                  <Text size="sm" fw={800} c="emerald.2">لا توجد عقود مسجلة لهذا الطرف</Text>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions Card */}
          <Paper radius="32px" withBorder p="xl" className="border-emerald-100 bg-white">
            <h3 className="font-black text-emerald-950 mb-6">إجراءات سريعة</h3>
            <Stack gap="sm">
              <QuickActionButton icon={Mail} label="إرسال بريد إلكتروني" color="blue" />
              <QuickActionButton icon={Phone} label="اتصال عبر الجوال" color="emerald" />
              <QuickActionButton icon={Calendar} label="جدولة موعد" color="violet" />
              <Divider my="sm" />
              <QuickActionButton icon={AlertCircle} label="تبليغ عن مشكلة" color="rose" />
            </Stack>
          </Paper>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        centered
        radius="32px"
        padding="xl"
        withCloseButton={false}
      >
        <div className="text-center py-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-emerald-950 mb-2">تأكيد حذف الطرف</h3>
          <p className="text-sm font-medium text-emerald-600/60 mb-8 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف <span className="font-black text-rose-600">"{party.full_name}"</span> نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3">
            <Button 
              fullWidth 
              variant="filled" 
              color="red" 
              radius="xl" 
              size="lg" 
              onClick={() => deleteParty.mutate()}
              loading={deleteParty.isPending}
              className="font-black"
            >
              نعم، احذف الآن
            </Button>
            <Button 
              fullWidth 
              variant="light" 
              color="gray" 
              radius="xl" 
              size="lg" 
              onClick={closeDeleteModal}
              disabled={deleteParty.isPending}
              className="font-black"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Bank Account Modal */}
      <Modal
        opened={bankModalOpened}
        onClose={closeBankModal}
        title={<Text fw={900}>إضافة حساب بنكي جديد</Text>}
        centered
        radius="32px"
        padding="xl"
      >
        <form onSubmit={bankForm.onSubmit((values) => addBankMutation.mutate(values))}>
          <Stack gap="md">
            <TextInput
              label="رقم الآيبان (IBAN)"
              placeholder="SAXXXXXXXXXXXXXXXXXXXXXXXX"
              required
              {...bankForm.getInputProps("iban")}
            />
            <TextInput
              label="اسم البنك"
              placeholder="مصرف الراجحي"
              required
              {...bankForm.getInputProps("bank_name")}
            />
            <TextInput
              label="اسم صاحب الحساب"
              placeholder="كما يظهر في البنك"
              required
              {...bankForm.getInputProps("account_holder_name")}
            />
            <Button 
              type="submit" 
              fullWidth 
              radius="xl" 
              size="md" 
              color="emerald"
              loading={addBankMutation.isPending}
              className="font-black mt-4"
            >
              حفظ الحساب
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Edit Party Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title={<Text fw={900}>تعديل بيانات الطرف</Text>}
        centered
        radius="32px"
        padding="xl"
        size="lg"
      >
        <form onSubmit={editForm.onSubmit((values) => editPartyMutation.mutate(values))}>
          <Stack gap="md">
            <TextInput
              label="الاسم الكامل"
              required
              {...editForm.getInputProps("full_name")}
            />
            <SimpleGrid cols={2}>
              <TextInput
                label="رقم الجوال"
                required
                {...editForm.getInputProps("mobile")}
              />
              <TextInput
                label="البريد الإلكتروني"
                {...editForm.getInputProps("email")}
              />
            </SimpleGrid>
            <TextInput
              label="الجنسية"
              {...editForm.getInputProps("nationality")}
            />
            <TextInput
              label="ملاحظات"
              {...editForm.getInputProps("notes")}
            />
            <Button 
              type="submit" 
              fullWidth 
              radius="xl" 
              size="md" 
              color="emerald"
              loading={editPartyMutation.isPending}
              className="font-black mt-4"
            >
              تحديث البيانات
            </Button>
          </Stack>
        </form>
      </Modal>
    </main>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string, value: string | null | undefined, icon: any }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl border border-emerald-50 hover:bg-emerald-50/20 transition-colors">
      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <Text size="xs" fw={800} c="emerald.3" className="uppercase tracking-widest mb-1">{label}</Text>
        <Text size="md" fw={900} className="text-emerald-950">{value || '—'}</Text>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl p-3 text-right transition-all hover:bg-gray-50 active:scale-95">
      <div className={`h-10 w-10 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-black text-emerald-950">{label}</span>
    </button>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
