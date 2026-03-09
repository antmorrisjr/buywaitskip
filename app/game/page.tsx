import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BG = "#0A0A12";
const GREEN = "#00E676";
const GOLD = "#FFD740";
const RED = "#FF5252";

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!game) {
    return (
      <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>
        Game not found.
      </div>
    );
  }

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, creators(name, avatar_url, youtube_channel_id, is_media)")
    .eq("game_id", game.id);

  const reviews = reviewsData ?? [];
  const total = reviews.length;
  const buyCount = reviews.filter((r) => r.verdict === "BUY").length;
  const waitCount = reviews.filter((r) => r.verdict === "WAIT").length;
  const skipCount = reviews.filter((r) => r.verdict === "SKIP").length;

  const buyPct = total ? Math.round((buyCount / total) * 100) : 0;
  const waitPct = total ? Math.round((waitCount / total) * 100) : 0;
  const skipPct = total ? Math.round((skipCount / total) * 100) : 0;

  const topVerdict =
    buyPct >= waitPct && buyPct >= skipPct ? "BUY" : waitPct >= skipPct ? "WAIT" : "SKIP";
  const topColor = topVerdict === "BUY" ? GREEN : topVerdict === "WAIT" ? GOLD : RED;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", color: "white" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(10,10,18,0.95)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: GREEN, display: "inline-block" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: GOLD, display: "inline-block" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: RED, display: "inline-block" }} />
            </div>
            <span style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "0.1em", color: "white" }}>BUYWAITSKIP</span>
          </div>
        </a>
      </nav>

      {/* Hero */}
      <div style={{ padding: "48px 24px 32px", maxWidth: "1152px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "48px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>
              {game.developer}
            </p>
            <h1 style={{ fontSize: "48px", fontWeight: "bold", lineHeight: 1.1, marginBottom: "12px" }}>
              {game.title}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "32px" }}>
              {game.genres?.join(" · ")} · {new Date(game.release_date).getFullYear()}
            </p>

            {/* Verdict Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${topColor}`, borderRadius: "12px", padding: "16px 24px", marginBottom: "32px" }}>
              <span style={{ color: topColor, fontSize: "32px", fontWeight: "bold" }}>{topVerdict}</span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Based on {total} creator reviews</span>
            </div>

            {/* Verdict Bars */}
            {[
              { label: "BUY", pct: buyPct, count: buyCount, color: GREEN },
              { label: "WAIT", pct: waitPct, count: waitCount, color: GOLD },
              { label: "SKIP", pct: skipPct, count: skipCount, color: RED },
            ].map(({ label, pct, count, color }) => (
              <div key={label} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color, fontSize: "12px", fontWeight: "bold" }}>{label}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{count} creators · {pct}%</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Reviews */}
        <div style={{ marginTop: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Creator Reviews
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reviews.map((review) => {
              const color = review.verdict === "BUY" ? GREEN : review.verdict === "WAIT" ? GOLD : RED;
              return (
                <div key={review.id} style={{ padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <p style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{review.creators?.name ?? "Unknown Creator"}</p>
                      {review.is_sponsored && (
                        <span style={{ fontSize: "10px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px", backgroundColor: GOLD, color: BG }}>SPONSORED</span>
                      )}
                    </div>
                    <span style={{ padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", backgroundColor: color, color: BG }}>{review.verdict}</span>
                  </div>
                  {review.creator_quote && (
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", fontStyle: "italic", marginBottom: "12px", paddingLeft: "12px", borderLeft: `3px solid ${color}` }}>
                      "{review.creator_quote}"
                    </p>
                  )}
                  {review.video_url && (
                    <a href={review.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color, textDecoration: "none" }}>
                      ▶ {review.video_title}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}