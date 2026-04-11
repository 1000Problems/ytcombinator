"use client";

import { useState, useEffect, FormEvent } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";
import { getSavedTheme, saveTheme, applyTheme, Theme } from "@/lib/theme";
import NavBar from "@/app/components/NavBar";

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
      <NavBar
        locale={locale}
        theme={theme}
        onLocaleChange={handleLocaleChange}
        onThemeChange={handleThemeChange}
        variant="minimal"
      />

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
