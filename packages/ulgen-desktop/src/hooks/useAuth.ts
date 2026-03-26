import { useEffect, useState } from "react";

const STORAGE_KEY = "ulgen-auth";

type AuthSession = {
  email: string;
};

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSession(JSON.parse(raw) as AuthSession);
      }
    } finally {
      setIsReady(true);
    }
  }, []);

  const signIn = (email: string) => {
    const nextSession = { email };
    setSession(nextSession);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  };

  const signOut = () => {
    setSession(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return {
    isReady,
    isAuthenticated: Boolean(session),
    email: session?.email ?? null,
    signIn,
    signOut,
  };
}
