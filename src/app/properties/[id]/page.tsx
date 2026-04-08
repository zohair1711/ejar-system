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
  Ruler
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Group, Stack, Text, Progress, Tabs, Paper, SimpleGrid, ThemeIcon } from "@mantine/core";

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("units");

  // Fetch Property Details with ownership docs and owners
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          offices(name),
          property_ownership_documents (
            *,
            property_owners (*)
          )
        `)
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
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
                      <div>
                        <h4 className="text-lg font-black text-emerald-950">صك ملكية</h4>
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
                <button className="flex flex-col items-center justify-center gap-4 h-full min-h-[250px] rounded-[32px] border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:bg-emerald-50 transition-all">
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
                      <div>
                        <h4 className="text-lg font-black text-emerald-950">{owner.name}</h4>
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
                <button className="flex flex-col items-center justify-center gap-4 h-full min-h-[250px] rounded-[32px] border-2 border-dashed border-emerald-100 bg-emerald-50/20 text-emerald-600 hover:bg-emerald-50 transition-all">
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Plus size={24} />
                  </div>
                  <span className="font-black text-sm">إضافة شريك/مالك جديد</span>
                </button>
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
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
