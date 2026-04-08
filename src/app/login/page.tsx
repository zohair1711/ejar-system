"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Text, 
  Container, 
  Group, 
  Stack, 
  Checkbox,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/dashboard";
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      notifications.show({
        title: "تم تسجيل الدخول",
        message: "أهلاً بك مجدداً في نظام إيجار",
        color: "green",
        icon: <ShieldCheck className="h-5 w-5" />,
      });

      // Give a small delay for cookies to be set properly before redirecting
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: any) {
      notifications.show({
        title: "خطأ في تسجيل الدخول",
        message: error.message || "يرجى التحقق من بيانات الاعتماد الخاصة بك",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.1),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(52,211,153,0.08),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] flex items-center justify-center p-6">
      <Container size={420} className="w-full">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/20">
            <div className="absolute inset-0 rounded-[24px] bg-white/10 blur-xl"></div>
            <Image 
              src="/logos/logo.png" 
              alt="Ejar Logo" 
              width={48} 
              height={48} 
              className="relative object-contain"
            />
          </div>
          <Title className="text-3xl font-black text-emerald-950 mb-2">تسجيل الدخول</Title>
          <Text c="dimmed" size="sm" fw={500}>مرحباً بك في نظام إيجار المتكامل لإدارة العقارات</Text>
        </div>

        <Paper radius="32px" p={40} withBorder className="shadow-2xl border-emerald-100/50 bg-white/80 backdrop-blur-xl">
          <form onSubmit={handleLogin}>
            <Stack gap="xl">
              <TextInput
                label="البريد الإلكتروني"
                placeholder="your@email.com"
                required
                size="md"
                radius="xl"
                leftSection={<Mail className="h-4 w-4 text-emerald-500" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                styles={{
                  input: { 
                    border: '1px solid #d1fae5',
                    '&:focus': { borderColor: '#10b981' }
                  },
                  label: { marginBottom: '8px', fontWeight: 800, color: '#064e3b' }
                }}
              />

              <PasswordInput
                label="كلمة المرور"
                placeholder="كلمة المرور الخاصة بك"
                required
                size="md"
                radius="xl"
                leftSection={<Lock className="h-4 w-4 text-emerald-500" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                styles={{
                  input: { 
                    border: '1px solid #d1fae5',
                    '&:focus': { borderColor: '#10b981' }
                  },
                  label: { marginBottom: '8px', fontWeight: 800, color: '#064e3b' }
                }}
              />

              <Group justify="space-between" mt="xs">
                <Checkbox 
                  label="تذكرني" 
                  color="emerald" 
                  size="xs" 
                  fw={700}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  styles={{
                    label: { color: '#064e3b', cursor: 'pointer' },
                    input: { cursor: 'pointer' }
                  }}
                />
                <Text size="xs" fw={800} className="text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors">
                  نسيت كلمة المرور؟
                </Text>
              </Group>

              <Button 
                fullWidth 
                size="lg" 
                radius="xl" 
                color="emerald" 
                type="submit"
                loading={loading}
                className="font-black shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                rightSection={!loading && <ArrowRight className="h-5 w-5 rotate-180" />}
              >
                دخول للنظام
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text c="dimmed" size="xs" ta="center" mt="xl" fw={600}>
          جميع الحقوق محفوظة لنظام إيجار © {new Date().getFullYear()}
        </Text>
      </Container>
    </div>
  );
}
