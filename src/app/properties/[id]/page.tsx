"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  ArrowRight, 
  Building2, 
  MapPin, 
  Home, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  LayoutGrid,
  ChevronLeft,
  ArrowUpRight,
  FileText,
  User,
  Ruler,
  Navigation,
  ExternalLink,
  ShieldCheck as ShieldIcon,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Group, Stack, Text, Progress, Tabs, Paper, SimpleGrid, ThemeIcon, Button, Modal, TextInput, Select, NumberInput, ActionIcon, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("units");
  
  // Modals state
  const [docModalOpened, { open: openDocModal, close: closeDocModal }] = useDisclosure(false);
  const [ownerModalOpened, { open: openOwnerModal, close: closeOwnerModal }] = useDisclosure(false);
  const [proxyModalOpened, { open: openProxyModal, close: closeProxyModal }] = useDisclosure(false);
  const [brokerageModalOpened, { open: openBrokerageModal, close: closeBrokerageModal }] = useDisclosure(false);

  // Document Form
  const docForm = useForm({
    initialValues: {
      document_type: "electronic_deed",
      document_number: "",
      issue_date: "",
      issuer_name: "",
      status: "active",
      notes: "",
    },
    validate: {
      document_number: (value) => (value.length > 0 ? null : "رقم الصك مطلوب"),
      issuer_name: (value) => (value.length > 0 ? null : "جهة الإصدار مطلوبة"),
    },
  });

  // Owner Form
  const ownerForm = useForm({
    initialValues: {
      owner_type: "individual",
      name: "",
      national_id_or_cr: "",
      mobile: "",
      email: "",
      ownership_ratio: 100,
    },
    validate: {
      name: (value) => (value.length > 0 ? null : "اسم المالك مطلوب"),
      ownership_ratio: (value) => (value > 0 && value <= 100 ? null : "النسبة يجب أن تكون بين 1 و 100"),
    },
  });

  // Proxy Form
  const proxyForm = useForm({
    initialValues: {
      proxy_holder_name: "",
      proxy_holder_id: "",
      proxy_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    },
    validate: {
      proxy_holder_name: (value) => (value.length > 0 ? null : "اسم الوكيل مطلوب"),
      proxy_number: (value) => (value.length > 0 ? null : "رقم الوكالة مطلوب"),
    },
  });

  // Brokerage Form
  const brokerageForm = useForm({
    initialValues: {
      agreement_number: "",
      start_date: "",
      end_date: "",
      status: "draft",
    },
    validate: {
      agreement_number: (value) => (value.length > 0 ? null : "رقم الاتفاقية مطلوب"),
    },
  });

  // Fetch Property Details with ownership docs and owners
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          offices(name, id),
          property_ownership_documents (
            *,
            property_owners (*),
            ownership_proxy_documents (*)
          )
        `)
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch Brokerage Agreements for this office/property
  const { data: brokerageAgreements, isLoading: brokerageLoading } = useQuery({
    queryKey: ["brokerage-agreements", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brokerage_agreements")
        .select("*")
        .eq("office_id", (property as any).office_id); // Assuming agreements are linked via office

      if (error) throw error;
      return data;
    },
    enabled: !!property,
  });

  // Mutations
  const addDocMutation = useMutation({
    mutationFn: async (values: typeof docForm.values) => {
      const { error } = await supabase
        .from("property_ownership_documents")
        .insert([{ ...values, property_id: propertyId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة صك الملكية بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      closeDocModal();
      docForm.reset();
    },
  });

  const addOwnerMutation = useMutation({
    mutationFn: async (values: typeof ownerForm.values) => {
      // For simplicity, we add the owner to the first document found
      const docId = property?.property_ownership_documents?.[0]?.id;
      if (!docId) throw new Error("يجب إضافة صك ملكية أولاً");

      const { error } = await supabase
        .from("property_owners")
        .insert([{ ...values, ownership_document_id: docId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة المالك بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      closeOwnerModal();
      ownerForm.reset();
    },
    onError: (err: any) => {
      notifications.show({ title: "خطأ", message: err.message, color: "red" });
    }
  });

  const addProxyMutation = useMutation({
    mutationFn: async (values: typeof proxyForm.values) => {
      const docId = property?.property_ownership_documents?.[0]?.id;
      if (!docId) throw new Error("يجب إضافة صك ملكية أولاً");

      const { error } = await supabase
        .from("ownership_proxy_documents")
        .insert([{ ...values, ownership_document_id: docId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة الوكالة بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      closeProxyModal();
      proxyForm.reset();
    },
    onError: (err: any) => {
      notifications.show({ title: "خطأ", message: err.message, color: "red" });
    }
  });

  const addBrokerageMutation = useMutation({
    mutationFn: async (values: typeof brokerageForm.values) => {
      const { error } = await supabase
        .from("brokerage_agreements")
        .insert([{ ...values, office_id: (property as any).office_id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      notifications.show({ title: "تمت الإضافة", message: "تم إضافة اتفاقية الوساطة بنجاح", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["brokerage-agreements", propertyId] });
      closeBrokerageModal();
      brokerageForm.reset();
    },
    onError: (err: any) => {
      notifications.show({ title: "خطأ", message: err.message, color: "red" });
    }
  });

  // Fetch Units for this property
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["units", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const filteredUnits = units?.filter(u => 
    u.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.unit_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (propertyLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="space-y-8" dir="rtl">
      {/* Page Header / Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 text-white shadow-xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"></div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/properties"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="filled" color="emerald.4" size="sm" radius="xl">تفاصيل العقار</Badge>
                <span className={`inline-flex rounded-full px-3 py-0.5 text-[10px] font-black tracking-tight ${getStatusStyles(property?.status)}`}>
                  {getStatusLabel(property?.status)}
                </span>
              </div>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">{property?.name}</h1>
              <div className="mt-2 flex items-center gap-1.5 text-emerald-50/80 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                <span>{property?.city}، {property?.district}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20">
              <Edit className="h-5 w-5" />
              تعديل العقار
            </button>
            <div className="flex gap-2">
              <Link 
                href={`/properties/${propertyId}/units/new`}
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
              >
                <Plus className="h-5 w-5" />
                إضافة وحدة
              </Link>
              <Link 
                href={`/properties/${propertyId}/units/bulk`}
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-emerald-700 shadow-lg transition hover:scale-105 active:scale-95"
              >
                <LayoutGrid className="h-5 w-5" />
                إضافة ذكية (بالجملة)
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Property Info Sidebar */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-6 py-5">
              <h2 className="text-lg font-black text-emerald-950">المعلومات الفنية</h2>
            </div>
            <div className="p-6 space-y-5">
              <InfoRow label="نوع العقار" value={property?.property_type === 'residential' ? 'سكني' : 'تجاري'} />
              <InfoRow label="كود العقار" value={property?.property_code} />
              <InfoRow label="المكتب التابع" value={(property as any).offices?.name || "مكتب رئيسي"} />
              <InfoRow label="حالة الربط (إيجار)" value={
                <Badge variant="dot" color={property?.ejar_property_id ? 'emerald' : 'gray'}>
                  {property?.ejar_property_id ? 'متصل' : 'غير متصل'}
                </Badge>
              } />
              <div className="pt-2 border-t border-emerald-50">
                <p className="text-[10px] font-black text-emerald-800/30 uppercase tracking-widest mb-2">وصف العقار</p>
                <p className="text-sm font-bold text-emerald-900/70 leading-relaxed">
                  {property?.description || 'لا يوجد وصف إضافي مسجل لهذا العقار.'}
                </p>
              </div>
            </div>
          </section>

          {/* Units Summary KPI */}
          <section className="rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 to-teal-800 p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black">إحصائيات الوحدات</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="إجمالي الوحدات" value={units?.length || 0} />
              <StatCard label="وحدات متاحة" value={units?.filter(u => u.status === 'available').length || 0} />
              <StatCard label="وحدات مؤجرة" value={units?.filter(u => u.status === 'occupied').length || 0} />
              <StatCard label="تحت الصيانة" value={units?.filter(u => u.status === 'maintenance').length || 0} />
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="uppercase tracking-widest opacity-60">نسبة الإشغال الحالية</span>
                <span>{units?.length ? Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) : 0}%</span>
              </div>
              <Progress 
                value={units?.length ? (units.filter(u => u.status === 'occupied').length / units.length) * 100 : 0} 
                color="emerald.3" 
                size="sm" 
                radius="xl" 
                className="bg-white/10"
              />
            </div>
          </section>
        </div>

        {/* Units Management Section */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onChange={setActiveTab} color="emerald" radius="xl">
            <Tabs.List className="border-b-0 gap-2 mb-8 bg-emerald-50/50 p-2 rounded-[24px]">
              <Tabs.Tab 
                value="units" 
                leftSection={<Home size={16} />}
                className={`rounded-2xl font-black px-8 py-3 transition-all ${activeTab === 'units' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                الوحدات العقارية
              </Tabs.Tab>
              <Tabs.Tab 
                value="documents" 
                leftSection={<FileText size={16} />}
                className={`rounded-2xl font-black px-8 py-3 transition-all ${activeTab === 'documents' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                صكوك الملكية
              </Tabs.Tab>
              <Tabs.Tab 
                value="owners" 
                leftSection={<User size={16} />}
                className={`rounded-2xl font-black px-8 py-3 transition-all ${activeTab === 'owners' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                الملاك والشركاء
              </Tabs.Tab>
              <Tabs.Tab 
                value="proxies" 
                leftSection={<Briefcase size={16} />}
                className={`rounded-2xl font-black px-8 py-3 transition-all ${activeTab === 'proxies' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                الوكالات
              </Tabs.Tab>
              <Tabs.Tab 
                value="brokerage" 
                leftSection={<ShieldIcon size={16} />}
                className={`rounded-2xl font-black px-8 py-3 transition-all ${activeTab === 'brokerage' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                اتفاقيات الوساطة
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="units">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      placeholder="ابحث برقم الوحدة، النوع..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-2xl border border-emerald-100 bg-white py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 placeholder:text-emerald-200"
                    />
                  </div>
                </div>

                {unitsLoading ? (
                  <div className="flex h-64 items-center justify-center bg-white rounded-[32px] border border-emerald-50 shadow-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                  </div>
                ) : filteredUnits && filteredUnits.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {filteredUnits.map((unit) => (
                      <div key={unit.id} className="group relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200">
                        <div className="rounded-[30px] p-6">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${getUnitStatusBg(unit.status)} ${getUnitStatusBorder(unit.status)}`}>
                                <Home className={`h-6 w-6 ${getUnitStatusColor(unit.status)}`} />
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-emerald-950">وحدة {unit.unit_number}</h3>
                                <p className="text-xs font-bold text-emerald-600/50 uppercase">{unit.unit_type} • الدور {unit.floor_number || 'الأرضي'}</p>
                              </div>
                            </div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black tracking-tight ${getUnitStatusBg(unit.status)} ${getUnitStatusColor(unit.status)} border ${getUnitStatusBorder(unit.status)}`}>
                              {getUnitStatusLabel(unit.status)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800/60">
                               <Ruler size={14} className="text-emerald-400" />
                               <span>{unit.area || 0} م²</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800/60">
                               <LayoutGrid size={14} className="text-emerald-400" />
                               <span>{unit.bedrooms || 0} غرف</span>
                            </div>
                            {unit.ejar_unit_id && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                <CheckCircle2 size={12} />
                                <span>موثق</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-emerald-50 pt-5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-emerald-800/30 uppercase tracking-tighter leading-none">الإيجار السنوي</span>
                              <span className="text-sm font-black text-emerald-900 mt-1">{unit.rent_expected?.toLocaleString()} <span className="text-[10px] text-emerald-500">ريال</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-80 flex-col items-center justify-center gap-6 text-emerald-300 bg-white rounded-[40px] border border-dashed border-emerald-200">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Home className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-emerald-950">لا توجد وحدات مسجلة</p>
                      <p className="mt-1 text-sm font-medium text-emerald-600/50">ابدأ بإضافة الوحدات التابعة لهذا العقار لإدارتها</p>
                    </div>
                    <Link
                      href={`/properties/${propertyId}/units/new`}
                      className="rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      إضافة أول وحدة
                    </Link>
                  </div>
                )}
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="documents">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(property as any)?.property_ownership_documents?.map((doc: any) => (
                  <div key={doc.id} className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <FileText size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-emerald-950">صك ملكية</h4>
                          <Tooltip label="معاينة الصك">
                            <ActionIcon variant="light" color="emerald" radius="md">
                              <ExternalLink size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </div>
                        <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest">{doc.document_type === 'electronic_deed' ? 'إلكتروني' : 'يدوي'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <InfoRow label="رقم الصك" value={doc.document_number} />
                      <InfoRow label="تاريخ الإصدار" value={doc.issue_date || 'غير محدد'} />
                      <InfoRow label="جهة الإصدار" value={doc.issuer_name || 'غير محدد'} />
                      <InfoRow label="الحالة" value={
                        <Badge variant="light" color={doc.status === 'active' ? 'emerald' : 'rose'}>
                          {doc.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      } />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={openDocModal}
                  className="flex flex-col items-center justify-center gap-4 h-full min-h-[250px] rounded-[32px] border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus size={24} />
                  </div>
                  <span className="font-black text-sm">إضافة صك ملكية جديد</span>
                </button>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="owners">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(property as any)?.property_ownership_documents?.[0]?.property_owners?.map((owner: any) => (
                  <div key={owner.id} className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <User size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-emerald-950">{owner.name}</h4>
                          <ActionIcon variant="subtle" color="blue" radius="md">
                            <Edit size={18} />
                          </ActionIcon>
                        </div>
                        <p className="text-xs font-bold text-blue-600/50 uppercase tracking-widest">{owner.owner_type === 'individual' ? 'فرد' : 'مؤسسة'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <InfoRow label="رقم الهوية/السجل" value={owner.national_id_or_cr} />
                      <InfoRow label="نسبة التملك" value={<span className="font-black text-emerald-700">{owner.ownership_ratio}%</span>} />
                      <InfoRow label="الجوال" value={owner.mobile} />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={openOwnerModal}
                  className="flex flex-col items-center justify-center gap-4 h-full min-h-[250px] rounded-[32px] border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus size={24} />
                  </div>
                  <span className="font-black text-sm">إضافة شريك/مالك جديد</span>
                </button>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="proxies">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(property as any)?.property_ownership_documents?.[0]?.ownership_proxy_documents?.map((proxy: any) => (
                  <div key={proxy.id} className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Briefcase size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-emerald-950">{proxy.proxy_holder_name}</h4>
                          <ActionIcon variant="subtle" color="amber" radius="md">
                            <Edit size={18} />
                          </ActionIcon>
                        </div>
                        <p className="text-xs font-bold text-amber-600/50 uppercase tracking-widest">وكيل شرعي</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <InfoRow label="رقم الوكالة" value={proxy.proxy_number} />
                      <InfoRow label="رقم هوية الوكيل" value={proxy.proxy_holder_id || 'غير مسجل'} />
                      <InfoRow label="تاريخ الانتهاء" value={proxy.expiry_date || 'غير محدد'} />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={openProxyModal}
                  className="flex flex-col items-center justify-center gap-4 h-full min-h-[250px] rounded-[32px] border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus size={24} />
                  </div>
                  <span className="font-black text-sm">إضافة وكالة جديدة</span>
                </button>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="brokerage">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {brokerageAgreements?.map((agreement: any) => (
                  <div key={agreement.id} className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <ShieldIcon size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-emerald-950">اتفاقية وساطة</h4>
                          <Badge color={agreement.status === 'active' ? 'emerald' : 'gray'}>
                            {agreement.status === 'active' ? 'نشطة' : 'مسودة'}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest">رقم: {agreement.agreement_number}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <InfoRow label="تاريخ البداية" value={agreement.start_date || '—'} />
                      <InfoRow label="تاريخ النهاية" value={agreement.end_date || '—'} />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={openBrokerageModal}
                  className="flex flex-col items-center justify-center gap-4 h-full min-h-[250px] rounded-[32px] border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus size={24} />
                  </div>
                  <span className="font-black text-sm">إضافة اتفاقية وساطة</span>
                </button>
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>

      {/* Add Document Modal */}
      <Modal
        opened={docModalOpened}
        onClose={closeDocModal}
        title={<Text fw={900}>إضافة صك ملكية جديد</Text>}
        centered
        radius="32px"
        padding="xl"
      >
        <form onSubmit={docForm.onSubmit((values) => addDocMutation.mutate(values))}>
          <Stack gap="md">
            <Select
              label="نوع الصك"
              data={[
                { value: 'electronic_deed', label: 'صك إلكتروني' },
                { value: 'paper_deed', label: 'صك ورقي' },
                { value: 'other', label: 'أخرى' },
              ]}
              {...docForm.getInputProps('document_type')}
            />
            <TextInput
              label="رقم الصك"
              placeholder="مثلاً: 1234567890"
              required
              {...docForm.getInputProps('document_number')}
            />
            <TextInput
              label="تاريخ الإصدار"
              type="date"
              {...docForm.getInputProps('issue_date')}
            />
            <TextInput
              label="جهة الإصدار"
              placeholder="وزارة العدل"
              required
              {...docForm.getInputProps('issuer_name')}
            />
            <Button 
              type="submit" 
              fullWidth 
              radius="xl" 
              color="emerald"
              loading={addDocMutation.isPending}
              className="font-black mt-4"
            >
              حفظ الصك
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Add Owner Modal */}
      <Modal
        opened={ownerModalOpened}
        onClose={closeOwnerModal}
        title={<Text fw={900}>إضافة مالك/شريك جديد</Text>}
        centered
        radius="32px"
        padding="xl"
      >
        <form onSubmit={ownerForm.onSubmit((values) => addOwnerMutation.mutate(values))}>
          <Stack gap="md">
            <Select
              label="نوع المالك"
              data={[
                { value: 'individual', label: 'فرد' },
                { value: 'organization', label: 'منشأة' },
              ]}
              {...ownerForm.getInputProps('owner_type')}
            />
            <TextInput
              label="الاسم الكامل"
              required
              {...ownerForm.getInputProps('name')}
            />
            <TextInput
              label="رقم الهوية / السجل التجاري"
              {...ownerForm.getInputProps('national_id_or_cr')}
            />
            <NumberInput
              label="نسبة التملك (%)"
              min={1}
              max={100}
              required
              {...ownerForm.getInputProps('ownership_ratio')}
            />
            <TextInput
              label="رقم الجوال"
              {...ownerForm.getInputProps('mobile')}
            />
            <Button 
               type="submit" 
               fullWidth 
               radius="xl" 
               color="emerald"
               loading={addOwnerMutation.isPending}
               className="font-black mt-4"
             >
               حفظ المالك
             </Button>
           </Stack>
         </form>
       </Modal>

       {/* Add Proxy Modal */}
       <Modal
         opened={proxyModalOpened}
         onClose={closeProxyModal}
         title={<Text fw={900}>إضافة وكالة جديدة</Text>}
         centered
         radius="32px"
         padding="xl"
       >
         <form onSubmit={proxyForm.onSubmit((values) => addProxyMutation.mutate(values))}>
           <Stack gap="md">
             <TextInput
               label="اسم الوكيل (حامل الوكالة)"
               required
               {...proxyForm.getInputProps('proxy_holder_name')}
             />
             <TextInput
               label="رقم هوية الوكيل"
               {...proxyForm.getInputProps('proxy_holder_id')}
             />
             <TextInput
               label="رقم الوكالة"
               required
               {...proxyForm.getInputProps('proxy_number')}
             />
             <SimpleGrid cols={2}>
               <TextInput
                 label="تاريخ الإصدار"
                 type="date"
                 {...proxyForm.getInputProps('issue_date')}
               />
               <TextInput
                 label="تاريخ الانتهاء"
                 type="date"
                 {...proxyForm.getInputProps('expiry_date')}
               />
             </SimpleGrid>
             <TextInput
               label="ملاحظات"
               {...proxyForm.getInputProps('notes')}
             />
             <Button 
               type="submit" 
               fullWidth 
               radius="xl" 
               color="emerald"
               loading={addProxyMutation.isPending}
               className="font-black mt-4"
             >
               حفظ الوكالة
             </Button>
           </Stack>
         </form>
       </Modal>

       {/* Add Brokerage Modal */}
       <Modal
         opened={brokerageModalOpened}
         onClose={closeBrokerageModal}
         title={<Text fw={900}>إضافة اتفاقية وساطة</Text>}
         centered
         radius="32px"
         padding="xl"
       >
         <form onSubmit={brokerageForm.onSubmit((values) => addBrokerageMutation.mutate(values))}>
           <Stack gap="md">
             <TextInput
               label="رقم الاتفاقية"
               placeholder="مثلاً: BR-2024-001"
               required
               {...brokerageForm.getInputProps('agreement_number')}
             />
             <SimpleGrid cols={2}>
               <TextInput
                 label="تاريخ البداية"
                 type="date"
                 {...brokerageForm.getInputProps('start_date')}
               />
               <TextInput
                 label="تاريخ النهاية"
                 type="date"
                 {...brokerageForm.getInputProps('end_date')}
               />
             </SimpleGrid>
             <Select
               label="الحالة"
               data={[
                 { value: 'draft', label: 'مسودة' },
                 { value: 'active', label: 'نشطة' },
               ]}
               {...brokerageForm.getInputProps('status')}
             />
             <Button 
               type="submit" 
               fullWidth 
               radius="xl" 
               color="emerald"
               loading={addBrokerageMutation.isPending}
               className="font-black mt-4"
             >
               حفظ الاتفاقية
             </Button>
           </Stack>
         </form>
       </Modal>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-black text-emerald-800/40 uppercase tracking-widest text-[10px]">{label}</span>
      <span className="font-bold text-emerald-900">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 border border-white/5 backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30';
    case 'draft': return 'bg-orange-400/20 text-orange-100 border border-orange-400/30';
    case 'inactive': return 'bg-rose-400/20 text-rose-100 border border-rose-400/30';
    default: return 'bg-white/10 text-white border border-white/20';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'active': return 'نشط';
    case 'draft': return 'مسودة';
    case 'inactive': return 'غير نشط';
    default: return status;
  }
}

function getUnitStatusBg(status: string) {
  switch (status) {
    case 'available': return 'bg-emerald-50';
    case 'occupied': return 'bg-blue-50';
    case 'maintenance': return 'bg-orange-50';
    default: return 'bg-slate-50';
  }
}

function getUnitStatusBorder(status: string) {
  switch (status) {
    case 'available': return 'border-emerald-100';
    case 'occupied': return 'border-blue-100';
    case 'maintenance': return 'border-orange-100';
    default: return 'border-slate-100';
  }
}

function getUnitStatusColor(status: string) {
  switch (status) {
    case 'available': return 'text-emerald-600';
    case 'occupied': return 'text-blue-600';
    case 'maintenance': return 'text-orange-600';
    default: return 'text-slate-600';
  }
}

function getUnitStatusLabel(status: string) {
  switch (status) {
    case 'available': return 'متاحة';
    case 'occupied': return 'مؤجرة';
    case 'maintenance': return 'صيانة';
    default: return status;
  }
}
