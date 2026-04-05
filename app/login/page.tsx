"use client";

import { useState, useEffect, FormEvent } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";

export default function LoginPage() {
  const [locale, setLocale] = useState<Locale>("es");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocale(getSavedLocale());
  }, []);

  const t = createT(locale);

  function handleLocaleChange(l: Locale) {
    setLocale(l);
    saveLocale(l);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 text-white font-sans flex flex-col">
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
          <span className="text-xl font-bold tracking-tight">YTCombinator</span>
        </a>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => handleLocaleChange("es")}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              locale === "es" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ES
          </button>
          <button
            onClick={() => handleLocaleChange("en")}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              locale === "en" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            EN
          </button>
        </div>
      </nav>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-center mb-2">{t("login.title")}</h1>
          <p className="text-gray-400 text-center text-sm mb-8">{t("login.subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.placeholder")}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? "..." : t("login.button")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
