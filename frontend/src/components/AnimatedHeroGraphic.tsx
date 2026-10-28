"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ShieldCheck } from "@phosphor-icons/react";

export default function AnimatedHeroGraphic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrisCardRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const successCardRef = useRef<HTMLDivElement>(null);
  const logCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Make sure we have our refs
    if (!qrisCardRef.current || !scannerRef.current || !successCardRef.current || !logCardRef.current) return;

    // Create a master GSAP Timeline that repeats indefinitely
    const tl = gsap.timeline({ repeat: -1 });

    // Step 0: Initial states
    gsap.set(qrisCardRef.current, { opacity: 1, scale: 1, y: 0 });
    gsap.set(scannerRef.current, { top: "0%", opacity: 0 });
    gsap.set(successCardRef.current, { opacity: 0, y: 20, scale: 0.95 });
    gsap.set(logCardRef.current, { opacity: 0, y: 20, scale: 0.95 });

    // Step 1: Scanner animation
    tl.to(scannerRef.current, { opacity: 1, duration: 0.2 })
      .to(scannerRef.current, { top: "100%", duration: 1.5, ease: "power1.inOut" })
      .to(scannerRef.current, { opacity: 0, duration: 0.2 });

    // Step 2: Success Card pops up
    tl.to(successCardRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }, "+=0.2");

    // Step 3: Log Card pops up
    tl.to(logCardRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }, "+=0.4");

    // Hold for a moment to let user read
    tl.to({}, { duration: 2.5 });

    // Step 4: Fade everything out smoothly to reset
    tl.to([qrisCardRef.current, successCardRef.current, logCardRef.current], {
      opacity: 0,
      y: -10,
      scale: 0.95,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.inOut",
    });

    return () => {
      tl.kill();
    };
  }, []);

  // Generate a bunch of random dots for the QR Code to look realistic
  const renderQRDots = () => {
    const dots = [];
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // Leave corners empty for the position markers
        if (
          (i < 7 && j < 7) ||
          (i < 7 && j > 17) ||
          (i > 17 && j < 7)
        ) {
          continue;
        }
        // Pseudo-randomly place dots (deterministic to avoid hydration mismatch)
        if (((i * 17 + j * 23) % 10) > 4) {
          dots.push(
            <rect key={`${i}-${j}`} x={j * 4} y={i * 4} width="4" height="4" fill="#1e293b" rx="1" />
          );
        }
      }
    }
    return dots;
  };

  return (
    <div className="relative block mt-12 lg:mt-0 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 perspective-1000">
      <div 
        ref={containerRef}
        className="relative w-full aspect-square max-w-[320px] sm:max-w-100 lg:max-w-125 mx-auto transform-3d rotate-y-[-10deg] rotate-x-[5deg]"
      >
        {/* QRIS Card (Step 1) */}
        <div 
          ref={qrisCardRef}
          className="absolute top-10 left-4 right-4 sm:left-10 sm:right-10 bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl shadow-slate-200/50 z-20 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 relative z-20">
            <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
            <div className="h-6 w-16 bg-[#00DDFD]/20 text-[#00DDFD] text-xs font-bold rounded-full flex items-center justify-center">QRIS</div>
          </div>
          
          {/* Realistic QR Placeholder */}
          <div className="w-40 h-40 mx-auto bg-slate-50 rounded-xl relative p-3 border border-slate-200 shadow-inner flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Top Left Marker */}
              <rect x="0" y="0" width="28" height="28" fill="none" stroke="#1e293b" strokeWidth="4" rx="4" />
              <rect x="8" y="8" width="12" height="12" fill="#1e293b" rx="2" />
              
              {/* Top Right Marker */}
              <rect x="72" y="0" width="28" height="28" fill="none" stroke="#1e293b" strokeWidth="4" rx="4" />
              <rect x="80" y="8" width="12" height="12" fill="#1e293b" rx="2" />
              
              {/* Bottom Left Marker */}
              <rect x="0" y="72" width="28" height="28" fill="none" stroke="#1e293b" strokeWidth="4" rx="4" />
              <rect x="8" y="80" width="12" height="12" fill="#1e293b" rx="2" />

              {/* Random Dots */}
              {renderQRDots()}
            </svg>
            
            {/* GSAP Scanner line */}
            <div 
              ref={scannerRef}
              className="absolute left-0 right-0 h-1 bg-[#00DDFD] shadow-[0_0_15px_#00DDFD] z-10"
            ></div>
          </div>
        </div>

        {/* Success Card (Step 2) */}
        <div 
          ref={successCardRef}
          className="absolute top-40 left-0 right-10 sm:right-20 bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-slate-900/30 z-30 opacity-0"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <ShieldCheck weight="fill" />
            </div>
            <div className="text-white font-bold text-sm sm:text-base">Pembayaran Berhasil</div>
          </div>
          <div className="text-slate-400 text-xs sm:text-sm mb-4">Invoice #INV-293842</div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 w-full"></div>
          </div>
        </div>

        {/* Log Card (Step 3) */}
        <div 
          ref={logCardRef}
          className="absolute top-64 left-10 right-0 sm:left-20 bg-white rounded-3xl p-5 shadow-2xl shadow-slate-200/50 z-40 border border-slate-100 opacity-0"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-slate-900 font-bold text-xs sm:text-sm">QRIS Diterima</div>
                <div className="text-slate-500 text-[10px] sm:text-xs">Baru saja</div>
              </div>
            </div>
            <div className="text-green-500 font-bold text-sm sm:text-base">+Rp 150.000</div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 -right-10 w-24 h-24 bg-[#00DDFD] rounded-full blur-2xl opacity-20 -z-10 animate-pulse"></div>
      </div>
    </div>
  );
}
