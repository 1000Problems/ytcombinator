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
  "filter.starred": { en: "Starred", es: "Destacados" },
  "filter.pending": { en: "Pending", es: "Pendientes" },

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
  "th.demand_supply": { en: "Opportunity", es: "Oportunidad" },
  "th.revenue_est": { en: "Revenue ($)", es: "Ingresos ($)" },
  "th.results": { en: "Results", es: "Resultados" },
  "th.last_collected": { en: "Last Collected", es: "Últ. Recolección" },
  "th.annual_value": { en: "Annual ($)", es: "Anual ($)" },
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
    en: "Top-5 views × region CPM ÷ 1000",
    es: "Vistas top-5 × CPM regional ÷ 1000",
  },
  "tip.annual_value": {
    en: "Monthly revenue estimate × 12",
    es: "Estimación de ingresos mensual × 12",
  },

  // ── Actions ──
  "action.star": { en: "Star this keyword", es: "Destacar este keyword" },
  "action.unstar": { en: "Remove star", es: "Quitar destacado" },
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

  // ── Search bar ──
  "search.placeholder": { en: "Filter keywords...", es: "Filtrar keywords..." },
  "search.results": { en: "showing", es: "mostrando" },
  "search.clear": { en: "Clear", es: "Limpiar" },

  // ── Research bar ──
  "research.placeholder": { en: "Research new keyword...", es: "Investigar nuevo keyword..." },
  "research.button": { en: "Research", es: "Investigar" },
  "research.collecting": { en: "Researching...", es: "Investigando..." },
  "research.add": { en: "+ Add to Portfolio", es: "+ Agregar al Portafolio" },
  "research.dismiss": { en: "Dismiss", es: "Descartar" },
  "research.error_exists": { en: "Keyword already exists", es: "El keyword ya existe" },
  "research.error": { en: "Failed to research keyword", es: "Error al investigar keyword" },
  "research.error_network": { en: "Network error", es: "Error de red" },
  "research.quota_hint": { en: "105 quota units", es: "105 unidades de cuota" },
  "research.added": { en: "Added!", es: "¡Agregado!" },
  "research.waiting": { en: "Calculating metrics...", es: "Calculando métricas..." },

  // ── Collect button ──
  "collect.button": { en: "Collect All", es: "Recolectar Todo" },
  "collect.running": { en: "Collecting...", es: "Recolectando..." },
  "collect.done": { en: "Done!", es: "¡Listo!" },

  // ── Legacy form keys (kept for compat) ──
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

  // ── Formula explanations ──
  "formula.title": { en: "How Metrics Are Calculated", es: "Cómo se Calculan las Métricas" },
  "formula.channels_title": { en: "Channels", es: "Canales" },
  "formula.channels_desc": {
    en: "The number of unique YouTube channels appearing in the top 25 search results for this keyword. A lower count means fewer creators are competing for this term, which can signal an easier entry point.",
    es: "El número de canales únicos de YouTube que aparecen en los 25 primeros resultados de búsqueda para este keyword. Un número bajo significa menos creadores compitiendo por ese término, lo que puede indicar un punto de entrada más fácil.",
  },
  "formula.ds_title": { en: "Opportunity Score (Demand / Supply)", es: "Puntuación de Oportunidad (Demanda / Oferta)" },
  "formula.ds_desc": {
    en: "Calculated as the average view count of the top 5 videos divided by the number of unique channels in the top 25. A high ratio (green, ≥50K) indicates strong viewer demand with relatively few suppliers — a prime opportunity. A medium ratio (yellow, ≥10K) is moderately competitive. A low ratio (red, <10K) means the niche is saturated or has low demand.",
    es: "Se calcula como el promedio de vistas de los 5 videos principales dividido entre el número de canales únicos en el top 25. Un ratio alto (verde, ≥50K) indica alta demanda de espectadores con relativamente pocos competidores — una oportunidad ideal. Un ratio medio (amarillo, ≥10K) es moderadamente competitivo. Un ratio bajo (rojo, <10K) significa que el nicho está saturado o tiene baja demanda.",
  },
  "formula.rev_title": { en: "Revenue Estimate ($)", es: "Estimación de Ingresos ($)" },
  "formula.rev_desc": {
    en: "Estimated ad revenue potential based on the sum of the top 5 video view counts multiplied by a $5 CPM (cost per thousand impressions), then divided by 1,000. This gives a rough sense of the total ad dollars flowing through the top results for this keyword. Higher values mean more monetization potential.",
    es: "Potencial estimado de ingresos por publicidad basado en la suma de vistas de los 5 videos principales multiplicada por un CPM de $5 (costo por mil impresiones), dividido entre 1,000. Esto da una idea aproximada del total de dólares publicitarios que fluyen por los resultados principales de este keyword. Valores más altos significan mayor potencial de monetización.",
  },

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
  "landing.cta_dashboard": { en: "Go to Dashboard", es: "Ir al Dashboard" },

  // ── Nav: dashboard link ──
  "nav.dashboard": { en: "Dashboard", es: "Dashboard" },
  "nav.logout": { en: "Logout", es: "Cerrar Sesión" },

  // ── Login page ──
  "login.title": { en: "Sign In", es: "Iniciar Sesión" },
  "login.subtitle": { en: "Enter the dashboard password to continue", es: "Ingresa la contraseña del dashboard para continuar" },
  "login.placeholder": { en: "Password", es: "Contraseña" },
  "login.button": { en: "Sign In", es: "Iniciar Sesión" },
  "login.error": { en: "Invalid password", es: "Contraseña inválida" },

  // ─�� COPPA toggle ──
  // ── Region toggle ──
  "region.us_en": { en: "US English", es: "US Inglés" },
  "region.us_es": { en: "US Spanish", es: "US Español" },
  "region.latam_es": { en: "LATAM", es: "LATAM" },
  "region.tooltip": {
    en: "Select ad market region — affects CPM rates used for revenue estimates",
    es: "Selecciona la región del mercado publicitario — afecta las tasas CPM usadas para estimaciones de ingresos",
  },

  "coppa.kids": { en: "Kids", es: "Niños" },
  "coppa.family": { en: "Family", es: "Familia" },
  "coppa.tooltip_kids": { en: "Made for Kids: lower CPM (COPPA restricted)", es: "Para Niños: CPM bajo (restricción COPPA)" },
  "coppa.tooltip_family": { en: "Family/General: full ad personalization", es: "Familia/General: personalización completa de anuncios" },

  // ── Portfolio valuation ──
  "valuation.annual_revenue": { en: "Est. Annual Revenue", es: "Ingresos Anuales Est." },
  "valuation.portfolio_value": { en: "Portfolio Valuation (2.5×)", es: "Valuación del Portafolio (2.5×)" },
  "valuation.methodology": { en: "Based on annual revenue × 2.5 multiple", es: "Basado en ingresos anuales × múltiplo de 2.5" },
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
