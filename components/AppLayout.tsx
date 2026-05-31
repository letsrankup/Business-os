"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white font-mono overflow-hidden">
      <Sidebar open={open} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setOpen(!open)} title={title} />
        <main className="flex-1 overflow-y-auto p-5 space-y-6">{children}</main>
      </div>
    </div>
  );
}
