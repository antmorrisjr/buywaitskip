require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeTranscript(transcript, gameTitle, creatorName) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are analyzing a YouTube video review from a gaming creator reviewing "${gameTitle}".

Creator: ${creatorName}

Review content:
${transcript}

Based on this review, provide a JSON response with:
{
  "verdict": "BUY" or "WAIT" or "SKIP",
  "sentiment_score": a decimal number between 0.00 and 1.00 (1.00 = most positive),
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "creator_quote": "one compelling 1-2 sentence quote summarizing their opinion",
  "sponsored": true or false
}

Only respond with valid JSON, nothing else.`
      }
    ]
  });

  const rawText = message.content[0].text;
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function processGameReviews(game) {
  console.log(`Processing reviews for: ${game.title}`);

  const mockReviews = [
    {
      creator_name: 'Skill Up',
      video_id: 'expedition33_skillup_001',
      video_url: 'https://youtube.com/watch?v=expedition33_skillup',
      transcript: `I don't say this lightly — Clair Obscur Expedition 33 is one of the greatest RPGs 
      I have ever played. This is a small French indie studio that somehow made a game that feels like 
      Final Fantasy at its absolute peak. The story wrecked me emotionally. I was not prepared for where 
      it goes. The combat system is genius — turn based but with real time dodge and parry mechanics 
      that keep you completely engaged in every single fight. The art direction is breathtaking. 
      The music is some of the best I've heard in any game ever. Gustave, Maelle, Lune — these characters 
      will stay with me forever. This is an absolute must buy, no questions asked. 
      If you skip this game you are genuinely doing yourself a disservice. 
      Game of the year and it's not even close for me.`
    },
    {
      creator_name: 'ACG',
      video_id: 'expedition33_acg_001',
      video_url: 'https://youtube.com/watch?v=expedition33_acg',
      transcript: `Buy it. That's the review. Okay fine I'll elaborate. Clair Obscur Expedition 33 
      is a masterpiece of the RPG genre from a team of 30 developers that somehow out-Final Fantasy'd 
      Final Fantasy. The combat is innovative and satisfying, blending turn based strategy with 
      real time parry mechanics that never get old. The story is emotional, mature, and full of 
      genuine surprises that I will not spoil. Voice acting is some of the best in any game I've played. 
      The world design is gorgeous and the music is hauntingly beautiful. 
      My only minor complaint is some pacing issues in the second act and occasional camera problems 
      in combat. But these are tiny nitpicks in what is otherwise a flawless experience. 
      This is a day one buy for any RPG fan. Don't wait, don't look up spoilers, just play it.`
    },
    {
      creator_name: 'Luke Stephens',
      video_id: 'expedition33_luke_001',
      video_url: 'https://youtube.com/watch?v=expedition33_luke',
      transcript: `Expedition 33 made me feel things I haven't felt playing a game in years. 
      The French studio Sandfall Interactive made this on a budget of less than 10 million dollars 
      and it puts 200 million dollar AAA games to shame. The combat system is the most satisfying 
      I've played in an RPG — the parry and dodge mechanics make every battle feel like a dance. 
      The story deals with grief and mortality in a way that felt deeply personal to me. 
      I cried twice. The art style is unlike anything else in gaming. 
      Six million copies sold and every single one of those people made the right call. 
      This is not just game of the year — this is one of the greatest games ever made. 
      Absolute essential purchase for anyone who loves RPGs, story driven games, or just great games.`
    }
  ];

  for (const review of mockReviews) {
    console.log(`\nAnalyzing review from ${review.creator_name}...`);
    
    try {
      const analysis = await analyzeTranscript(review.transcript, game.title, review.creator_name);
      console.log(`Verdict: ${analysis.verdict} (sentiment: ${analysis.sentiment_score})`);
      console.log(`Quote: ${analysis.creator_quote}`);

      let { data: creator } = await supabase
        .from('creators')
        .select('*')
        .eq('name', review.creator_name)
        .single();

      if (!creator) {
        const { data: newCreator, error: creatorError } = await supabase
          .from('creators')
          .insert({ name: review.creator_name, youtube_channel_id: review.video_url })
          .select()
          .single();
        
        if (creatorError) {
          console.error(`Creator insert error:`, creatorError.message);
          continue;
        }
        creator = newCreator;
      }

      const { error: reviewError } = await supabase.from('reviews').insert({
        game_id: game.id,
        creator_id: creator.id,
        youtube_video_id: review.video_id,
        video_url: review.video_url,
        verdict: analysis.verdict,
        sentiment_score: analysis.sentiment_score,
        pros: analysis.pros,
        cons: analysis.cons,
        creator_quote: analysis.creator_quote,
        is_sponsored: analysis.sponsored,
      });

      if (reviewError) {
        console.error(`Review insert error:`, reviewError.message);
      } else {
        console.log(`Saved review from ${review.creator_name}`);
      }

    } catch (err) {
      console.error(`Error processing ${review.creator_name}:`, err.message);
    }
  }

  console.log('\nAll reviews processed! Calculating final verdict...');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('verdict, sentiment_score')
    .eq('game_id', game.id);

  if (!reviews || reviews.length === 0) {
    console.log('No reviews found to calculate verdict.');
    return;
  }

  const counts = { BUY: 0, WAIT: 0, SKIP: 0 };
  reviews.forEach(r => counts[r.verdict]++);
  const total = reviews.length;

  console.log(`\nFinal Verdict for ${game.title}:`);
  console.log(`BUY: ${Math.round((counts.BUY / total) * 100)}%`);
  console.log(`WAIT: ${Math.round((counts.WAIT / total) * 100)}%`);
  console.log(`SKIP: ${Math.round((counts.SKIP / total) * 100)}%`);
  console.log('\nDone!');
}

async function run() {
  try {
    console.log('Connecting to Supabase...');
    console.log('Adding Clair Obscur: Expedition 33 to database...');

    const { data: game, error } = await supabase
      .from('games')
      .insert({
        title: 'Clair Obscur: Expedition 33',
        slug: 'expedition-33',
        developer: 'Sandfall Interactive',
        platforms: ['PC', 'PS5', 'Xbox Series X/S'],
        genres: ['RPG', 'Turn-Based', 'Story-Rich'],
        release_date: '2025-04-24',
      })
      .select()
      .single();

    if (error && error.code !== '23505') {
      console.error('Error adding game:', error);
      return;
    }

    let gameToProcess = game;
    if (!game) {
      console.log('Game already exists, fetching...');
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('slug', 'expedition-33')
        .single();
      gameToProcess = data;
    }

    console.log('Game ready:', gameToProcess.title);
    console.log('\nStarting review processing...\n');

    await processGameReviews(gameToProcess);

  } catch (error) {
    console.error('FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

run();