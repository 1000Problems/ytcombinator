// ── Theme: light / dark toggle with cookie persistence ──────────────

export type Theme = "light" | "dark";

export function getSavedTheme(): Theme {
  if (typeof document === "undefined") return "light"; // SSR default
  const match = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
  return (match?.[1] as Theme) ?? "light";
}

export function saveTheme(theme: Theme): void {
  document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}
