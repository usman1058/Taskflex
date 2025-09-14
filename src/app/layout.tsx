// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers";
import { Suspense } from "react";
import FloatingVoiceButton from '@/components/FloatingVoiceButton';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow - Advanced Task Management",
  description: "A comprehensive task management platform with collaboration features, inspired by Zammad and Jira. Perfect for students, teachers, and teams.",
  keywords: ["task management", "project management", "collaboration", "Zammad", "Jira", "productivity"],
  authors: [{ name: "TaskFlow Team" }],
  openGraph: {
    title: "TaskFlow - Advanced Task Management",
    description: "Comprehensive task management platform for teams and individuals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskFlow - Advanced Task Management",
    description: "Comprehensive task management platform for teams and individuals",
  },
};

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <Suspense fallback={<LoadingFallback />}>
            {children}
            {/* <FloatingVoiceButton /> */}
          </Suspense>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}