"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { getUserProfile, UserProfile } from "@/lib/authService";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const applyUser = async (nextUser: User | null) => {
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        return;
      }

      const currentProfile = await getUserProfile(nextUser.id);
      if (isMounted) setProfile(currentProfile);
    };

    // Initial load on first mount.
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      applyUser(data.user).finally(() => {
        if (isMounted) setLoading(false);
      });
    });

    // React live to sign-in, sign-out, and session/user changes (e.g. the
    // demo "switch to admin/student" flow, which swaps sessions without a
    // full page reload) instead of only checking once on mount.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        applyUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
