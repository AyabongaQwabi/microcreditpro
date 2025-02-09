import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
  isLender: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    loading: true,
    isLender: false,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserType(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserType(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserType = async (session: Session | null) => {
    if (session?.user) {
      try {
        const { data } = await supabase
          .from('lender_profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        setState({
          session,
          loading: false,
          isLender: !!data
        });
      } catch (error) {
        console.error('Error checking user type:', error);
        setState({
          session,
          loading: false,
          isLender: false
        });
      }
    } else {
      setState({
        session: null,
        loading: false,
        isLender: false
      });
    }
  };

  return state;
}