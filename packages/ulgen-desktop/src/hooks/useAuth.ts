export function useAuth() {
  return {
    isAuthenticated: false,
    mode: "local-first" as const,
  };
}
