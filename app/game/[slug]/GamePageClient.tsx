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

function getFingerprint() {
  const key = "bws_fingerprint";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, fp);
  }
  return fp;
}

function CreatorsVsMedia({
  creatorVerdict, creatorBuyPct, creatorWaitPct, creatorSkipPct, creatorTotal,
  mediaVerdict, mediaBuyPct, mediaWaitPct, mediaSkipPct, mediaTotal,
}: {
  creatorVerdict: string; creatorBuyPct: number; creatorWaitPct: number; creatorSkipPct: number; creatorTotal: number;
  mediaVerdict: string | null; mediaBuyPct: number; mediaWaitPct: number; mediaSkipPct: number; mediaTotal: number;
}) {
  const creatorColor = creatorVerdict === "BUY" ? GREEN : creatorVerdict === "WAIT" ? GOLD : RED;
  const mediaColor = mediaVerdict === "BUY" ? GREEN : mediaVerdict === "WAIT" ? GOLD : RED;
  const diverge = mediaVerdict && mediaVerdict !== creatorVerdict;

  const allCreator = [
    { label: "BUY", pct: creatorBuyPct, color: GREEN },
    { label: "WAIT", pct: creatorWaitPct, color: GOLD },
    { label: "SKIP", pct: creatorSkipPct, color: RED },
  ];
  const allMedia = [
    { label: "BUY", pct: mediaBuyPct, color: GREEN },
    { label: "WAIT", pct: mediaWaitPct, color: GOLD },
    { label: "SKIP", pct: mediaSkipPct, color: RED },
  ];
  const creatorRest = allCreator.filter(s => s.label !== creatorVerdict);
  const mediaRest = allMedia.filter(s => s.label !== mediaVerdict);

  return (
    <div style={{ marginBottom: 48 }}>

      {/* Divergence banner */}
      {diverge && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "11px 20px", borderRadius: 8, marginBottom: 16,
          background: "linear-gradient(135deg, rgba(255,215,64,0.1), rgba(255,82,82,0.06))",
          border: "1px solid rgba(255,215,64,0.35)",
        }}>
          <span style={{ fontSize: 15 }}>⚡</span>
          <span style={{ fontSize: 12, fontWeight: "bold", color: GOLD, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Critics & Creators Disagree — Creators say {creatorVerdict}, Media says {mediaVerdict}
          </span>
          <span style={{ fontSize: 15 }}>⚡</span>
        </div>
      )}

      {/* ESPN Card */}
      <div style={{
        borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.02)",
      }}>
        {/* Top split bar */}
        <div style={{ display: "flex", height: 5 }}>
          <div style={{ flex: 1, backgroundColor: creatorColor }} />
          <div style={{ width: 3, backgroundColor: "#0A0A12" }} />
          <div style={{ flex: 1, backgroundColor: mediaVerdict ? mediaColor : "rgba(255,255,255,0.08)" }} />
        </div>

        {/* MAIN SCOREBOARD ROW */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "36px 40px 28px",
        }}>
          {/* CREATOR */}
          <span style={{
            fontSize: 42, fontWeight: "900", color: "white",
            letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 1,
          }}>
            CREATOR
          </span>

          {/* BUY badge — solid filled square */}
          <span style={{
            fontSize: 32, fontWeight: "900",
            backgroundColor: creatorColor,
            color: "#0A0A12",
            padding: "6px 18px",
            borderRadius: 8,
            letterSpacing: "0.05em",
            lineHeight: 1,
            textTransform: "uppercase",
            display: "inline-block",
          }}>
            {creatorVerdict}
          </span>

          {/* VS */}
          <span style={{
            fontSize: 42, fontWeight: "900",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}>
            VS
          </span>

          {/* MEDIA verdict badge */}
          {mediaVerdict ? (
            <span style={{
              fontSize: 32, fontWeight: "900",
              backgroundColor: mediaColor,
              color: "#0A0A12",
              padding: "6px 18px",
              borderRadius: 8,
              letterSpacing: "0.05em",
              lineHeight: 1,
              textTransform: "uppercase",
              display: "inline-block",
              opacity: 0.75,
            }}>
              {mediaVerdict}
            </span>
          ) : (
            <span style={{
              fontSize: 32, fontWeight: "900",
              color: "rgba(255,255,255,0.15)",
              padding: "6px 18px",
              border: "2px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              lineHeight: 1,
              display: "inline-block",
            }}>
              —
            </span>
          )}

          {/* MEDIA */}
          <span style={{
            fontSize: 42, fontWeight: "900", color: "rgba(255,255,255,0.4)",
            letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 1,
          }}>
            MEDIA
          </span>
        </div>

        {/* SECONDARY STATS ROW */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "18px 40px",
          gap: 40,
        }}>
          {/* Creator breakdown */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {creatorTotal} reviews
            </span>
            {creatorRest.map(({ label, pct, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color, fontWeight: "bold", opacity: 0.7 }}>{label}</span>
                <div style={{ width: 60, height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, opacity: 0.5 }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{pct}%</span>
              </div>
            ))}
          </div>

          {/* Media breakdown */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "flex-end" }}>
            {mediaTotal > 0 ? (
              <>
                {mediaRest.map(({ label, pct, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color, fontWeight: "bold", opacity: 0.4 }}>{label}</span>
                    <div style={{ width: 60, height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, opacity: 0.3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{pct}%</span>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {mediaTotal} outlets
                </span>
              </>
            ) : (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>No media reviews yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function GamePageClient({ game, reviews = [] }: { game: any; reviews: any[] }) {
  const [excludeSponsored, setExcludeSponsored] = useState(false);
  const [communityVotes, setCommunityVotes] = useState({ BUY: 0, WAIT: 0, SKIP: 0 });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    async function fetchVotes() {
      const { data: votes } = await supabase
        .from("community_votes")
        .select("verdict, user_fingerprint")
        .eq("game_id", game.id);

      if (votes) {
        const counts = { BUY: 0, WAIT: 0, SKIP: 0 } as any;
        votes.forEach(v => counts[v.verdict]++);
        setCommunityVotes(counts);
        const fp = getFingerprint();
        const myVote = votes.find(v => v.user_fingerprint === fp);
        if (myVote) setUserVote(myVote.verdict);
      }
    }
    if (game?.id) fetchVotes();
  }, [game?.id]);

  async function handleVote(verdict: string) {
    if (voting || !game) return;
    setVoting(true);
    const fp = getFingerprint();

    if (userVote) {
      await supabase.from("community_votes").delete()
        .eq("game_id", game.id).eq("user_fingerprint", fp);
      setCommunityVotes(prev => ({ ...prev, [userVote]: prev[userVote as keyof typeof prev] - 1 }));
      if (userVote === verdict) { setUserVote(null); setVoting(false); return; }
    }

    await supabase.from("community_votes").insert({ game_id: game.id, verdict, user_fingerprint: fp });
    setCommunityVotes(prev => ({ ...prev, [verdict]: prev[verdict as keyof typeof prev] + 1 }));
    setUserVote(verdict);
    setVoting(false);
  }

  if (!game) {
    return (
      <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>
        Game not found.
      </div>
    );
  }

  const allFiltered = excludeSponsored ? reviews.filter((r) => !r.is_sponsored) : reviews;
  const creatorReviews = allFiltered.filter((r) => !r.creators?.is_media);
  const mediaReviews = allFiltered.filter((r) => r.creators?.is_media);

  const total = creatorReviews.length;
  const buyCount  = creatorReviews.filter((r) => r.verdict === "BUY").length;
  const waitCount = creatorReviews.filter((r) => r.verdict === "WAIT").length;
  const skipCount = creatorReviews.filter((r) => r.verdict === "SKIP").length;
  const buyPct  = total ? Math.round((buyCount  / total) * 100) : 0;
  const waitPct = total ? Math.round((waitCount / total) * 100) : 0;
  const skipPct = total ? Math.round((skipCount / total) * 100) : 0;
  const topVerdict = buyPct >= waitPct && buyPct >= skipPct ? "BUY" : waitPct >= skipPct ? "WAIT" : "SKIP";
  const topColor = topVerdict === "BUY" ? GREEN : topVerdict === "WAIT" ? GOLD : RED;

  const mediaTotal = mediaReviews.length;
  const mediaBuyPct  = mediaTotal ? Math.round((mediaReviews.filter(r => r.verdict === "BUY").length  / mediaTotal) * 100) : 0;
  const mediaWaitPct = mediaTotal ? Math.round((mediaReviews.filter(r => r.verdict === "WAIT").length / mediaTotal) * 100) : 0;
  const mediaSkipPct = mediaTotal ? Math.round((mediaReviews.filter(r => r.verdict === "SKIP").length / mediaTotal) * 100) : 0;
  const mediaTopVerdict = mediaTotal === 0 ? null : mediaBuyPct >= mediaWaitPct && mediaBuyPct >= mediaSkipPct ? "BUY" : mediaWaitPct >= mediaSkipPct ? "WAIT" : "SKIP";

  const sponsoredCount = reviews.filter((r) => r.is_sponsored).length;
  const confidence = total >= 15 ? "HIGH" : total >= 8 ? "MODERATE" : total >= 4 ? "LIMITED" : "PENDING";
  const confidenceColor = confidence === "HIGH" ? GREEN : confidence === "MODERATE" ? GOLD : RED;

  const communityTotal = communityVotes.BUY + communityVotes.WAIT + communityVotes.SKIP;
  const communityBuyPct = communityTotal ? Math.round((communityVotes.BUY / communityTotal) * 100) : 0;
  const communityWaitPct = communityTotal ? Math.round((communityVotes.WAIT / communityTotal) * 100) : 0;
  const communitySkipPct = communityTotal ? Math.round((communityVotes.SKIP / communityTotal) * 100) : 0;
  const communityTopVerdict = communityTotal === 0 ? null : communityBuyPct >= communityWaitPct && communityBuyPct >= communitySkipPct ? "BUY" : communityWaitPct >= communitySkipPct ? "WAIT" : "SKIP";
  const communityTopColor = communityTopVerdict === "BUY" ? GREEN : communityTopVerdict === "WAIT" ? GOLD : RED;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", color: "white" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-6 px-6 py-4 border-b border-white/10" style={{ backgroundColor: "rgba(10,10,18,0.95)", backdropFilter: "blur(12px)" }}>
        <a href="/" style={{ textDecoration: "none" }} className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GREEN }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RED }} />
          </div>
          <span className="text-xl font-bold tracking-widest text-white">BUYWAITSKIP</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Home</a>
          <a href="/trending" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Trending</a>
          <a href="/new-releases" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">New Releases</a>
          <a href="/creators" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Creators</a>
        </div>
        <a href="/" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>← Back to Home</a>
      </nav>

      <div style={{ padding: "48px 24px 64px", maxWidth: 1152, margin: "0 auto" }}>

        {/* HERO */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 40, marginBottom: 48, alignItems: "flex-start" }}>
          {game.cover_url ? (
            <img src={game.cover_url} alt={game.title} style={{ width: 240, height: 320, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", display: "block" }} />
          ) : (
            <div style={{ width: 240, height: 320, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
              No Image
            </div>
          )}
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>{game.developer}</p>
            <h1 style={{ fontSize: 48, fontWeight: "bold", lineHeight: 1.1, marginBottom: 12 }}>{game.title}</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
              {game.genres?.join(" · ")} · {game.release_date ? new Date(game.release_date).getFullYear() : "TBA"}
            </p>
            {game.description && (
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.7, marginBottom: 24, maxWidth: 600 }}>
                {game.description}
              </p>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, backgroundColor: `${confidenceColor}18`, border: `1px solid ${confidenceColor}40`, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: confidenceColor }} />
              <span style={{ fontSize: 12, fontWeight: "bold", color: confidenceColor, letterSpacing: "0.1em" }}>{confidence} CONFIDENCE</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>· {total} creator reviews</span>
            </div>
          </div>
        </div>

        {game.status === 'upcoming' && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", marginBottom: 24 }}>
            <span style={{ fontSize: 18 }}>🕐</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: "bold", color: "rgba(255,255,255,0.9)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Reviews Coming Soon</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>This game hasn't launched yet — check back after release</p>
            </div>
          </div>
        )}

        {/* VERDICT SQUARES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          {[
            { label: "BUY",  pct: buyPct,  count: buyCount,  color: GREEN },
            { label: "WAIT", pct: waitPct, count: waitCount, color: GOLD  },
            { label: "SKIP", pct: skipPct, count: skipCount, color: RED   },
          ].map(({ label, pct, count, color }) => (
            <div key={label} style={{
              borderRadius: 16, padding: "40px 24px", textAlign: "center",
              backgroundColor: topVerdict === label ? `${color}18` : "rgba(255,255,255,0.03)",
              border: `2px solid ${topVerdict === label ? color : "rgba(255,255,255,0.08)"}`,
            }}>
              <p style={{ fontSize: 12, fontWeight: "bold", letterSpacing: "0.2em", color, marginBottom: 12, textTransform: "uppercase" }}>{label}</p>
              <p style={{ fontSize: 64, fontWeight: "bold", color: "white", lineHeight: 1, marginBottom: 8 }}>{pct}%</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{count} creator{count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>

        {/* SPONSOR TOGGLE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 48 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sponsoredCount > 0 ? `⚠️ ${sponsoredCount} sponsored review${sponsoredCount > 1 ? "s" : ""} detected — results may be skewed` : "✓ No sponsored reviews detected"}
          </span>
          <button
            onClick={() => setExcludeSponsored(!excludeSponsored)}
            style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: "bold", cursor: "pointer", border: "none", backgroundColor: excludeSponsored ? GOLD : "rgba(255,255,255,0.1)", color: excludeSponsored ? BG : "rgba(255,255,255,0.7)" }}
          >
            {excludeSponsored ? "✓ Sponsored Hidden" : "Hide Sponsored"}
          </button>
        </div>

        {/* CREATORS VS MEDIA — ESPN style */}
        <CreatorsVsMedia
          creatorVerdict={topVerdict}
          creatorBuyPct={buyPct}
          creatorWaitPct={waitPct}
          creatorSkipPct={skipPct}
          creatorTotal={total}
          mediaVerdict={mediaTopVerdict}
          mediaBuyPct={mediaBuyPct}
          mediaWaitPct={mediaWaitPct}
          mediaSkipPct={mediaSkipPct}
          mediaTotal={mediaTotal}
        />

        {/* GAMER SCORE */}
        <div style={{ marginBottom: 48, padding: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h3 style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>🎮 Gamer Score</h3>

          {communityTotal > 0 && (
            <>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ color: communityTopColor, fontSize: 20, fontWeight: "bold" }}>{communityTopVerdict}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{communityTotal} gamer votes</span>
              </div>
              {[
                { label: "BUY", pct: communityBuyPct, count: communityVotes.BUY, color: GREEN },
                { label: "WAIT", pct: communityWaitPct, count: communityVotes.WAIT, color: GOLD },
                { label: "SKIP", pct: communitySkipPct, count: communityVotes.SKIP, color: RED },
              ].map(({ label, pct, count, color }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color, fontSize: 12, fontWeight: "bold" }}>{label}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{count} votes · {pct}%</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
            </>
          )}

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12, marginTop: communityTotal > 0 ? 16 : 0 }}>
            {userVote ? `You voted ${userVote} — click to change or deselect` : "What do YOU think?"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ label: "BUY", color: GREEN }, { label: "WAIT", color: GOLD }, { label: "SKIP", color: RED }].map(({ label, color }) => (
              <button
                key={label}
                onClick={() => handleVote(label)}
                disabled={voting}
                style={{
                  flex: 1, padding: 10, borderRadius: 8, fontWeight: "bold", fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                  backgroundColor: userVote === label ? color : "rgba(255,255,255,0.06)",
                  color: userVote === label ? BG : color,
                  border: `1px solid ${color}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CREATOR REVIEWS */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Creator Reviews ({total})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {creatorReviews.map((review) => {
              const color = review.verdict === "BUY" ? GREEN : review.verdict === "WAIT" ? GOLD : RED;
              return (
                <div key={review.id} style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {review.creators?.avatar_url ? (
                        <img src={review.creators.avatar_url} alt={review.creators.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎮</div>
                      )}
                      <div>
                        <p style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>{review.creators?.name ?? "Unknown Creator"}</p>
                        {review.is_sponsored && (
                          <span style={{ fontSize: 10, fontWeight: "bold", padding: "2px 8px", borderRadius: 4, backgroundColor: GOLD, color: BG }}>SPONSORED</span>
                        )}
                      </div>
                    </div>
                    <span style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: "bold", backgroundColor: color, color: BG, flexShrink: 0 }}>
                      {review.verdict}
                    </span>
                  </div>
                  {review.summary && (
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
                      {review.summary}
                    </p>
                  )}
                  {review.video_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>📝 AI summary ·</span>
                      <a href={review.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color, textDecoration: "none", fontWeight: 500 }}>
                        ▶ {review.video_title || "Watch video →"}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MEDIA REVIEWS */}
        {mediaTotal > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.3)" }}>
              Media Reviews ({mediaTotal})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mediaReviews.map((review) => {
                const color = review.verdict === "BUY" ? GREEN : review.verdict === "WAIT" ? GOLD : RED;
                return (
                  <div key={review.id} style={{ padding: "14px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {review.creators?.avatar_url ? (
                        <img src={review.creators.avatar_url} alt={review.creators.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", opacity: 0.6 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📰</div>
                      )}
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: "500" }}>{review.creators?.name ?? "Unknown"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {review.video_url && (
                        <a href={review.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>▶ Read</a>
                      )}
                      <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: "bold", backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
                        {review.verdict}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}