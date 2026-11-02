'use client';

import React from 'react';
import AES256Seal from './AES256Seal';

export default function SecurityComplianceSection() {
  return (
    <section id="keamanan" className="py-10 sm:py-12 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-3.5 sm:gap-4">
          <AES256Seal size={52} className="w-12 h-12 sm:w-13 sm:h-13" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              AES 256
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Standar enkripsi keamanan AES 256
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

