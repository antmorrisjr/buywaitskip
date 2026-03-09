import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ─── CLIENTS ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── TRANSCRIPT ──────────────────────────────────────────────────────────────
async function fetchTranscript(videoId) {
  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`,
      { headers: { "x-api-key": process.env.SUPADATA_API_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.content) return null;
    const text = Array.isArray(data.content)
      ? data.content.map(s => s.text).join(" ")
      : data.content;
    return text.slice(0, 8000);
  } catch {
    return null;
  }
}

// ─── CLAUDE ANALYSIS ─────────────────────────────────────────────────────────
async function analyzeReview(transcript, videoTitle, gameTitle, channelTitle) {
  const prompt = `You are analyzing a YouTube video review of the game "${gameTitle}".

Video title: "${videoTitle}"
Channel: "${channelTitle}"

Transcript excerpt:
${transcript}

Based on this review, provide:
1. A confidence score (0-100)
2. A 2-3 sentence summary of the reviewer's opinion
3. Up to 3 pros mentioned
4. Up to 3 cons mentioned
5. Sentiment score (-100 to +100)

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "confidence": 85,
  "summary": "...",
  "pros": ["...", "...", "..."],
  "cons": ["...", "...", "..."],
  "sentiment_score": 75
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── MAIN BACKFILL ───────────────────────────────────────────────────────────
async function runBackfill() {
  console.log("🔄 BuyWaitSkip — Backfilling missing summaries\n");

  // Get all reviews missing summary, join with games and creators
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(`
      id,
      youtube_video_id,
      video_title,
      verdict,
      games (title),
      creators (name)
    `)
    .is("summary", null)
    .order("id");

  if (error) {
    console.log("❌ Could not fetch reviews:", error.message);
    return;
  }

  console.log(`📋 ${reviews.length} reviews need backfilling\n`);

  let updated = 0, failed = 0;

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    const gameTitle = review.games?.title || "Unknown Game";
    const creatorName = review.creators?.name || "Unknown Creator";

    console.log(`[${i + 1}/${reviews.length}] ${creatorName} — ${gameTitle}`);

    // Fetch transcript
    const transcript = await fetchTranscript(review.youtube_video_id);
    if (!transcript) {
      console.log(`  ⚠️  No transcript, skipping`);
      failed++;
      continue;
    }

    // Analyze
    try {
      const analysis = await analyzeReview(
        transcript,
        review.video_title,
        gameTitle,
        creatorName
      );

      const { error: updateError } = await supabase
        .from("reviews")
        .update({
          summary: analysis.summary,
          pros: analysis.pros,
          cons: analysis.cons,
          confidence_score: Math.min(100, Math.max(0, Math.round(analysis.confidence))),
          sentiment_score: Math.min(100, Math.max(-100, Math.round(analysis.sentiment_score))),
        })
        .eq("id", review.id);

      if (updateError) {
        console.log(`  ❌ DB error: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Updated — ${analysis.summary.slice(0, 80)}...`);
        updated++;
      }
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Backfill complete`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed:  ${failed}`);
  console.log("=".repeat(50));
}

runBackfill().catch(console.error);
