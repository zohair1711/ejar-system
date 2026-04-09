"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Download,
  MoreVertical,
  ChevronLeft,
  Calendar,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { 
  Badge, 
  Group, 
  Stack, 
  Text, 
  ActionIcon, 
  Menu, 
  RingProgress, 
  Progress,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Button
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

export default function FinancePage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const paymentForm = useForm({
    initialValues: {
      amount: 0,
      payment_method: "bank_transfer",
      transaction_ref: "",
    },
  });

  const registerPayment = useMutation({
    mutationFn: async (values: { amount: number; payment_method: string; transaction_ref: string }) => {
      const { error } = await supabase
        .from("payments")
        .insert([{
          invoice_id: selectedInvoice.id,
          amount: values.amount,
          payment_method: values.payment_method,
          reference_number: values.transaction_ref, // In the schema, it's reference_number
          status: 'paid'
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تم السداد", message: "تم تسجيل العملية بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      closePaymentModal();
    }
  });

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("contract_invoices")
        .select(`
          *,
          contracts (
            contract_number_internal,
            tenant_party_id,
            parties!tenant_party_id (full_name)
          )
        `)
        .order("due_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredInvoices = invoices?.filter(inv => {
    const tenantName = (inv.contracts as any)?.parties?.full_name || "";
    const invNumber = inv.invoice_number || `INV-${inv.id.slice(0, 8)}`;
    return tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           invNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const paidAmount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const pendingAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const overdueAmount = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  const collectionRate = totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="md">
              الإدارة المالية والتحصيل
            </Badge>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              مركز الرقابة المالية
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-50/80 md:text-base font-medium">
              تتبع التدفقات النقدية، الفواتير المستحقة، وحالة التحصيل المالي لجميع العقود من واجهة واحدة متكاملة.
            </p>
          </div>

          <div className="flex flex-row gap-2 sm:gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 sm:px-6 text-xs sm:text-sm font-black text-emerald-700 shadow-lg transition hover:scale-105 active:scale-95 whitespace-nowrap">
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              تصدير كشف حساب
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 sm:px-6 text-xs sm:text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20 whitespace-nowrap">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              تقارير التحصيل
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Collection Performance */}
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200">
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="xs" fw={900} c="dimmed" tt="uppercase" className="tracking-wider">كفاءة التحصيل</Text>
              <Text size="xl" fw={900} className="text-emerald-950 mt-1">{collectionRate}%</Text>
              <Text size="xs" mt={4} c="dimmed" fw={500}>
                {formatCurrency(paidAmount)} من {formatCurrency(totalAmount)}
              </Text>
            </Stack>
            <RingProgress
              size={80}
              thickness={8}
              roundCaps
              sections={[{ value: collectionRate, color: 'emerald' }]}
              label={
                <center>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </center>
              }
            />
          </Group>
          <Progress value={collectionRate} color="emerald" size="sm" radius="xl" mt="xl" className="bg-emerald-50" />
        </div>

        <KPI 
          title="إجمالي الفواتير" 
          value={formatCurrency(totalAmount)} 
          icon={FileText} 
          color="emerald" 
          hint="قيمة كافة المطالبات المالية" 
        />
        <KPI 
          title="المبالغ المحصلة" 
          value={formatCurrency(paidAmount)} 
          icon={CheckCircle2} 
          color="teal" 
          hint="إجمالي الإيرادات الفعلية" 
        />
        <KPI 
          title="المتأخرات" 
          value={formatCurrency(overdueAmount)} 
          icon={AlertCircle} 
          color="red" 
          hint="فواتير تجاوزت تاريخ الاستحقاق" 
        />
      </div>

      {/* Main Content Area */}
      <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
        {/* Filters & Search Bar */}
        <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث برقم الفاتورة، اسم المستأجر، أو رقم العقد..."
                className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-2 shadow-xs">
                <Filter className="h-4 w-4 text-emerald-500" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-black text-emerald-900 outline-none"
                >
                  <option value="all">جميع الفواتير</option>
                  <option value="paid">المدفوعة</option>
                  <option value="pending">المعلقة</option>
                  <option value="overdue">المتأخرة</option>
                  <option value="cancelled">الملغاة</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-rose-500">
              <AlertCircle className="h-12 w-12" />
              <p className="font-black text-lg">حدث خطأ أثناء تحميل السجلات المالية</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-rose-50 px-6 py-2 text-sm font-bold transition hover:bg-rose-100"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredInvoices && filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-emerald-50/30 text-emerald-800/50">
                  <tr>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">رقم الفاتورة</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">المستأجر</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">تاريخ الاستحقاق</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">المبلغ</th>
                    <th className="px-8 py-5 font-black uppercase tracking-wider">الحالة</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="font-black text-emerald-950 text-base">
                          {invoice.invoice_number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                          عقد: {(invoice.contracts as any)?.contract_number_internal}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 border border-emerald-200">
                            {(invoice.contracts as any)?.parties?.full_name?.slice(0, 2) || "؟"}
                          </div>
                          <span className="font-bold text-emerald-900">
                            {(invoice.contracts as any)?.parties?.full_name || 'غير متوفر'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-emerald-700/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(invoice.due_date).toLocaleDateString('ar-SA')}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-black text-emerald-950 text-lg">
                          {invoice.total_amount?.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500 mr-1">ر.س</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black tracking-tight ${getStatusStyles(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-left">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {invoice.status !== 'paid' && (
                            <button 
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                paymentForm.setFieldValue('amount', invoice.total_amount);
                                openPaymentModal();
                              }}
                              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 transition-all"
                            >
                              سداد
                              <Wallet className="h-3 w-3" />
                            </button>
                          )}
                          
                          <Menu shadow="md" width={180} position="bottom-end" radius="lg">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="emerald" radius="md" size="lg">
                                <MoreVertical className="h-5 w-5" />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item leftSection={<Download className="h-4 w-4" />}>تحميل الفاتورة</Menu.Item>
                              <Menu.Item component={Link} href={`/contracts/${invoice.contract_id}`} leftSection={<FileText className="h-4 w-4" />}>تفاصيل العقد</Menu.Item>
                              <Menu.Divider />
                              <Menu.Item color="red" leftSection={<AlertCircle className="h-4 w-4" />}>إلغاء الفاتورة</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-6 text-emerald-300 bg-white rounded-[40px] border border-dashed border-emerald-200">
              <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center">
                <FileText className="h-12 w-12" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-950">لا توجد سجلات مالية</p>
                <p className="mt-1 text-sm font-medium text-emerald-600/50">سيتم إنشاء الفواتير تلقائياً عند تفعيل العقود في النظام</p>
              </div>
              <button 
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                className="text-sm font-black text-emerald-600 hover:underline"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>
      </section>

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

function KPI({
  title,
  value,
  icon: Icon,
  color,
  hint,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  hint?: string;
}) {
  const styles: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-100 border-emerald-200/60 text-emerald-700",
    teal: "from-teal-500/10 to-teal-100 border-teal-200/60 text-teal-700",
    green: "from-green-500/10 to-green-100 border-green-200/60 text-green-700",
    red: "from-rose-500/10 to-rose-100 border-rose-200/60 text-rose-700",
  };

  return (
    <div className="group rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">{title}</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-emerald-950">{value}</h3>
          {hint ? <p className="mt-2 text-[10px] font-bold text-emerald-500/50 tracking-tight">{hint}</p> : null}
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${styles[color] ?? styles.emerald}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'paid': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'pending': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'overdue': return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'cancelled': return 'bg-slate-50 text-slate-700 border border-slate-200';
    default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'paid': return 'مدفوعة';
    case 'pending': return 'معلقة';
    case 'overdue': return 'متأخرة';
    case 'cancelled': return 'ملغاة';
    default: return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid': return <CheckCircle2 className="h-3 w-3" />;
    case 'pending': return <Clock className="h-3 w-3" />;
    case 'overdue': return <AlertCircle className="h-3 w-3" />;
    default: return null;
  }
}

function formatCurrency(n?: number | null) {
  const x = Number(n || 0);
  return `${x.toLocaleString()} ر.س`;
}
