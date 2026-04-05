"use client";

import { useState, useEffect } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";

export default function Home() {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    setLocale(getSavedLocale());
  }, []);

  const t = createT(locale);

  function handleLocaleChange(l: Locale) {
    setLocale(l);
    saveLocale(l);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 text-white font-sans">
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
          <span className="text-xl font-bold tracking-tight">YTCombinator</span>
        </div>
        <div className="flex items-center gap-4">
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
          <a
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t("nav.dashboard")}
          </a>
          <a
            href="https://github.com/1000Problems/ytcombinator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="mb-8">
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
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          {t("landing.hero_title_1")}{" "}
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            {t("landing.hero_title_2")}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          {t("landing.hero_sub")}
        </p>
        <div className="flex gap-4">
          <a
            href="#features"
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
          >
            {t("landing.cta_features")}
          </a>
          <a
            href="https://github.com/1000Problems/ytcombinator"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold transition-colors"
          >
            {t("landing.cta_source")}
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold transition-colors"
          >
            {t("landing.cta_dashboard")}
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-8 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">{t("landing.card1_title")}</h3>
            <p className="text-gray-400 leading-relaxed">
              {t("landing.card1_desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-8 hover:border-orange-500/40 transition-colors">
            <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">{t("landing.card2_title")}</h3>
            <p className="text-gray-400 leading-relaxed">
              {t("landing.card2_desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-8 hover:border-yellow-500/40 transition-colors">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">{t("landing.card3_title")}</h3>
            <p className="text-gray-400 leading-relaxed">
              {t("landing.card3_desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Tech badges */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["Next.js", "TypeScript", "Tailwind CSS", "Neon PostgreSQL", "Vercel", "YouTube API"].map((tech) => (
            <span
              key={tech}
              className="px-4 py-1.5 text-sm bg-gray-800/60 border border-gray-700/50 rounded-full text-gray-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-gray-500 text-sm">
        A{" "}
        <a
          href="https://www.1000problems.com"
          className="text-gray-300 hover:text-white transition-colors"
        >
          1000Problems
        </a>{" "}
        {t("landing.footer")}
      </footer>
    </div>
  );
}
