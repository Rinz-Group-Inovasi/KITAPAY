'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientBrowser } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({
  children,
  serverUser,
}: {
  children: React.ReactNode;
  serverUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(serverUser);
  const [loading, setLoading] = useState(!serverUser);
  const supabase = createClientBrowser();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'SIGNED_OUT') {
        if (typeof window !== 'undefined') {
          const host = window.location.host;
          let loginHost = host;
          if (host.startsWith('app.')) {
            loginHost = host.replace('app.', 'login.');
          } else if (!host.startsWith('login.')) {
            loginHost = `login.${host}`;
          }
          window.location.href = `${window.location.protocol}//${loginHost}/`;
        } else {
          router.push('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <CircleNotch weight="bold" className="w-8 h-8 animate-spin text-[#00DDFD]" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
