import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import NextAuthProvider from "@/components/SessionProvider";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "JobTrack CRM",
  description: "Personal Job Search CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased bg-slate-950 text-slate-200 min-h-screen flex flex-col`}>
        <NextAuthProvider>
          {/* We'll use a Client wrapper for the Sidebar logic in a separate component if needed, 
              or just wrap children. Since Sidebar uses 'use client', we can just import it. */}
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </NextAuthProvider>
      </body>
    </html>
  );
}
