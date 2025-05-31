'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

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

  // Carga inicial
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
          .single();

        if (!error) {
          setPilot(pilotData);
        }
      }

      setLoading(false);
    };

    getSessionAndPilot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        supabase
          .from('pilot')
          .select('*')
          .eq('user_id', newSession.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error) setPilot(data);
            else setPilot(null);
          });
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
