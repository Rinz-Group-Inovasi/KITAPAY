import React from 'react';

export function PageSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-6 animate-pulse pointer-events-none">
      {/* Skeleton Header Area */}
      <div className="space-y-3">
        <div className="w-48 h-8 bg-slate-200 rounded-lg"></div>
        <div className="w-96 h-4 bg-slate-200 rounded-md"></div>
      </div>
      
      {/* Generic Content Area */}
      <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-8 flex flex-col gap-6">
        <div className="w-full h-12 bg-slate-50 rounded-xl"></div>
        <div className="w-3/4 h-12 bg-slate-50 rounded-xl"></div>
        <div className="w-1/2 h-12 bg-slate-50 rounded-xl"></div>
        
        <div className="flex-1 min-h-50 w-full bg-slate-50 rounded-xl mt-4"></div>
      </div>
    </div>
  );
}
