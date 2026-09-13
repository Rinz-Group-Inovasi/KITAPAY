'use client';

import React, { createContext, useContext } from 'react';

const EnvContext = createContext<boolean>(false);

export function EnvProvider({ isSandbox, children }: { isSandbox: boolean, children: React.ReactNode }) {
  return (
    <EnvContext.Provider value={isSandbox}>
      {children}
    </EnvContext.Provider>
  );
}

export function useEnv() {
  return useContext(EnvContext);
}
