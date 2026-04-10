"use client";

import { useState, useEffect, FormEvent } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";
import { getSavedTheme, saveTheme, applyTheme, Theme } from "@/lib/theme";

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <button
      onClick={() => onChange(theme === "light" ? "dark" : "light")}
      className="p-1.5 rounded transition-colors"
      style={{ color: "var(--text-tertiary)" }}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [locale, setLocale] = useState<Locale>("es");
  const [theme, setTheme] = useState<Theme>("light");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocale(getSavedLocale());
    const saved = getSavedTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const t = createT(locale);

  function handleLocaleChange(l: Locale) {
    setLocale(l);
    saveLocale(l);
  }

  function handleThemeChange(th: Theme) {
    setTheme(th);
    saveTheme(th);
    applyTheme(th);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(t("login.error"));
      }
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen font-sans flex flex-col transition-colors"
      style={{
        background: `linear-gradient(to bottom right, var(--gradient-from), var(--gradient-via), var(--gradient-to))`,
        color: "var(--text-primary)",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <a href="/" className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="url(#login-grad)" />
            <path d="M12 13l6 5-6 5V13z" fill="#fff" />
            <path d="M18 13l6 5-6 5V13z" fill="#fff" opacity="0.6" />
            <defs>
              <linearGradient id="login-grad" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-bold tracking-tight font-display">YTCombinator</span>
        </a>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => handleLocaleChange("es")}
              className="px-1.5 py-0.5 rounded transition-colors"
              style={{
                backgroundColor: locale === "es" ? "var(--active-toggle-bg)" : "transparent",
                color: locale === "es" ? "var(--active-toggle-text)" : "var(--text-muted)",
              }}
            >
              ES
            </button>
            <button
              onClick={() => handleLocaleChange("en")}
              className="px-1.5 py-0.5 rounded transition-colors"
              style={{
                backgroundColor: locale === "en" ? "var(--active-toggle-bg)" : "transparent",
                color: locale === "en" ? "var(--active-toggle-text)" : "var(--text-muted)",
              }}
            >
              EN
            </button>
          </div>
          <ThemeToggle theme={theme} onChange={handleThemeChange} />
        </div>
      </nav>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl p-8 card-elevated-lg animate-scale-in" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="flex justify-center mb-5">
            <div style={{ width: 48, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308)' }} />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 font-display">{t("login.title")}</h1>
          <p className="text-center text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>{t("login.subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.placeholder")}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold btn-primary"
            >
              {loading ? "..." : t("login.button")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
