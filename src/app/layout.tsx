import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers";

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
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
