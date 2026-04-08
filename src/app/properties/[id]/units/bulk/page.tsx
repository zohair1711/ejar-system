"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Save, Loader2, LayoutGrid, Info, Plus, Trash2, Home, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge, Table, Checkbox, Group, Text, ActionIcon } from "@mantine/core";
import { useState, useEffect } from "react";

const bulkSchema = z.object({
  total_floors: z.coerce.number().min(1, "يرجى إدخال عدد الأدوار"),
  units_per_floor: z.coerce.number().min(1, "يرجى إدخال عدد الوحدات في كل دور"),
  starting_floor: z.coerce.number().default(0),
  numbering_pattern: z.enum(["floor_unit", "sequential"]).default("floor_unit"),
  default_unit_type: z.string().default("apartment"),
  default_usage_type: z.string().default("residential"),
  default_rent: z.coerce.number().min(0).default(0),
});

type BulkFormValues = z.infer<typeof bulkSchema>;

interface UnitPreview {
  unit_number: string;
  floor_number: string;
  unit_type: string;
  usage_type: string;
  rent_expected: number;
}

export default function BulkUnitsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [previews, setPreviews] = useState<UnitPreview[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BulkFormValues>({
    resolver: zodResolver(bulkSchema) as any,
    defaultValues: {
      total_floors: 1,
      units_per_floor: 1,
      starting_floor: 0,
      numbering_pattern: "floor_unit",
      default_unit_type: "apartment",
      default_usage_type: "residential",
      default_rent: 0,
    },
  });

  const formValues = watch();

  // Generate Previews
  useEffect(() => {
    const newPreviews: UnitPreview[] = [];
    let unitCounter = 1;

    for (let f = 0; f < formValues.total_floors; f++) {
      const currentFloor = formValues.starting_floor + f;
      const floorLabel = currentFloor === 0 ? "الأرضي" : currentFloor.toString();

      for (let u = 1; u <= formValues.units_per_floor; u++) {
        let unitNum = "";
        if (formValues.numbering_pattern === "floor_unit") {
          // e.g. Floor 1, Unit 1 -> 101
          unitNum = `${currentFloor}${u.toString().padStart(2, "0")}`;
        } else {
          unitNum = unitCounter.toString();
        }

        newPreviews.push({
          unit_number: unitNum,
          floor_number: floorLabel,
          unit_type: formValues.default_unit_type,
          usage_type: formValues.default_usage_type,
          rent_expected: formValues.default_rent,
        });
        unitCounter++;
      }
    }
    setPreviews(newPreviews);
  }, [formValues]);

  // Fetch Property Name
  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("name").eq("id", propertyId).single();
      if (error) throw error;
      return data;
    },
  });

  const createUnits = useMutation({
    mutationFn: async (units: UnitPreview[]) => {
      const payload = units.map(u => ({
        ...u,
        property_id: propertyId,
        status: "available",
      }));

      const { data, error } = await supabase.from("units").insert(payload).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      router.push(`/properties/${propertyId}`);
      router.refresh();
    },
  });

  const onSubmit = () => {
    if (previews.length === 0) return;
    createUnits.mutate(previews);
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
              href={`/properties/${propertyId}`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20"
            >
              <ArrowRight className="h-6 w-6" />
            </Link>
            <div>
              <Badge variant="filled" color="emerald.4" size="sm" radius="xl" mb="xs">
                الإضافة الذكية
              </Badge>
              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                إضافة وحدات بالجملة
              </h1>
              <p className="mt-1 text-sm font-medium text-emerald-50/80">للعقار: <span className="font-black text-white">{property?.name}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Configuration Form */}
        <div className="lg:col-span-1 space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-emerald-950">إعدادات التوليد</h2>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">عدد الأدوار</label>
                  <input
                    type="number"
                    {...register("total_floors")}
                    className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">وحدات كل دور</label>
                  <input
                    type="number"
                    {...register("units_per_floor")}
                    className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">نمط الترقيم</label>
                <select
                  {...register("numbering_pattern")}
                  className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-sm font-bold outline-none focus:border-emerald-500"
                >
                  <option value="floor_unit">رقم الدور + رقم الوحدة (مثال: 101، 102)</option>
                  <option value="sequential">تسلسلي بسيط (مثال: 1، 2، 3...)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">نوع الوحدة الافتراضي</label>
                <select
                  {...register("default_unit_type")}
                  className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-sm font-bold outline-none focus:border-emerald-500"
                >
                  <option value="apartment">شقة</option>
                  <option value="shop">محل</option>
                  <option value="office">مكتب</option>
                  <option value="villa">فيلا</option>
                  <option value="warehouse">مستودع</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">الاستخدام الافتراضي</label>
                <select
                  {...register("default_usage_type")}
                  className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-sm font-bold outline-none focus:border-emerald-500"
                >
                  <option value="residential">سكني</option>
                  <option value="commercial">تجاري</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">الإيجار الافتراضي</label>
                <div className="relative">
                  <input
                    type="number"
                    {...register("default_rent")}
                    className="w-full rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 pr-3 pl-12 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400">ريال</span>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50/50 p-6 border-t border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 leading-relaxed">
                <Info className="inline-block h-4 w-4 ml-1 mb-0.5" />
                سيتم توليد <span className="text-emerald-950 font-black">{previews.length}</span> وحدة بناءً على الإعدادات الحالية. يمكنك مراجعة وتعديل القائمة قبل الحفظ النهائي.
              </p>
            </div>
          </section>
        </div>

        {/* Preview and Action */}
        <div className="lg:col-span-2 space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-50 bg-emerald-50/20 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-emerald-950">مراجعة الوحدات المقترحة</h2>
              </div>
              <Badge variant="light" color="emerald" size="lg" radius="md">
                {previews.length} وحدة جاهزة
              </Badge>
            </div>

            <div className="max-h-[600px] overflow-y-auto px-4">
              <Table verticalSpacing="md" horizontalSpacing="lg">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest text-right">رقم الوحدة</th>
                    <th className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest text-right">الدور</th>
                    <th className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest text-right">النوع</th>
                    <th className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest text-right">الإيجار المتوقع</th>
                    <th className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest text-right">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.map((unit, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="font-black text-emerald-950">{unit.unit_number}</td>
                      <td className="font-bold text-emerald-700/60 text-sm">{unit.floor_number}</td>
                      <td>
                        <Badge variant="dot" color="emerald" radius="sm" size="sm" className="font-bold">
                          {unit.unit_type === 'apartment' ? 'شقة' : unit.unit_type === 'shop' ? 'محل' : unit.unit_type}
                        </Badge>
                      </td>
                      <td className="font-black text-emerald-900 text-sm">
                        {unit.rent_expected.toLocaleString()} <span className="text-[10px] text-emerald-500">ريال</span>
                      </td>
                      <td>
                        <ActionIcon 
                          color="rose" 
                          variant="light" 
                          radius="md"
                          onClick={() => setPreviews(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="p-8 border-t border-emerald-100 flex items-center justify-end gap-4">
              <Link
                href={`/properties/${propertyId}`}
                className="rounded-2xl px-8 py-3.5 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-all"
              >
                إلغاء
              </Link>
              <button
                onClick={onSubmit}
                disabled={createUnits.isPending || previews.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-10 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                {createUnits.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                اعتماد وحفظ الوحدات
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
