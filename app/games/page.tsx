"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BG = "#0A0A12";
const GREEN = "#00E676";
const GOLD = "#FFD740";
const RED = "#FF5252";
const SURFACE = "#13131F";
const BORDER = "#1E1E2E";

type SortOption = "buy-pct-desc" | "buy-pct-asc" | "name-asc" | "name-desc" | "reviews-desc" | "newest" | "verdict";

interface Game {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  release_date: string | null;
  genres: string[] | null;
  verdict: string | null;
  buyPct: number;
  waitPct: number;
  skipPct: number;
  reviewCount: number;
}

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (!verdict) return (
    <span style={{ fontSize: 10, letterSpacing: 2, color: "#555", fontFamily: "monospace", fontWeight: 700 }}>
      NO DATA
    </span>
  );
  const color = verdict === "BUY" ? GREEN : verdict === "WAIT" ? GOLD : RED;
  return (
    <span style={{
      background: color,
      color: "#000",
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 2,
      padding: "3px 10px",
      fontFamily: "monospace",
    }}>
      {verdict}
    </span>
  );
}

function MiniBar({ buyPct, waitPct, skipPct }: { buyPct: number; waitPct: number; skipPct: number }) {
  return (
    <div style={{ display: "flex", height: 4, width: "100%", borderRadius: 2, overflow: "hidden", gap: 1 }}>
      <div style={{ width: `${buyPct}%`, background: GREEN, transition: "width 0.4s ease" }} />
      <div style={{ width: `${waitPct}%`, background: GOLD, transition: "width 0.4s ease" }} />
      <div style={{ width: `${skipPct}%`, background: RED, transition: "width 0.4s ease" }} />
    </div>
  );
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "buy-pct-desc", label: "Most Recommended" },
  { value: "buy-pct-asc", label: "Least Recommended" },
  { value: "verdict", label: "Verdict" },
  { value: "reviews-desc", label: "Most Reviews" },
  { value: "newest", label: "Newest First" },
  { value: "name-asc", label: "A → Z" },
  { value: "name-desc", label: "Z → A" },
];

const VERDICT_OPTIONS = ["ALL", "BUY", "WAIT", "SKIP"];

export default function AllGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("buy-pct-desc");
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // isMobile state — replaces broken Tailwind md: classes
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: gamesData } = await supabase
        .from("games")
        .select("id, title, slug, cover_url, release_date, genres")
        .neq("status", "upcoming")
        .order("title");

      if (!gamesData) return;

      const { data: reviews } = await supabase
        .from("reviews")
        .select("game_id, verdict, creator_id")
        .not("verdict", "is", null);

      const { data: mediaCreators } = await supabase
        .from("creators")
        .select("id")
        .eq("is_media", true);

      const mediaIds = new Set((mediaCreators || []).map(c => c.id));

      const reviewMap: Record<string, { buy: number; wait: number; skip: number; total: number }> = {};

      for (const r of reviews || []) {
        if (mediaIds.has(r.creator_id)) continue;
        if (!reviewMap[r.game_id]) reviewMap[r.game_id] = { buy: 0, wait: 0, skip: 0, total: 0 };
        reviewMap[r.game_id].total++;
        if (r.verdict === "BUY") reviewMap[r.game_id].buy++;
        else if (r.verdict === "WAIT") reviewMap[r.game_id].wait++;
        else if (r.verdict === "SKIP") reviewMap[r.game_id].skip++;
      }

      const enriched: Game[] = gamesData.map(g => {
        const rm = reviewMap[g.id] || { buy: 0, wait: 0, skip: 0, total: 0 };
        const total = rm.total || 1;
        const buyPct = Math.round((rm.buy / total) * 100);
        const waitPct = Math.round((rm.wait / total) * 100);
        const skipPct = Math.round((rm.skip / total) * 100);
        let verdict: string | null = null;
        if (rm.total > 0) {
          if (buyPct >= 60) verdict = "BUY";
          else if (skipPct >= 50) verdict = "SKIP";
          else verdict = "WAIT";
        }
        return { ...g, buyPct, waitPct, skipPct, reviewCount: rm.total, verdict };
      });

      setGames(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...games];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g => g.title.toLowerCase().includes(q));
    }

    if (verdictFilter !== "ALL") {
      list = list.filter(g => g.verdict === verdictFilter);
    }

    list.sort((a, b) => {
      switch (sort) {
        case "buy-pct-desc": return b.buyPct - a.buyPct;
        case "buy-pct-asc": return a.buyPct - b.buyPct;
        case "reviews-desc": return b.reviewCount - a.reviewCount;
        case "name-asc": return a.title.localeCompare(b.title);
        case "name-desc": return b.title.localeCompare(a.title);
        case "newest": return new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime();
        case "verdict": {
          const order = { BUY: 0, WAIT: 1, SKIP: 2 };
          return (order[a.verdict as keyof typeof order] ?? 3) - (order[b.verdict as keyof typeof order] ?? 3);
        }
        default: return 0;
      }
    });

    return list;
  }, [games, sort, verdictFilter, search]);

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff" }}>
      
      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(10,10,18,0.95)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 16px" }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: GREEN, display: "block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: GOLD, display: "block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: RED, display: "block" }} />
              </div>
              <span style={{ color: "white", fontWeight: "bold", letterSpacing: "0.15em", fontSize: 16 }}>BUYWAITSKIP</span>
            </div>
          </a>

          {/* Desktop nav links */}
          <div style={{ display: isMobile ? "none" : "flex", alignItems: "center", gap: 32 }}>
            <a href="/trending" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
            >Trending</a>
            <a href="/new-releases" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
            >New Releases</a>
            <a href="/creators" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
            >Creators</a>
            <a href="/games" style={{ color: GREEN, textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>All Games</a>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: isMobile ? "flex" : "none",
              flexDirection: "column",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <span style={{ display: "block", width: 22, height: 2, backgroundColor: "white", borderRadius: 2, transition: "transform 0.2s", transformOrigin: "center", transform: menuOpen ? "rotate(45deg) translate(2px, 3px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, backgroundColor: "white", borderRadius: 2, transition: "opacity 0.2s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 2, backgroundColor: "white", borderRadius: 2, transition: "transform 0.2s", transformOrigin: "center", transform: menuOpen ? "rotate(-45deg) translate(2px, -3px)" : "none" }} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && isMobile && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(10,10,18,0.98)", padding: "16px" }}>
            {[
              { label: "Trending", href: "/trending" },
              { label: "New Releases", href: "/new-releases" },
              { label: "Creators", href: "/creators" },
              { label: "All Games", href: "/games" },
            ].map(link => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                style={{ display: "block", color: link.href === "/games" ? GREEN : "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 8px", textDecoration: "none", borderRadius: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >{link.label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* Page Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "24px 32px" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, margin: 0, lineHeight: 1 }}>
          ALL GAMES
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#666", marginTop: 4 }}>
          {loading ? "Loading..." : `${filtered.length} games · Creator verdicts only`}
        </p>
      </div>

      {/* Controls */}
      <div style={{
        padding: "16px 32px",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        background: SURFACE,
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search games..."
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            color: "#fff",
            padding: "8px 14px",
            fontSize: 13,
            outline: "none",
            borderRadius: 2,
            width: 200,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          style={{
            background: BG,
            border: `1px solid ${BORDER}`,
            color: "#fff",
            padding: "8px 14px",
            fontSize: 13,
            outline: "none",
            borderRadius: 2,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 4 }}>
          {VERDICT_OPTIONS.map(v => {
            const active = verdictFilter === v;
            const color = v === "BUY" ? GREEN : v === "WAIT" ? GOLD : v === "SKIP" ? RED : "#fff";
            return (
              <button
                key={v}
                onClick={() => setVerdictFilter(v)}
                style={{
                  background: active ? color : "transparent",
                  border: `1px solid ${active ? color : BORDER}`,
                  color: active ? "#000" : color === "#fff" ? "#888" : color,
                  padding: "7px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  borderRadius: 2,
                  transition: "all 0.15s ease",
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* Games Grid */}
      <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: 80, fontSize: 14, letterSpacing: 2 }}>
            LOADING GAMES...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: 80, fontSize: 14, letterSpacing: 2 }}>
            NO GAMES FOUND
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}>
            {filtered.map(game => (
              <Link key={game.id} href={`/game/${game.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    overflow: "hidden",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                    cursor: "pointer",
                    borderRadius: 2,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    const verdictColor = game.verdict === "BUY" ? GREEN : game.verdict === "WAIT" ? GOLD : RED;
                    (e.currentTarget as HTMLDivElement).style.borderColor = game.verdict ? verdictColor : "#333";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "2/3", background: "#0D0D1A", overflow: "hidden" }}>
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, color: "#333", letterSpacing: 2 }}>NO IMAGE</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <VerdictBadge verdict={game.verdict} />
                    </div>
                  </div>

                  <div style={{ padding: "12px 12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 8, color: "#eee" }}>
                      {game.title}
                    </div>
                    <MiniBar buyPct={game.buyPct} waitPct={game.waitPct} skipPct={game.skipPct} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#555" }}>
                      <span style={{ color: GREEN }}>{game.buyPct}% BUY</span>
                      <span>{game.reviewCount} reviews</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}