import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { SidebarProvider } from "@/context/SidebarContext";
import { ToastProvider } from "@/components/ui/Toast";

import { GlobalShortcuts } from "@/components/GlobalShortcuts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xandeum Analytics - pNode Network Monitor",
  description: "Real-time analytics and monitoring for Xandeum pNode storage network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <ToastProvider>
            <Navigation />
            <GlobalShortcuts />
            {children}
          </ToastProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
