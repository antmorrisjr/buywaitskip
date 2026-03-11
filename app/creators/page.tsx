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

type Creator = {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  subscriber_count: number;
  genre_tags: string[];
  youtube_channel_id: string;
  review_count: number;
};

function formatSubs(count: number) {
  if (!count) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
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
    async function fetchCreators() {
      const { data: creatorsData } = await supabase
        .from("creators")
        .select("id, name, handle, avatar_url, subscriber_count, genre_tags, youtube_channel_id")
        .eq("is_media", false);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("creator_id");

      if (!creatorsData) return;

      const reviewCounts: Record<string, number> = {};
      reviews?.forEach((r: any) => {
        reviewCounts[r.creator_id] = (reviewCounts[r.creator_id] || 0) + 1;
      });

      const withCounts = creatorsData
        .map((c: any) => ({ ...c, review_count: reviewCounts[c.id] || 0 }))
        .filter((c: any) => c.review_count > 0)
        .sort((a: any, b: any) => b.review_count - a.review_count);

      setCreators(withCounts);
      setLoading(false);
    }
    fetchCreators();
  }, []);

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
            <a href="/new-releases" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
            >New Releases</a>
            <a href="/creators" style={{ color: GREEN, textDecoration: "none", fontWeight: 500, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>Creators</a>
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
                style={{ display: "block", color: link.href === "/creators" ? GREEN : "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 8px", textDecoration: "none", borderRadius: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >{link.label}</a>
            ))}
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Trusted Voices</p>
          <h1 style={{ color: "white", fontSize: 42, fontWeight: "bold", margin: "0 0 12px" }}>Our Creators</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>The YouTubers whose opinions power our verdicts.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading creators...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {creators.map(creator => (
              <a
                key={creator.id}
                href={`/creators/${creator.handle?.replace("@", "") || creator.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.name}
                        referrerPolicy="no-referrer"
                        style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
                      />
                    ) : (
                      <div style={{ width: 120, height: 120, borderRadius: "50%", backgroundColor: `hsl(${creator.name.charCodeAt(0) * 137 % 360}, 50%, 25%)`, border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: "bold", color: `hsl(${creator.name.charCodeAt(0) * 137 % 360}, 70%, 70%)` }}>
                        {creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ color: "white", fontWeight: "bold", fontSize: 22, margin: "12px 0 4px" }}>{creator.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 16px" }}>{creator.handle}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, width: "100%" }}>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", backgroundColor: "rgba(0,230,118,0.08)", borderRadius: 8 }}>
                        <p style={{ color: GREEN, fontSize: 18, fontWeight: "bold", margin: 0 }}>{creator.review_count}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Reviews</p>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", backgroundColor: "rgba(255,215,64,0.08)", borderRadius: 8 }}>
                        <p style={{ color: GOLD, fontSize: 18, fontWeight: "bold", margin: 0 }}>{formatSubs(creator.subscriber_count)}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Subs</p>
                      </div>
                    </div>
                    {creator.genre_tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                        {creator.genre_tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", backgroundColor: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 20 }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}