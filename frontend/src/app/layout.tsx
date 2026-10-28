import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { ConfirmModalProvider } from "@/components/ConfirmModalProvider";
import LenisProvider from "@/components/LenisProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KitaPay - Platform Pembayaran Digital & QRIS Instan",
  description: "Terima pembayaran QRIS secara instan tanpa ribet untuk UMKM dan bisnis online.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <LenisProvider>
          <ToastProvider>
            <ConfirmModalProvider>
              {children}
            </ConfirmModalProvider>
          </ToastProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
