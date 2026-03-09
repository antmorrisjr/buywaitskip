import { createClient } from "@supabase/supabase-js";
import GamePageClient from "./GamePageClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      <div style={{ backgroundColor: "#0A0A12", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>
        Game not found.
      </div>
    );
  }

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, creators(name, avatar_url, youtube_channel_id, is_media)")
    .eq("game_id", game.id);

  return <GamePageClient game={game} reviews={reviewsData ?? []} />;
}