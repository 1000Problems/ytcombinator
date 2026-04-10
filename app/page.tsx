"use client";

import { useState, useEffect } from "react";
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

export default function Home() {
  const [locale, setLocale] = useState<Locale>("es");
  const [theme, setTheme] = useState<Theme>("light");

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

  return (
    <div
      className="min-h-screen font-sans transition-colors"
      style={{
        background: `linear-gradient(to bottom right, var(--gradient-from), var(--gradient-via), var(--gradient-to))`,
        color: "var(--text-primary)",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="url(#nav-grad)" />
            <path d="M12 13l6 5-6 5V13z" fill="#fff" />
            <path d="M18 13l6 5-6 5V13z" fill="#fff" opacity="0.6" />
            <defs>
              <linearGradient id="nav-grad" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-bold tracking-tight font-display">YTCombinator</span>
        </div>
        <div className="flex items-center gap-4">
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
          <a
            href="/dashboard"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("nav.dashboard")}
          </a>
          <a
            href="/analyze"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("nav.analyze")}
          </a>
          <a
            href="https://github.com/1000Problems/ytcombinator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto animate-page-enter">
        <div className="mb-8 animate-slide-up">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="20" fill="url(#hero-grad)" />
            <path d="M26 28l14 12-14 12V28z" fill="#fff" />
            <path d="M40 28l14 12-14 12V28z" fill="#fff" opacity="0.6" />
            <circle cx="60" cy="24" r="6" fill="#fbbf24" />
            <path d="M58 23.5l1.2 1 1.8-2" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <defs>
              <linearGradient id="hero-grad" x1="0" y1="0" x2="80" y2="80">
                <stop stopColor="#ef4444" />
                <stop offset="0.5" stopColor="#f97316" />
                <stop offset="1" stopColor="#eab308" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 font-display animate-slide-up-delay-1">
          {t("landing.hero_title_1")}{" "}
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            {t("landing.hero_title_2")}
          </span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed animate-slide-up-delay-2" style={{ color: "var(--text-tertiary)" }}>
          {t("landing.hero_sub")}
        </p>
        <div className="flex gap-4 animate-slide-up-delay-3">
          <a
            href="#features"
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold btn-primary"
          >
            {t("landing.cta_features")}
          </a>
          <a
            href="https://github.com/1000Problems/ytcombinator"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg font-semibold btn-secondary"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            {t("landing.cta_source")}
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 rounded-lg font-semibold btn-secondary"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            {t("landing.cta_dashboard")}
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div
            className="backdrop-blur rounded-2xl p-8 hover:border-red-500/40 card-elevated animate-slide-up-delay-1"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 font-display">{t("landing.card1_title")}</h3>
            <p style={{ color: "var(--text-tertiary)" }} className="leading-relaxed">
              {t("landing.card1_desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="backdrop-blur rounded-2xl p-8 hover:border-orange-500/40 card-elevated animate-slide-up-delay-2"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 font-display">{t("landing.card2_title")}</h3>
            <p style={{ color: "var(--text-tertiary)" }} className="leading-relaxed">
              {t("landing.card2_desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="backdrop-blur rounded-2xl p-8 hover:border-yellow-500/40 card-elevated animate-slide-up-delay-3"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 font-display">{t("landing.card3_title")}</h3>
            <p style={{ color: "var(--text-tertiary)" }} className="leading-relaxed">
              {t("landing.card3_desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Tech badges */}
      <section className="max-w-6xl mx-auto px-6 py-16 animate-slide-up-delay-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["Next.js", "TypeScript", "Tailwind CSS", "Neon PostgreSQL", "Vercel", "YouTube API"].map((tech) => (
            <span
              key={tech}
              className="px-4 py-1.5 text-sm rounded-full"
              style={{
                background: "var(--tech-badge-bg)",
                border: "1px solid var(--tech-badge-border)",
                color: "var(--tech-badge-text)",
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-sm" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>
        A{" "}
        <a
          href="https://www.1000problems.com"
          className="transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          1000Problems
        </a>{" "}
        {t("landing.footer")}
      </footer>
    </div>
  );
}
