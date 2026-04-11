"use client";

import React from "react";
import { createT, Locale } from "@/lib/i18n";
import { Theme } from "@/lib/theme";

interface NavBarProps {
  locale: Locale;
  theme: Theme;
  onLocaleChange: (l: Locale) => void;
  onThemeChange: (t: Theme) => void;
  variant?: "full" | "minimal";
  activeRoute?: "dashboard" | "analyze";
  rightContent?: React.ReactNode;
  onLogout?: () => void;
}

function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => onChange("es")}
        className="px-1.5 py-0.5 rounded transition-colors"
        style={{
          backgroundColor: locale === "es" ? "var(--active-toggle-bg)" : "transparent",
          color: locale === "es" ? "var(--active-toggle-text)" : "var(--text-muted)",
        }}
      >
        ES
      </button>
      <button
        onClick={() => onChange("en")}
        className="px-1.5 py-0.5 rounded transition-colors"
        style={{
          backgroundColor: locale === "en" ? "var(--active-toggle-bg)" : "transparent",
          color: locale === "en" ? "var(--active-toggle-text)" : "var(--text-muted)",
        }}
      >
        EN
      </button>
    </div>
  );
}

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

export default function NavBar({
  locale,
  theme,
  onLocaleChange,
  onThemeChange,
  variant = "full",
  activeRoute,
  rightContent,
  onLogout,
}: NavBarProps) {
  const t = createT(locale);
  const isMinimal = variant === "minimal";

  return (
    <nav
      className={
        isMinimal
          ? "flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full"
          : "flex items-center justify-between px-8 py-4"
      }
      style={
        isMinimal
          ? {}
          : { borderBottom: "1px solid var(--nav-border)", boxShadow: "var(--nav-shadow)" }
      }
    >
      {/* Left: logo + toggles */}
      <div className="flex items-center gap-4">
        <a href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight font-display">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="url(#nav-bar-grad)" />
            <path d="M12 13l6 5-6 5V13z" fill="#fff" />
            <path d="M18 13l6 5-6 5V13z" fill="#fff" opacity="0.6" />
            <defs>
              <linearGradient id="nav-bar-grad" x1="0" y1="0" x2="36" y2="36">
                <stop stopColor="#ef4444" />
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <span><span style={{ color: "#FF0000" }}>YT</span>Combinator</span>
        </a>
        <LanguageToggle locale={locale} onChange={onLocaleChange} />
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>

      {/* Right: route links, rightContent, logout — full variant only */}
      {!isMinimal && (
        <div className="flex items-center gap-4">
          {activeRoute !== "analyze" && (
            <a
              href="/analyze"
              className="text-sm transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("nav.analyze")}
            </a>
          )}
          {activeRoute !== "dashboard" && (
            <a
              href="/dashboard"
              className="text-sm transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("nav.dashboard")}
            </a>
          )}
          {rightContent}
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {t("nav.logout")}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
