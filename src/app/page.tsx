"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, Building } from "lucide-react";

export default function HomePage() {
  const [status, setStatus] = useState("جاري التحقق...");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from("contracts").select("id").limit(1);

        if (error) {
          setStatus("فشل الاتصال بقاعدة البيانات");
          setError(error.message);
          setIsConnected(false);
          return;
        }

        setStatus("تم الاتصال بـ Supabase بنجاح");
        setIsConnected(true);
      } catch (err: any) {
        setStatus("فشل الاتصال");
        setError(err.message);
        setIsConnected(false);
      }
    };

    void checkConnection();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-2xl w-full">
        <div className="rounded-3xl bg-white p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">نظام إيجار المطور</h1>
            <p className="mt-2 text-slate-500">منصة إدارة العقود والوحدات السكنية</p>
          </div>

          <div className={`mb-10 rounded-2xl border p-6 transition-all ${isConnected ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p className={`font-semibold ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                {status}
              </p>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 pr-8">{error}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Link
              href="/contracts"
              className="group flex items-center justify-between rounded-2xl bg-slate-900 p-5 text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">إدارة العقود</p>
                  <p className="text-sm text-slate-400">عرض، إنشاء ومتابعة العقود</p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </Link>

            <button
              disabled
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-slate-400 transition-all opacity-60 grayscale cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">إدارة العقارات</p>
                  <p className="text-sm">قريباً...</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} نظام إيجار
        </p>
      </div>
    </main>
  );
}