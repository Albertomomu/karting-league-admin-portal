'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  session: Session | null;
  user: Session['user'] | null;
  pilot: any | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  pilot: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [pilot, setPilot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPilot(null);
    setSession(null);
    router.replace('/signin');
  };

  useEffect(() => {
    const getSessionAndPilot = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: pilotData, error } = await supabase
          .from('pilot')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .eq('role', 'admin')
          .single();

        if (!error && pilotData) {
          setPilot(pilotData);
        } else {
          await handleLogout(); // 👈 si no es admin, fuera
        }
      }

      setLoading(false);
    };

    getSessionAndPilot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        const { data, error } = await supabase
          .from('pilot')
          .select('*')
          .eq('user_id', newSession.user.id)
          .eq('role', 'admin')
          .single();

        if (!error && data) {
          setPilot(data);
        } else {
          await handleLogout(); // 👈 si no es admin, fuera
        }
      } else {
        setPilot(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        pilot,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
