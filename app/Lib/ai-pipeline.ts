// AI Pipeline - Processes game reviews end-to-end

import { createClient } from '@supabase/supabase-js';
import { searchGameReviews, getTranscript, getChannelStats } from './youtube-integration';
import { analyzeTranscript } from './ai-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GameToProcess {
  id: string;
  title: string;
  slug: string;
}

export async function processGameReviews(game: GameToProcess) {
  console.log(`\n🎮 Processing: ${game.title}`);

  // Step 1: Search YouTube
  console.log('📺 Searching YouTube...');
  const videos = await searchGameReviews(game.title, 50);
  
  const reviewVideos = videos.filter(video => {
    const title = video.title.toLowerCase();
    return title.includes('review') || title.includes('worth it');
  });

  console.log(`Found ${reviewVideos.length} review videos`);

  // Step 2: Process each video
  let successCount = 0;

  for (const video of reviewVideos.slice(0, 30)) {
    try {
      console.log(`\n  Processing: ${video.title}`);

      // Check if already processed
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('youtube_video_id', video.videoId)
        .single();

      if (existing) {
        console.log('  ⏭️  Already processed');
        continue;
      }

      // Get or create creator
      const creator = await getOrCreateCreator(video.channelId, video.channelTitle);

      // Get transcript
      console.log('  📝 Getting transcript...');
      const transcript = await getTranscript(video.videoId);

      if (transcript.length < 100) {
        console.log('  ⚠️  Transcript too short');
        continue;
      }

      // Analyze with Claude
      console.log('  🤖 Analyzing...');
      const analysis = await analyzeTranscript(transcript, video.title, game.title);

      // Save to database
      await supabase.from('reviews').insert({
        game_id: game.id,
        creator_id: creator.id,
        youtube_video_id: video.videoId,
        video_title: video.title,
        video_url: `https://youtube.com/watch?v=${video.videoId}`,
        verdict: analysis.verdict,
        sentiment_score: analysis.sentimentScore,
        pros: analysis.pros,
        cons: analysis.cons,
        creator_quote: analysis.creatorQuote,
        is_sponsored: analysis.isSponsored,
        sponsorship_confidence: analysis.sponsorshipConfidence,
        ai_analyzed: true,
        published_at: video.publishedAt,
      });

      console.log(`  ✅ ${analysis.verdict}`);
      successCount++;

      // Wait 2 seconds between videos
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  // Step 3: Calculate verdict
  console.log('\n📊 Calculating verdict...');
  await calculateVerdict(game.id);

  console.log(`\n✨ Done! Processed ${successCount} reviews`);
}

async function getOrCreateCreator(channelId: string, channelTitle: string) {
  const { data: existing } = await supabase
    .from('creators')
    .select('*')
    .eq('youtube_channel_id', channelId)
    .single();

  if (existing) return existing;

  const channelStats = await getChannelStats(channelId);

  const { data: newCreator } = await supabase
    .from('creators')
    .insert({
      youtube_channel_id: channelId,
      name: channelStats.channelTitle || channelTitle,
      handle: channelStats.customUrl,
      subscriber_count: channelStats.subscriberCount,
      is_trusted: true,
    })
    .select()
    .single();

  return newCreator;
}

async function calculateVerdict(gameId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('verdict, is_sponsored')
    .eq('game_id', gameId);

  if (!reviews || reviews.length === 0) return;

  const buyCount = reviews.filter(r => r.verdict === 'BUY').length;
  const waitCount = reviews.filter(r => r.verdict === 'WAIT').length;
  const skipCount = reviews.filter(r => r.verdict === 'SKIP').length;
  const totalReviews = reviews.length;

  const unsponsoredReviews = reviews.filter(r => !r.is_sponsored);
  const buyCountUnsponsored = unsponsoredReviews.filter(r => r.verdict === 'BUY').length;
  const waitCountUnsponsored = unsponsoredReviews.filter(r => r.verdict === 'WAIT').length;
  const skipCountUnsponsored = unsponsoredReviews.filter(r => r.verdict === 'SKIP').length;

  const buyPercent = Math.round((buyCount / totalReviews) * 100);
  const waitPercent = Math.round((waitCount / totalReviews) * 100);
  const skipPercent = Math.round((skipCount / totalReviews) * 100);

  let finalVerdict: 'BUY' | 'WAIT' | 'SKIP' | 'PENDING' = 'PENDING';
  if (totalReviews >= 10) {
    if (buyPercent >= 70) finalVerdict = 'BUY';
    else if (waitPercent >= 40) finalVerdict = 'WAIT';
    else finalVerdict = 'WAIT';
  }

  let confidenceLevel = totalReviews >= 20 ? 'HIGH' : totalReviews >= 10 ? 'MODERATE' : 'LIMITED';

  await supabase.from('verdicts').upsert({
    game_id: gameId,
    buy_count: buyCount,
    wait_count: waitCount,
    skip_count: skipCount,
    total_reviews: totalReviews,
    buy_percent: buyPercent,
    wait_percent: waitPercent,
    skip_percent: skipPercent,
    final_verdict: finalVerdict,
    confidence_level: confidenceLevel,
    buy_count_unsponsored: buyCountUnsponsored,
    wait_count_unsponsored: waitCountUnsponsored,
    skip_count_unsponsored: skipCountUnsponsored,
    updated_at: new Date().toISOString(),
  });

  console.log(`Final: ${finalVerdict} (${buyPercent}% BUY, ${waitPercent}% WAIT, ${skipPercent}% SKIP)`);
}