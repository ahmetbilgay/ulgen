import { useEffect, useState } from "react";

const STORAGE_KEY = "ulgen-auth";

type AuthSession = {
  email: string;
  name: string;
  provider: "google" | "github" | "apple";
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

  const signIn = (provider: AuthSession["provider"]) => {
    const profiles = {
      google: { name: "Google User", email: "operator@google.local" },
      github: { name: "GitHub User", email: "operator@github.local" },
      apple: { name: "Apple User", email: "operator@apple.local" },
    } satisfies Record<AuthSession["provider"], { name: string; email: string }>;

    const profile = profiles[provider];
    const nextSession = { ...profile, provider };
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
    name: session?.name ?? null,
    provider: session?.provider ?? null,
    signIn,
    signOut,
  };
}
