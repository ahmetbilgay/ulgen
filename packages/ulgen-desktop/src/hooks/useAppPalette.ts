import { useTheme } from "next-themes";

export function useAppPalette() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return {
    isDark,
    toggleTheme: () => setTheme(isDark ? "light" : "dark"),
    text: isDark ? "#edf4fb" : "#18212d",
    muted: isDark ? "#93a8bb" : "#667788",
    border: isDark ? "rgba(151, 180, 204, 0.18)" : "rgba(96, 116, 136, 0.14)",
    pageBg: isDark ? "#071019" : "#f4f7fb",
    chrome: isDark ? "rgba(11, 19, 30, 0.82)" : "rgba(255, 255, 255, 0.78)",
    panel: isDark ? "rgba(12, 21, 34, 0.94)" : "rgba(255, 255, 255, 0.98)",
    soft: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.04)",
    hero:
      isDark
        ? "linear-gradient(145deg, rgba(8, 16, 27, 0.98), rgba(17, 31, 47, 0.94))"
        : "linear-gradient(145deg, rgba(255, 252, 247, 0.98), rgba(239, 232, 221, 0.98))",
    accent: isDark ? "#78d8ff" : "#1677c9",
    accentSoft: isDark ? "rgba(120, 216, 255, 0.14)" : "rgba(22, 119, 201, 0.10)",
    ctaBg: isDark ? "#f3b162" : "#112033",
    ctaHover: isDark ? "#f7c277" : "#1e3148",
    ctaText: isDark ? "#101722" : "#f8fbfd",
    subtleBg: isDark ? "rgba(120, 216, 255, 0.09)" : "#eef5ff",
    subtleText: isDark ? "#d7f5ff" : "#125b96",
    navButtonBg: isDark ? "#132230" : "#f7faff",
    navButtonHover: isDark ? "#1a2e40" : "#eef4fb",
    navButtonText: isDark ? "#edf4fb" : "#18212d",
  };
}
