"use client";

import React from "react";
import Link from "next/link";
import { Headset } from "@phosphor-icons/react";

export default function FloatingSupportButton() {
  return (
    <Link
      href="/dashboard/support"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#00DDFD] hover:bg-[#00c5e3] text-slate-900 font-bold py-3 px-5 rounded-full shadow-lg shadow-[#00DDFD]/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
    >
      <Headset size={24} weight="fill" className="group-hover:animate-pulse" />
      <span>Support</span>
    </Link>
  );
}
