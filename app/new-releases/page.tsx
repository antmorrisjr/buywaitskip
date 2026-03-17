"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BG = "#0A0A12";
const GREEN = "#00E676";
const GOLD = "#FFD740";
const RED = "#FF5252";

const steamHeroImages: Record<string, string> = {
  "elden-ring": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg",
  "baldurs-gate-3": "https://m.media-amazon.com/images/M/MV5BN2I0N2Y3MWUtNjJiNy00NjRjLWE4ZTctOTQ2YWVhM2VhMTM4XkEyXkFqcGc@._V1_.jpg",
  "cyberpunk-2077": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg",
  "god-of-war-ragnarok": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2322010/library_hero.jpg",
  "hades": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_hero.jpg",
  "hollow-knight": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_hero.jpg",
  "red-dead-redemption-2": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp",
  "helldivers-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/553850/library_hero.jpg",
  "black-myth-wukong": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaftpVL32ouEwZLRcznmytgVXiHbiM9xo3bYv15-_SdbsOssKt",
  "metaphor-refantazio": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2679460/library_hero.jpg",
  "astro-bot": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTwHe6_x4vYPrJGdVJaq3uKIvDbRAwrgb1D2O38-rsNXRKvqcEz",
  "ff7-rebirth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2909400/library_hero.jpg",
  "like-a-dragon-infinite-wealth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2375570/library_hero.jpg",
  "prince-of-persia-lost-crown": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2165300/library_hero.jpg",
  "tekken-8": "https://images.igdb.com/igdb/image/upload/t_cover_big/co7lbb.webp",
  "dragons-dogma-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2054970/library_hero.jpg",
  "starfield": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1716740/library_hero.jpg",
  "suicide-squad": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/315210/library_hero.jpg",
  "concord": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2443720/library_hero.jpg",
  "avowed": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2457220/header.jpg",
  "monster-hunter-wilds": "https://static0.polygonimages.com/wordpress/wp-content/uploads/sharedimages/2025/02/monster-hunter-wilds-tag-page-cover-art.jpg?w=1200&h=1200&fit=crop",
  "resident-evil-requiem": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/library_hero.jpg",
  "stellar-blade": "https://preview.redd.it/stellar-blade-logoless-key-art-v0-zaw0l9fqwcic1.jpeg?auto=webp&s=40836c34a4b02d5b5dddb9aee90a90d71b0d4c93",
};

type Game = {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  genres: string[];
  release_date: string;
  buy: number;
  wait: number;
  skip: number;
  total: number;
};

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function NewReleasesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: gamesData } = await supabase
        .from("games")
        .select("id, title, slug, cover_url, genres, release_date")
        .eq("status", "released")
        .order("release_date", { ascending: false })
        .limit(50);

        let reviews: any[] = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        while (true) {
          const { data: batch } = await supabase
            .from("reviews")
            .select("game_id, verdict, creators!inner(is_media)")
            .eq("creators.is_media", false)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          reviews = [...reviews, ...batch];
          if (batch.length < PAGE_SIZE) break;
          page++;
        }

      if (!gamesData || !reviews) return;

      const counts: Record<string, { buy: number; wait: number; skip: number; total: number }> = {};
      reviews.forEach((r: any) => {
        if (!counts[r.game_id]) counts[r.game_id] = { buy: 0, wait: 0, skip: 0, total: 0 };
        counts[r.game_id].total++;
        if (r.verdict === "BUY") counts[r.game_id].buy++;
        if (r.verdict === "WAIT") counts[r.game_id].wait++;
        if (r.verdict === "SKIP") counts[r.game_id].skip++;
      });

      const withVerdicts = gamesData
        .slice(0, 25)
        .map((g: any) => {
          const c = counts[g.id] || { buy: 0, wait: 0, skip: 0, total: 0 };
          return {
            ...g,
            buy: c.total ? Math.round((c.buy / c.total) * 100) : 0,
            wait: c.total ? Math.round((c.wait / c.total) * 100) : 0,
            skip: c.total ? Math.round((c.skip / c.total) * 100) : 0,
            total: c.total,
          };
        });

      setGames(withVerdicts);
      setLoading(false);
    }
    fetchData();
  }, []);

  const getVerdict = (game: Game) => {
    if (game.total === 0) return { label: "NEW", color: "rgba(255,255,255,0.5)" };
    if (game.buy >= 60) return { label: "BUY", color: GREEN };
    if (game.skip >= 50) return { label: "SKIP", color: RED };
    return { label: "WAIT", color: GOLD };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>

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
            <a href="/new-releases" style={{ color: GREEN, textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>New Releases</a>
            <a href="/creators" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
            >Creators</a>
            <a href="/games" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
            >All Games</a>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: isMobile ? "flex" : "none", flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 8 }}
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
                style={{ display: "block", color: link.href === "/new-releases" ? GREEN : "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 8px", textDecoration: "none", borderRadius: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >{link.label}</a>
            ))}
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Just Dropped</p>
          <h1 style={{ color: "white", fontSize: 42, fontWeight: "bold", margin: "0 0 12px" }}>New Releases</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>The 25 most recently released games with verdicts from our trusted creators.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
          </div>
        ) : (
          <div className="games-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {games.map((game) => {
              const image = steamHeroImages[game.slug] || game.cover_url;
              const verdict = getVerdict(game);
              return (
                <a key={game.id} href={`/game/${game.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    className="game-card"
                    style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", cursor: "pointer", aspectRatio: "3/4", transition: "transform 0.2s, border-color 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${verdict.color}66`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    {image ? (
                      <img src={image} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,0.97) 0%, rgba(10,10,18,0.3) 55%, transparent 100%)" }} />
                    <div className="time-badge" style={{ position: "absolute", top: 8, right: 8, zIndex: 3, fontSize: 10, fontWeight: "bold", color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", padding: "2px 7px", borderRadius: 20 }}>
                      {timeAgo(game.release_date)}
                    </div>
                    <div className="card-content" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", color: verdict.color, background: `${verdict.color}18`, border: `1px solid ${verdict.color}44`, padding: "3px 8px", borderRadius: 4, marginBottom: 6 }}>
                        {verdict.label}
                      </div>
                      <p className="card-title" style={{ color: "white", fontSize: 14, fontWeight: "bold", lineHeight: 1.2, marginBottom: 4 }}>{game.title}</p>
                      <p className="card-genre" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>{game.genres?.slice(0, 2).join(" · ")}</p>
                      {game.total > 0 ? (
                        <div style={{ display: "flex", gap: 6, fontSize: 11, fontWeight: "bold" }}>
                          <span style={{ color: GREEN }}>{game.buy}%</span>
                          <span style={{ color: GOLD }}>{game.wait}%</span>
                          <span style={{ color: RED }}>{game.skip}%</span>
                          <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{game.total}</span>
                        </div>
                      ) : (
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>No reviews yet</p>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .games-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .card-content { padding: 10px !important; }
          .card-title { font-size: 12px !important; }
          .card-genre { display: none !important; }
          .time-badge { font-size: 9px !important; padding: 2px 5px !important; }
        }
      `}</style>
    </div>
  );
}