import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { ColorSchemeScript } from "@mantine/core";
import Navigation from "@/components/Navigation";
import PageLoader from "@/components/PageLoader";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "EJAR System",
  description: "Advanced Real Estate Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="ej-body font-sans antialiased">
        <Providers>
          <Suspense fallback={null}>
            <PageLoader />
          </Suspense>
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(52,211,153,0.05),_transparent_25%),linear-gradient(to_bottom,_#fdfdfd,_#f0fdf4)] text-emerald-950">
            <Navigation>{children}</Navigation>
          </div>
        </Providers>
      </body>
    </html>
  );
}