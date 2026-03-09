import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateDescription(title, genres, developer, releaseYear) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Write a 2-3 sentence description for the video game "${title}" by ${developer || "unknown developer"}, released in ${releaseYear || "recent years"}, genres: ${genres?.join(", ") || "unknown"}.

Write it like a game store description — factual, engaging, no spoilers. Do NOT start with the game title. Do NOT use marketing fluff like "embark on an epic journey". Just describe what kind of game it is and what makes it notable. Return only the description, nothing else.`
      }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || null;
}

async function main() {
  const { data: games, error } = await supabase
    .from("games")
    .select("id, title, genres, developer, release_date")
    .or("description.is.null,description.eq.''");

  if (error) { console.error(error); return; }
  console.log(`Found ${games.length} games missing descriptions\n`);

  let updated = 0;
  for (const game of games) {
    const year = game.release_date ? new Date(game.release_date).getFullYear() : null;
    process.stdout.write(`📝 ${game.title}... `);

    const description = await generateDescription(game.title, game.genres, game.developer, year);
    if (!description) { console.log("❌ failed"); continue; }

    const { error: updateError } = await supabase
      .from("games")
      .update({ description })
      .eq("id", game.id);

    if (updateError) {
      console.log(`❌ ${updateError.message}`);
    } else {
      console.log(`✅`);
      updated++;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! Updated ${updated} games.`);
}

main().catch(console.error);
