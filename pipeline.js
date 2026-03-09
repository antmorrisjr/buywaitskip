import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const YT_API_KEYS = [
    process.env.YOUTUBE_API_KEY_1,
    process.env.YOUTUBE_API_KEY_2,
    process.env.YOUTUBE_API_KEY_3,
  ];
  let currentKeyIndex = 0;
  function getYTKey() { return YT_API_KEYS[currentKeyIndex]; }
  function rotateYTKey() { currentKeyIndex = (currentKeyIndex + 1) % YT_API_KEYS.length; console.log(`Switched to YouTube API key ${currentKeyIndex + 1}`); }

// ── 1. Search YouTube for review videos ──────────────────────────────────────
async function searchYouTube(gameTitle) {
    const q = encodeURIComponent(`${gameTitle} review`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=10&relevanceLanguage=en&key=${getYTKey()}`;
    const res = await fetch(url);
    if (res.status === 403) { rotateYTKey(); return searchYouTube(gameTitle); }
    const data = await res.json();
    return (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
    }));
  }

  async function getTranscript(videoId) {
    try {
      const res = await fetch(`https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${videoId}&lang=en`, {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'youtube-transcriptor.p.rapidapi.com'
        }
      });
      const data = await res.json();
      if (!data || !data[0]?.transcription) return null;
      return data[0].transcription.map((t) => t.subtitle).join(' ');
    } catch {
      return null;
    }
  }
// ── 3. Analyze transcript with Claude ────────────────────────────────────────
async function analyzeWithClaude(gameTitle, transcript, videoTitle) {
  const prompt = `You are analyzing a YouTube gaming review to extract a verdict.

Game: "${gameTitle}"
Video Title: "${videoTitle}"
Transcript (may be auto-generated, ignore filler words):
"""
${transcript.slice(0, 8000)}
"""

Based on this review, respond with ONLY valid JSON in this exact format:
{
  "verdict": "BUY" | "WAIT" | "SKIP",
  "sentiment_score": <number 1-10>,
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "creator_quote": "<best single quote from the reviewer, max 150 chars>",
  "is_sponsored": <true|false>,
  "sponsorship_confidence": <number 0-1>
}

Rules:
- BUY = reviewer recommends buying now
- WAIT = reviewer says wait for sale/patches  
- SKIP = reviewer says avoid
- is_sponsored = true if review mentions sponsorship/gifted code/paid promotion
- Only return JSON, no other text`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
return JSON.parse(clean);
}

// ── 4. Upsert creator into creators table ─────────────────────────────────────
async function upsertCreator(channelName, channelId) {
    const { data: existing } = await supabase
      .from("creators")
      .select("id")
      .eq("youtube_channel_id", channelId)
      .single();
  
    if (existing) return existing.id;
  
    const { data: newCreator } = await supabase
      .from("creators")
      .insert({
        name: channelName,
        youtube_channel_id: channelId,
        channel_url: `https://www.youtube.com/channel/${channelId}`,
      })
      .select("id")
      .single();
  
    return newCreator?.id;
  }

// ── 5. Main pipeline ──────────────────────────────────────────────────────────
async function runPipeline() {
  console.log("🚀 Starting BuyWaitSkip pipeline...\n");

  // Get all games
  const { data: games } = await supabase
  .from("games")
  .select("id, title, slug")
  .limit(100);

const { data: existingReviews } = await supabase
  .from("reviews")
  .select("game_id");

  const reviewCounts = {};
existingReviews.forEach(r => {
  reviewCounts[r.game_id] = (reviewCounts[r.game_id] || 0) + 1;
});
const newGames = games.filter(g => (reviewCounts[g.id] || 0) < 3);

console.log(`📋 ${games.length} total games | ${newGames.length} need more reviews`);

for (const game of newGames) {
    console.log(`\n🎮 Processing: ${game.title}`);

    // Search YouTube
    const videos = await searchYouTube(game.title);
    console.log(`  Found ${videos.length} videos`);

    for (const video of videos.slice(0, 5)) { // 3 reviews per game
      console.log(`  📹 ${video.title.slice(0, 60)}...`);

      // Check if already processed
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("youtube_video_id", video.videoId)
        .single();

      if (existing) {
        console.log(`  ⏭️  Already processed, skipping`);
        continue;
      }

      // Get transcript
      const transcript = await getTranscript(video.videoId);
      if (!transcript || transcript.length < 200) {
        console.log(`  ❌ No transcript available`);
        continue;
      }
      console.log(`  ✅ Got transcript (${transcript.length} chars)`);

      // Analyze with Claude
      let analysis;
      try {
        analysis = await analyzeWithClaude(game.title, transcript, video.title);
        console.log(`  🤖 Claude verdict: ${analysis.verdict}`);
      } catch (e) {
        console.log(`  ❌ Claude analysis failed: ${e.message}`);
        continue;
      }

      // Upsert creator
      const creatorId = await upsertCreator(video.channelName, video.channelId);

      // Insert review
      const { error } = await supabase.from("reviews").insert({
        game_id: game.id,
        creator_id: creatorId,
        youtube_video_id: video.videoId,
        video_title: video.title,
        video_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        verdict: analysis.verdict,
        sentiment_score: Math.min(9, Math.max(1, Math.round(analysis.sentiment_score))),
        pros: analysis.pros,
        cons: analysis.cons,
        creator_quote: analysis.creator_quote,
        is_sponsored: analysis.is_sponsored,
        sponsorship_confidence: analysis.sponsorship_confidence,
        ai_analyzed: true,
        published_at: video.publishedAt,
      });

      if (error) {
        console.log(`  ❌ DB insert failed: ${error.message}`);
      } else {
        console.log(`  💾 Saved to database!`);
      }

      // Rate limit pause
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\n✅ Pipeline complete!");
}

runPipeline().catch(console.error);