
import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "LyncApp MOS Core",
  description: "High-Integrity Mobility Operating System Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#020617] text-slate-400 selection:bg-blue-500/30`}>
        {children}
      </body>
    </html>
  );
}
