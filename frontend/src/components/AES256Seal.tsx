'use client';

import React from 'react';

interface AES256SealProps {
  className?: string;
  size?: number;
}

export default function AES256Seal({ className = 'w-12 h-12', size }: AES256SealProps) {
  return (
    <img
      src="/licenses-AES-256.webp"
      alt="AES 256"
      style={size ? { width: size, height: size } : undefined}
      className={`object-contain select-none shrink-0 ${className}`}
    />
  );
}
