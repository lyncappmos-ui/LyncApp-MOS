import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '../services/MOSAPI'; // Initialize MOS Bridge Relay

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "LyncApp MOS Core",
  description: "A production-grade Mobility Operating System for Matatu SACCOs",
};

// Fix: Added React import to resolve 'Cannot find namespace React' for React.ReactNode on line 19
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#020617] text-slate-400`}>
        {children}
      </body>
    </html>
  );
}