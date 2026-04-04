// ── i18n: lightweight string dictionary for ES / EN ────────────────────
// No external deps. Components call `t("key")` with the current locale.

export type Locale = "es" | "en";

const strings: Record<string, Record<Locale, string>> = {
  // ── Nav / branding ──
  "nav.quota_label": { en: "Quota", es: "Cuota" },

  // ── Dashboard header ──
  "dash.title": { en: "Keyword Portfolio", es: "Portafolio de Keywords" },
  "dash.keyword_count": { en: "keywords", es: "keywords" },

  // ── Filters ──
  "filter.all": { en: "All", es: "Todos" },
  "filter.targeted": { en: "Targeted", es: "Objetivo" },
  "filter.active": { en: "Active", es: "Activos" },
  "filter.pending": { en: "Pending", es: "Pendientes" },
  "filter.inactive": { en: "Inactive", es: "Inactivos" },

  // ── Sort ──
  "sort.label": { en: "Sort:", es: "Orden:" },
  "sort.latest": { en: "Latest", es: "Recientes" },
  "sort.views": { en: "Top Views", es: "Más Vistas" },
  "sort.opportunity": { en: "Best D/S", es: "Mejor D/O" },

  // ── Table headers ──
  "th.keyword": { en: "Keyword", es: "Keyword" },
  "th.category": { en: "Category", es: "Categoría" },
  "th.status": { en: "Status", es: "Estado" },
  "th.your_rank": { en: "Your Rank", es: "Tu Posición" },
  "th.top5_views": { en: "Top 5 Views", es: "Top 5 Vistas" },
  "th.unique_channels": { en: "Channels", es: "Canales" },
  "th.demand_supply": { en: "D/S Ratio", es: "Ratio D/O" },
  "th.revenue_est": { en: "Rev Est ($)", es: "Rev Est ($)" },
  "th.results": { en: "Results", es: "Resultados" },
  "th.last_collected": { en: "Last Collected", es: "Últ. Recolección" },
  "th.actions": { en: "Actions", es: "Acciones" },

  // ── Status badges ──
  "status.stale": { en: "stale", es: "desactualizado" },
  "status.pending": { en: "pending", es: "pendiente" },
  "status.active": { en: "active", es: "activo" },
  "status.paused": { en: "paused", es: "pausado" },

  // ── Rank labels ──
  "rank.new": { en: "(new)", es: "(nuevo)" },

  // ── Formula column tooltips ──
  "tip.unique_channels": {
    en: "Unique channels in top 25 results",
    es: "Canales únicos en los top 25 resultados",
  },
  "tip.demand_supply": {
    en: "Avg top-5 views ÷ unique channels. Higher = less competition",
    es: "Prom. vistas top-5 ÷ canales únicos. Mayor = menos competencia",
  },
  "tip.revenue_est": {
    en: "Top-5 views × $5 CPM ÷ 1000",
    es: "Vistas top-5 × $5 CPM ÷ 1000",
  },

  // ── Actions ──
  "action.pause": { en: "Pause", es: "Pausar" },
  "action.resume": { en: "Resume", es: "Reanudar" },
  "action.retry": { en: "Retry", es: "Reintentar" },

  // ── Empty / error states ──
  "empty.title": { en: "No keywords yet.", es: "Aún no hay keywords." },
  "empty.subtitle": {
    en: "Seed your keyword list below, or run a bulk import via SQL.",
    es: "Agrega keywords abajo o importa en lote por SQL.",
  },
  "error.load": {
    en: "Failed to load dashboard data",
    es: "Error al cargar los datos del dashboard",
  },

  // ── Add keyword form ──
  "form.placeholder_keyword": { en: "Add keyword...", es: "Agregar keyword..." },
  "form.placeholder_category": { en: "Category", es: "Categoría" },
  "form.targeted": { en: "Targeted", es: "Objetivo" },
  "form.add": { en: "Add", es: "Agregar" },
  "form.adding": { en: "Adding...", es: "Agregando..." },
  "form.collecting": { en: "Collecting data...", es: "Recolectando datos..." },
  "form.error_exists": { en: "Keyword already exists", es: "El keyword ya existe" },
  "form.error_add": { en: "Failed to add keyword", es: "Error al agregar keyword" },
  "form.error_network": { en: "Network error", es: "Error de red" },
  "form.quota_hint": { en: "+105 units/day", es: "+105 unidades/día" },

  // ── Preview ──
  "preview.loading": { en: "Loading top 5...", es: "Cargando top 5..." },
  "preview.error": { en: "Failed to load results.", es: "Error al cargar resultados." },
  "preview.empty": {
    en: "No results yet. This keyword hasn't been collected.",
    es: "Sin resultados aún. Este keyword no ha sido recolectado.",
  },
  "preview.video": { en: "Video", es: "Video" },
  "preview.channel": { en: "Channel", es: "Canal" },
  "preview.views": { en: "Views", es: "Vistas" },

  // ── Collection log ──
  "log.title": { en: "Collection Log", es: "Registro de Recolección" },
  "log.empty": {
    en: "No collection runs yet. Collector starts at 02:00 UTC.",
    es: "No hay recolecciones aún. El colector inicia a las 02:00 UTC.",
  },
  "log.timestamp": { en: "Timestamp", es: "Fecha/Hora" },
  "log.keywords": { en: "Keywords", es: "Keywords" },
  "log.quota": { en: "Quota", es: "Cuota" },
  "log.errors": { en: "Errors", es: "Errores" },
  "log.duration": { en: "Duration", es: "Duración" },

  // ── Time helpers ──
  "time.never": { en: "Never", es: "Nunca" },
  "time.m_ago": { en: "m ago", es: "m atrás" },
  "time.h_ago": { en: "h ago", es: "h atrás" },
  "time.d_ago": { en: "d ago", es: "d atrás" },

  // ── Landing page ──
  "landing.hero_title_1": { en: "Your YouTube Channel,", es: "Tu Canal de YouTube," },
  "landing.hero_title_2": { en: "on Autopilot", es: "en Piloto Automático" },
  "landing.hero_sub": {
    en: "YTCombinator is a suite of tools that schedules uploads, tracks analytics, and optimizes your content — so you can focus on creating, not managing.",
    es: "YTCombinator es un conjunto de herramientas que programa subidas, rastrea analíticas y optimiza tu contenido — para que te enfoques en crear, no en administrar.",
  },
  "landing.cta_features": { en: "See Features", es: "Ver Funciones" },
  "landing.cta_source": { en: "View Source", es: "Ver Código" },
  "landing.card1_title": { en: "Smart Scheduling", es: "Programación Inteligente" },
  "landing.card1_desc": {
    en: "Queue videos for upload at the perfect time. Set it, forget it, and let YTCombinator handle the publishing cadence your audience expects.",
    es: "Programa tus videos para subir en el momento perfecto. Configúralo y olvídalo — YTCombinator maneja la cadencia de publicación que tu audiencia espera.",
  },
  "landing.card2_title": { en: "Deep Analytics", es: "Analíticas Profundas" },
  "landing.card2_desc": {
    en: "Track views, CTR, retention, and subscriber growth over time. Daily snapshots give you trends without burning through your API quota.",
    es: "Rastrea vistas, CTR, retención y crecimiento de suscriptores. Las capturas diarias te dan tendencias sin agotar tu cuota de API.",
  },
  "landing.card3_title": { en: "Content Optimizer", es: "Optimizador de Contenido" },
  "landing.card3_desc": {
    en: "Get data-driven title, description, and tag suggestions. SEO scoring and keyword analysis help every video reach its full potential.",
    es: "Obtén sugerencias de título, descripción y tags basadas en datos. El análisis SEO ayuda a cada video a alcanzar su máximo potencial.",
  },
  "landing.footer": { en: "project", es: "proyecto" },
};

/**
 * Create a translator function bound to a locale.
 */
export function createT(locale: Locale) {
  return function t(key: string): string {
    const entry = strings[key];
    if (!entry) return key; // fallback: show the key itself
    return entry[locale] ?? entry.en ?? key;
  };
}

/**
 * Read saved locale from cookie (isomorphic-safe).
 */
export function getSavedLocale(): Locale {
  if (typeof document === "undefined") return "es"; // SSR default
  const match = document.cookie.match(/(?:^|;\s*)locale=(en|es)/);
  return (match?.[1] as Locale) ?? "es";
}

/**
 * Persist locale to cookie (365 days, SameSite=Lax).
 */
export function saveLocale(locale: Locale): void {
  document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
