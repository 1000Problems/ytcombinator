const COLORS = {
  bg: "#110f0e",
  bgAlt: "#1a1614",
  surface: "#252018",
  card: "rgba(30, 25, 20, 0.85)",
  border: "rgba(55, 46, 37, 0.7)",
  borderSubtle: "rgba(40, 33, 26, 0.5)",
  textPrimary: "#f2ede8",
  textSecondary: "#d9d0c8",
  textMuted: "#9c8f84",
  textDim: "#6b5f56",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#eab308",
};

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C%2Fsvg%3E\")";

const MOCK_ROWS = [
  { kw: "baby shark song",             tags: ["baby", "shark"],      opp: "444.7M", rev: "$17.8K–55.6K", rank: "—",  star: true  },
  { kw: "baby song",                   tags: ["songs", "nursery"],   opp: "356.4M", rev: "$151K",        rank: "—",  star: true  },
  { kw: "wheels on the bus",           tags: ["nursery", "classic"], opp: "175.4M", rev: "$9.1K–28.5K",  rank: "12", star: false },
  { kw: "nursery rhymes for toddlers", tags: ["nursery", "toddlers"],opp: "142.3M", rev: "$7.8K–24.4K",  rank: "—",  star: false },
  { kw: "baby songs playlist",         tags: ["baby", "songs"],      opp: "118.6M", rev: "$6.2K–19.4K",  rank: "—",  star: false },
];

export default function Home() {
  return (
    <div className="min-h-screen font-sans" style={{ background: COLORS.bg, color: COLORS.textPrimary }}>
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
        style={{ backgroundImage: NOISE_URL, backgroundSize: "200px 200px" }}
      />

      <div className="relative z-10">
        {/* ── Nav ── */}
        <nav
          style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}
          className="flex items-center justify-between px-10 py-4 sticky top-0 z-10"
        >
          <a
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
            style={{ color: COLORS.textPrimary }}
          >
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="url(#landing-grad)" />
              <path d="M12 13l6 5-6 5V13z" fill="#fff" />
              <path d="M18 13l6 5-6 5V13z" fill="#fff" opacity="0.6" />
              <defs>
                <linearGradient id="landing-grad" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#ef4444" />
                  <stop offset="1" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <span><span style={{ color: "#FF0000" }}>YT</span>Combinator</span>
          </a>
          <div className="flex items-center gap-6 text-sm" style={{ color: COLORS.textMuted }}>
            <a href="/dashboard" style={{ color: COLORS.textSecondary }}>Dashboard</a>
            <a
              href="https://github.com/1000Problems/ytcombinator"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="flex items-center min-h-[calc(100vh-57px)] max-w-7xl mx-auto px-10 gap-12">
          {/* Left: headline + CTA */}
          <div className="flex-[0_0_55%]">
            <div className="flex gap-5 items-start mb-6">
              <div
                className="w-1 self-stretch rounded-full mt-1"
                style={{
                  background: "linear-gradient(to bottom, #ef4444, #f97316, #eab308)",
                  minHeight: "80px",
                }}
              />
              <h1
                className="font-display font-extrabold leading-[1.05] tracking-tight"
                style={{ fontSize: "clamp(2.5rem, 4vw, 3.75rem)", color: COLORS.textPrimary }}
              >
                Find the keyword<br />
                before anyone<br />
                else ranks for it.
              </h1>
            </div>
            <p className="text-lg mb-8 max-w-md leading-relaxed" style={{ color: COLORS.textMuted }}>
              Daily keyword intelligence for YouTube creators. Volume scores, revenue estimates,
              competition analysis — automated and ranked by opportunity.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: COLORS.red, color: "#fff" }}
            >
              Open Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Right: keyword table mockup */}
          <div className="flex-1 relative" style={{ maxHeight: "70vh" }}>
            {/* Gradient fade at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to bottom, transparent, ${COLORS.bg})` }}
            />
            {/* Table card */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              {/* Table header */}
              <div
                className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
                style={{
                  gridTemplateColumns: "1fr 100px 120px 70px",
                  borderBottom: `1px solid ${COLORS.border}`,
                  color: COLORS.textDim,
                }}
              >
                <span>KEYWORD</span>
                <span className="text-right">OPPORTUNITY</span>
                <span className="text-right">REVENUE / MO</span>
                <span className="text-center">RANK</span>
              </div>

              {/* Rows */}
              {MOCK_ROWS.map((row, i) => (
                <div
                  key={i}
                  className="grid px-4 py-3 text-sm items-center transition-colors hover:opacity-80"
                  style={{
                    gridTemplateColumns: "1fr 100px 120px 70px",
                    borderBottom: `1px solid ${COLORS.borderSubtle}`,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {row.star && <span style={{ color: COLORS.amber }}>★</span>}
                      <span style={{ color: COLORS.textPrimary }}>{row.kw}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {row.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: COLORS.surface, color: COLORS.textDim }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm font-bold" style={{ color: "#4ade80" }}>
                    {row.opp}
                  </div>
                  <div className="text-right text-xs" style={{ color: COLORS.textSecondary }}>
                    {row.rev}
                  </div>
                  <div
                    className="text-center text-sm"
                    style={{ color: row.rank === "—" ? COLORS.textDim : COLORS.textPrimary }}
                  >
                    {row.rank}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section
          style={{
            background: COLORS.bgAlt,
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="max-w-4xl mx-auto px-10 py-16 flex items-center">
            <div className="flex-1 flex flex-col items-center text-center">
              <div
                className="font-display font-extrabold mb-2"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: COLORS.red }}
              >
                95
              </div>
              <div className="text-sm" style={{ color: COLORS.textMuted }}>keywords analyzed daily</div>
            </div>

            <div style={{ width: "1px", height: "80px", background: COLORS.border }} />

            <div className="flex-1 flex flex-col items-center text-center">
              <div
                className="font-display font-extrabold mb-2"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: COLORS.orange }}
              >
                $400M
              </div>
              <div className="text-sm" style={{ color: COLORS.textMuted }}>annual channel value tracked</div>
            </div>

            <div style={{ width: "1px", height: "80px", background: COLORS.border }} />

            <div className="flex-1 flex flex-col items-center text-center">
              <div
                className="font-display font-extrabold mb-2"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: COLORS.amber }}
              >
                10K
              </div>
              <div className="text-sm" style={{ color: COLORS.textMuted }}>YouTube API quota, auto-managed</div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-5xl mx-auto px-10 py-24">
          <h2
            className="font-display font-bold mb-16 text-center"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: COLORS.textSecondary }}
          >
            How it works
          </h2>
          <div className="flex items-start gap-0 relative">
            {/* Connecting gradient line */}
            <div
              className="absolute top-[1.75rem] left-[16.67%] right-[16.67%] h-px z-0"
              style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308)" }}
            />
            {[
              {
                num: "01",
                title: "Seed keywords",
                body: "Add topics you want to rank for. The system auto-expands via YouTube autocomplete and tag mining.",
                color: COLORS.red,
              },
              {
                num: "02",
                title: "Daily collection",
                body: "Automated scraper runs at 3AM UTC. Hits YouTube API, enriches video and channel data, scores everything.",
                color: COLORS.orange,
              },
              {
                num: "03",
                title: "Find opportunity",
                body: "Keywords ranked by D/S ratio and revenue estimate. Starred ones surface first. Collect any time manually.",
                color: COLORS.amber,
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center text-center px-8 relative z-10"
              >
                <div
                  className="font-display font-extrabold mb-5 w-14 h-14 rounded-full flex items-center justify-center text-sm"
                  style={{
                    color: step.color,
                    background: COLORS.bg,
                    border: `2px solid ${step.color}`,
                  }}
                >
                  {step.num}
                </div>
                <div className="font-display font-bold text-base mb-2" style={{ color: COLORS.textPrimary }}>
                  {step.title}
                </div>
                <div className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
                  {step.body}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          className="text-center py-10 text-sm"
          style={{ color: COLORS.textDim, borderTop: `1px solid ${COLORS.borderSubtle}` }}
        >
          A{" "}
          <a href="https://www.1000problems.com" style={{ color: COLORS.textMuted }}>
            1000Problems
          </a>
          {" "}project ·{" "}
          <a href="/dashboard" style={{ color: COLORS.textMuted }}>Dashboard</a>
          {" "}·{" "}
          <a
            href="https://github.com/1000Problems/ytcombinator"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: COLORS.textMuted }}
          >
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
