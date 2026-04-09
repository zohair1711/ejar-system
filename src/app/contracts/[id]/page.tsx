"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  ArrowRight, 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  MoreVertical,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  CreditCard,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Badge, 
  Group, 
  Stack, 
  Text, 
  Paper, 
  SimpleGrid, 
  ThemeIcon, 
  ActionIcon, 
  Menu, 
  Button, 
  Tabs,
  Progress,
  Divider,
  Timeline,
  Modal,
  TextInput,
  NumberInput,
  Select
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";

export default function ContractDetailsPage() {
  const params = useParams();
  const contractId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);

  // Fetch Full Contract Details
  const { data: contract, isLoading, error } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          properties (name, address_json),
          units (unit_number, type, floor),
          lessor:parties!lessor_party_id (full_name, mobile, national_id),
          tenant:parties!tenant_party_id (full_name, mobile, national_id),
          financial_info:contract_financial_info (*),
          invoices:contract_invoices (*),
          services:contract_unit_services (*),
          documents:contract_signed_documents (*)
        `)
        .eq("id", contractId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Payment Form
  const paymentForm = useForm({
    initialValues: {
      invoice_id: "",
      amount: 0,
      payment_method: "bank_transfer",
      transaction_ref: "",
    },
  });

  // Payment Mutation
  const registerPayment = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("payments")
        .insert([{
          invoice_id: values.invoice_id,
          amount: values.amount,
          payment_method: values.payment_method,
          transaction_ref: values.transaction_ref,
          status: 'paid'
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تم السداد", message: "تم تسجيل الدفعة بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      closePaymentModal();
    }
  });

  if (isLoading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div></div>;
  if (error || !contract) return <div className="p-12 text-center"><AlertCircle size={48} className="mx-auto text-rose-500 mb-4" /><h2 className="text-2xl font-black">العقد غير موجود</h2><Link href="/contracts" className="text-emerald-600 underline mt-4 inline-block">العودة لسجل العقود</Link></div>;

  const financial = contract.financial_info?.[0] || {};
  const paidInvoices = contract.invoices?.filter((i: any) => i.status === 'paid') || [];
  const totalPaid = paidInvoices.reduce((sum: number, i: any) => sum + i.total_amount, 0);
  const totalAmount = contract.invoices?.reduce((sum: number, i: any) => sum + i.total_amount, 0) || 0;
  const paymentProgress = totalAmount ? Math.round((totalPaid / totalAmount) * 100) : 0;

  return (
    <main className="space-y-8" dir="rtl">
      {/* Header Hero */}
      <div className="relative overflow-hidden rounded-[40px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-2xl lg:p-12">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/contracts" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20">
              <ArrowRight size={28} />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge variant="filled" color="emerald.4" size="lg" radius="xl" className="font-black">عقد {contract.contract_category === 'residential' ? 'سكني' : 'تجاري'}</Badge>
                <Badge variant="outline" color="white" size="lg" radius="xl" className="font-black">{getStatusLabel(contract.status_internal)}</Badge>
              </div>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">عقد رقم: {contract.contract_number_internal}</h1>
              <p className="text-sm font-medium text-emerald-50/70 sm:text-base mt-2">{contract.properties?.name} - وحدة رقم {contract.units?.unit_number}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="white" color="emerald" radius="xl" size="md" leftSection={<Download size={20} />} className="font-black">تحميل العقد</Button>
            <Button variant="filled" color="rose" radius="xl" size="md" leftSection={<AlertCircle size={20} />} className="font-black shadow-lg shadow-rose-900/20">إلغاء العقد</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-8 lg:col-span-2">
          {/* Financial Summary Card */}
          <Paper radius="32px" withBorder p="xl" className="border-emerald-100 bg-white shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -mr-16 -mt-16 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <ThemeIcon variant="light" color="emerald" size="lg" radius="xl"><Wallet size={24} /></ThemeIcon>
                  <h2 className="text-xl font-black text-emerald-950">الملخص المالي</h2>
                </div>
                <div className="text-left">
                  <Text size="xs" fw={900} c="dimmed" className="uppercase tracking-widest">إجمالي قيمة العقد</Text>
                  <Text size="xl" fw={900} className="text-emerald-600">{financial.rent_amount?.toLocaleString()} ر.س</Text>
                </div>
              </div>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                <div className="space-y-1">
                  <Text size="xs" fw={800} c="dimmed">المبلغ المحصل</Text>
                  <Text fw={900} size="lg">{totalPaid.toLocaleString()} ر.س</Text>
                </div>
                <div className="space-y-1">
                  <Text size="xs" fw={800} c="dimmed">المتبقي</Text>
                  <Text fw={900} size="lg" c="rose.6">{(totalAmount - totalPaid).toLocaleString()} ر.س</Text>
                </div>
                <div className="space-y-1">
                  <Text size="xs" fw={800} c="dimmed">دورة الدفع</Text>
                  <Text fw={900} size="lg">{getFrequencyLabel(financial.payment_frequency)}</Text>
                </div>
              </SimpleGrid>

              <div className="mt-8">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={900} className="text-emerald-950">نسبة التحصيل</Text>
                  <Text size="sm" fw={900} c="emerald.6">{paymentProgress}%</Text>
                </Group>
                <Progress value={paymentProgress} color="emerald" size="xl" radius="xl" animated className="bg-emerald-50" />
              </div>
            </div>
          </Paper>

          {/* Details Tabs */}
          <Tabs defaultValue="invoices" variant="pills" radius="xl" color="emerald">
            <Tabs.List className="bg-emerald-50/50 p-1.5 rounded-[24px] border border-emerald-100 mb-8">
              <Tabs.Tab value="invoices" leftSection={<FileText size={16} />} className="font-black px-6">جدول الدفعات</Tabs.Tab>
              <Tabs.Tab value="parties" leftSection={<User size={16} />} className="font-black px-6">أطراف العقد</Tabs.Tab>
              <Tabs.Tab value="services" leftSection={<Zap size={16} />} className="font-black px-6">الخدمات</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="invoices">
              <div className="space-y-4">
                {contract.invoices?.sort((a:any, b:any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map((inv: any) => (
                  <Paper key={inv.id} radius="24px" withBorder p="lg" className="border-emerald-50 hover:border-emerald-200 transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {inv.status === 'paid' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                          <Text fw={900} className="text-emerald-950">دفعة {new Date(inv.due_date).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</Text>
                          <Text size="xs" c="dimmed" fw={700}>تاريخ الاستحقاق: {new Date(inv.due_date).toLocaleDateString('ar-SA')}</Text>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-left">
                          <Text fw={900} size="lg" className="text-emerald-950">{inv.total_amount?.toLocaleString()} ر.س</Text>
                          <Badge variant="light" color={inv.status === 'paid' ? 'emerald' : 'orange'} size="sm" radius="md">{inv.status === 'paid' ? 'تم السداد' : 'بانتظار السداد'}</Badge>
                        </div>
                        {inv.status !== 'paid' && (
                          <Button 
                            variant="light" 
                            color="emerald" 
                            radius="xl" 
                            onClick={() => {
                              paymentForm.setFieldValue('invoice_id', inv.id);
                              paymentForm.setFieldValue('amount', inv.total_amount);
                              openPaymentModal();
                            }}
                            className="font-black"
                          >سداد</Button>
                        )}
                      </div>
                    </div>
                  </Paper>
                ))}
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="parties">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <PartyCard role="المؤجر" party={contract.lessor} icon={ShieldCheck} color="emerald" />
                <PartyCard role="المستأجر" party={contract.tenant} icon={User} color="blue" />
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="services">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contract.services?.map((service: any) => (
                  <Paper key={service.id} radius="24px" withBorder p="lg" className="border-emerald-50">
                    <Group justify="space-between">
                      <div className="flex items-center gap-3">
                        <ThemeIcon variant="light" color="emerald" radius="md"><Zap size={18} /></ThemeIcon>
                        <Text fw={900} className="text-emerald-950">{getServiceLabel(service.service_type)}</Text>
                      </div>
                      <Text fw={900} c="emerald.7">{service.amount} ر.س</Text>
                    </Group>
                  </Paper>
                ))}
                {(!contract.services || contract.services.length === 0) && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-emerald-50 rounded-[32px]">
                    <Zap size={40} className="mx-auto text-emerald-100 mb-3" />
                    <Text fw={800} c="emerald.2">لا توجد خدمات إضافية مسجلة</Text>
                  </div>
                )}
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>

        {/* Sidebar Activity */}
        <div className="space-y-8">
          <Paper radius="32px" withBorder p="xl" className="border-emerald-100 bg-white shadow-sm">
            <h3 className="font-black text-emerald-950 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-emerald-500" />
              سجل الأحداث
            </h3>
            <Timeline active={1} bulletSize={30} lineWidth={2} color="emerald">
              <Timeline.Item bullet={<CheckCircle2 size={16} />} title={<Text fw={900} size="sm">إنشاء العقد</Text>}>
                <Text size="xs" c="dimmed" fw={700}>{new Date(contract.created_at).toLocaleString('ar-SA')}</Text>
                <Text size="xs" mt={4}>تم إنشاء العقد بواسطة النظام</Text>
              </Timeline.Item>
              <Timeline.Item bullet={<Info size={16} />} title={<Text fw={900} size="sm">تفعيل العقد</Text>}>
                <Text size="xs" c="dimmed" fw={700}>{new Date(contract.start_date).toLocaleDateString('ar-SA')}</Text>
                <Text size="xs" mt={4}>بداية سريان الفترة التعاقدية</Text>
              </Timeline.Item>
            </Timeline>
          </Paper>

          <Paper radius="32px" withBorder p="xl" className="border-emerald-100 bg-emerald-950 text-white shadow-xl">
            <h3 className="font-black mb-6">إجراءات سريعة</h3>
            <Stack gap="sm">
              <Button fullWidth variant="white" color="emerald" radius="xl" className="font-black">تجديد العقد</Button>
              <Button fullWidth variant="outline" color="emerald.4" radius="xl" className="font-black">تعديل الملحقات</Button>
              <Divider my="sm" color="white/10" />
              <Button fullWidth variant="subtle" color="rose.2" radius="xl" className="font-black">إبلاغ عن مخالفة</Button>
            </Stack>
          </Paper>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal opened={paymentModalOpened} onClose={closePaymentModal} title={<Text fw={900}>تسجيل عملية سداد</Text>} centered radius="32px" padding="xl">
        <form onSubmit={paymentForm.onSubmit((values) => registerPayment.mutate(values))}>
          <Stack gap="md">
            <NumberInput label="المبلغ المراد سداده" required {...paymentForm.getInputProps('amount')} />
            <Select 
              label="طريقة السداد" 
              data={[
                { value: 'bank_transfer', label: 'تحويل بنكي' },
                { value: 'cash', label: 'نقدي' },
                { value: 'mada', label: 'مدى / بطاقة ائتمانية' }
              ]} 
              {...paymentForm.getInputProps('payment_method')}
            />
            <TextInput label="رقم المرجع / العملية" placeholder="رقم التحويل أو الوصل" {...paymentForm.getInputProps('transaction_ref')} />
            <Button type="submit" fullWidth radius="xl" size="lg" color="emerald" loading={registerPayment.isPending} className="font-black mt-4">تأكيد السداد</Button>
          </Stack>
        </form>
      </Modal>
    </main>
  );
}

function PartyCard({ role, party, icon: Icon, color }: any) {
  return (
    <Paper radius="24px" withBorder p="lg" className={`border-${color}-50 bg-${color}-50/5`}>
      <div className="flex items-center gap-4 mb-4">
        <ThemeIcon variant="light" color={color} size="lg" radius="md"><Icon size={20} /></ThemeIcon>
        <div>
          <Text size="xs" fw={900} c={`${color}.6`} className="uppercase tracking-widest">{role}</Text>
          <Text fw={900} size="lg" className="text-emerald-950">{party?.full_name}</Text>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold"><Text c="dimmed">رقم الهوية:</Text><Text>{party?.national_id}</Text></div>
        <div className="flex justify-between text-xs font-bold"><Text c="dimmed">الجوال:</Text><Text dir="ltr">{party?.mobile}</Text></div>
      </div>
    </Paper>
  );
}

function getStatusLabel(status: string) {
  const labels: any = { active: 'نشط', draft: 'مسودة', expired: 'منتهي', cancelled: 'ملغى' };
  return labels[status] || status;
}

function getFrequencyLabel(freq: string) {
  const labels: any = { monthly: 'شهري', quarterly: 'ربع سنوي', 'semi-annual': 'نصف سنوي', annual: 'سنوي' };
  return labels[freq] || freq;
}

function getServiceLabel(type: string) {
  const labels: any = { electricity: 'الكهرباء', water: 'المياه', gas: 'الغاز', internet: 'الإنترنت' };
  return labels[type] || type;
}
