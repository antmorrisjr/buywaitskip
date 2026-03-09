require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const games = [
  // All-time classics
  { title: 'Elden Ring', slug: 'elden-ring', developer: 'FromSoftware', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Action RPG', 'Souls-like'], release_date: '2022-02-25', featured: true },
  { title: "Baldur's Gate 3", slug: 'baldurs-gate-3', developer: 'Larian Studios', platforms: ['PC', 'PS5'], genres: ['RPG', 'Fantasy'], release_date: '2023-08-03', featured: true },
  { title: 'Cyberpunk 2077', slug: 'cyberpunk-2077', developer: 'CD Projekt Red', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Action RPG', 'Open World'], release_date: '2020-12-10', featured: false },
  { title: 'God of War Ragnarok', slug: 'god-of-war-ragnarok', developer: 'Santa Monica Studio', platforms: ['PS5', 'PC'], genres: ['Action', 'Adventure'], release_date: '2022-11-09', featured: false },
  { title: 'Hades', slug: 'hades', developer: 'Supergiant Games', platforms: ['PC', 'PS5', 'Xbox Series X/S', 'Switch'], genres: ['Roguelike', 'Action'], release_date: '2020-09-17', featured: false },
  { title: 'Hollow Knight', slug: 'hollow-knight', developer: 'Team Cherry', platforms: ['PC', 'PS4', 'Xbox One', 'Switch'], genres: ['Metroidvania', 'Indie'], release_date: '2017-02-24', featured: false },
  { title: 'Sekiro: Shadows Die Twice', slug: 'sekiro', developer: 'FromSoftware', platforms: ['PC', 'PS4', 'Xbox One'], genres: ['Action', 'Souls-like'], release_date: '2019-03-22', featured: false },
  { title: 'Red Dead Redemption 2', slug: 'red-dead-redemption-2', developer: 'Rockstar Games', platforms: ['PC', 'PS4', 'Xbox One'], genres: ['Action', 'Open World'], release_date: '2018-10-26', featured: false },
  { title: 'The Witcher 3: Wild Hunt', slug: 'witcher-3', developer: 'CD Projekt Red', platforms: ['PC', 'PS5', 'Xbox Series X/S', 'Switch'], genres: ['RPG', 'Open World'], release_date: '2015-05-19', featured: false },
  { title: 'Dark Souls 3', slug: 'dark-souls-3', developer: 'FromSoftware', platforms: ['PC', 'PS4', 'Xbox One'], genres: ['Action RPG', 'Souls-like'], release_date: '2016-04-12', featured: false },

  // 2024-2025 big releases
  { title: 'Helldivers 2', slug: 'helldivers-2', developer: 'Arrowhead Game Studios', platforms: ['PC', 'PS5'], genres: ['Co-op Shooter', 'Action'], release_date: '2024-02-08', featured: true },
  { title: 'Black Myth: Wukong', slug: 'black-myth-wukong', developer: 'Game Science', platforms: ['PC', 'PS5'], genres: ['Action RPG', 'Souls-like'], release_date: '2024-08-20', featured: true },
  { title: 'Metaphor: ReFantazio', slug: 'metaphor-refantazio', developer: 'Atlus', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['JRPG', 'Turn-Based'], release_date: '2024-10-11', featured: false },
  { title: 'Astro Bot', slug: 'astro-bot', developer: 'Team Asobi', platforms: ['PS5'], genres: ['Platformer', 'Action'], release_date: '2024-09-06', featured: false },
  { title: 'Final Fantasy VII Rebirth', slug: 'ff7-rebirth', developer: 'Square Enix', platforms: ['PS5', 'PC'], genres: ['Action RPG', 'JRPG'], release_date: '2024-02-29', featured: false },
  { title: 'Like a Dragon: Infinite Wealth', slug: 'like-a-dragon-infinite-wealth', developer: 'Ryu Ga Gotoku Studio', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['JRPG', 'Action'], release_date: '2024-01-26', featured: false },
  { title: "Prince of Persia: The Lost Crown", slug: 'prince-of-persia-lost-crown', developer: 'Ubisoft Montpellier', platforms: ['PC', 'PS5', 'Xbox Series X/S', 'Switch'], genres: ['Metroidvania', 'Action'], release_date: '2024-01-18', featured: false },
  { title: 'Tekken 8', slug: 'tekken-8', developer: 'Bandai Namco', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Fighting'], release_date: '2024-01-26', featured: false },
  { title: "Dragon's Dogma 2", slug: 'dragons-dogma-2', developer: 'Capcom', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Action RPG', 'Open World'], release_date: '2024-03-22', featured: false },

  // Controversial picks
  { title: 'Starfield', slug: 'starfield', developer: 'Bethesda Game Studios', platforms: ['PC', 'Xbox Series X/S'], genres: ['RPG', 'Open World', 'Sci-Fi'], release_date: '2023-09-06', featured: false },
  { title: 'Skull and Bones', slug: 'skull-and-bones', developer: 'Ubisoft Singapore', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Action', 'Multiplayer'], release_date: '2024-02-16', featured: false },
  { title: 'Suicide Squad: Kill the Justice League', slug: 'suicide-squad', developer: 'Rocksteady Studios', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Action', 'Looter Shooter'], release_date: '2024-02-02', featured: false },
  { title: 'Concord', slug: 'concord', developer: 'Firewalk Studios', platforms: ['PC', 'PS5'], genres: ['Hero Shooter', 'FPS'], release_date: '2024-08-23', featured: false },

  // 2026 fresh releases
  { title: 'Avowed', slug: 'avowed', developer: 'Obsidian Entertainment', platforms: ['PC', 'Xbox Series X/S'], genres: ['RPG', 'First-Person'], release_date: '2025-02-18', featured: true },
  { title: 'Monster Hunter Wilds', slug: 'monster-hunter-wilds', developer: 'Capcom', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['Action RPG', 'Co-op'], release_date: '2025-02-28', featured: true },
  { title: 'Highguard', slug: 'highguard', developer: 'Wildlight Entertainment', platforms: ['PC', 'PS5', 'Xbox Series X/S'], genres: ['FPS', 'Hero Shooter', 'Free to Play'], release_date: '2026-01-26', featured: false },
];

const mockReviews = {
  'elden-ring': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Elden Ring is the greatest open world game ever made. FromSoftware has somehow topped Dark Souls in every conceivable way.', sentiment: 0.99 },
    { creator: 'ACG', verdict: 'BUY', quote: 'A masterpiece that will define the genre for a decade. Buy it immediately.', sentiment: 0.98 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'This is the game that proves FromSoftware are the best developers in the world right now.', sentiment: 0.97 },
  ],
  'baldurs-gate-3': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'BG3 is the RPG of the decade. Larian has raised the bar so high nobody else can reach it.', sentiment: 0.99 },
    { creator: 'ACG', verdict: 'BUY', quote: 'A landmark achievement in gaming. Every RPG fan must play this.', sentiment: 0.99 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'The best RPG ever made. Nothing else comes close.', sentiment: 0.98 },
  ],
  'cyberpunk-2077': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'After Phantom Liberty, Cyberpunk 2077 is finally the game it was always meant to be. Stunning redemption arc.', sentiment: 0.91 },
    { creator: 'ACG', verdict: 'BUY', quote: 'The 2.0 update transformed this into one of the best RPGs available. Night City is breathtaking.', sentiment: 0.89 },
    { creator: 'Luke Stephens', verdict: 'WAIT', quote: 'Great game now but wait for a sale — the launch history leaves a bad taste even if the current product is excellent.', sentiment: 0.72 },
  ],
  'god-of-war-ragnarok': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Ragnarok improves on 2018 in almost every way. The story is emotionally devastating in the best way.', sentiment: 0.95 },
    { creator: 'ACG', verdict: 'BUY', quote: 'One of the best action games ever made. Kratos and Atreus deliver a story for the ages.', sentiment: 0.94 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'A must play for anyone with a PS5. The combat, story, and visuals are all top tier.', sentiment: 0.93 },
  ],
  'hades': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Hades is the perfect roguelike. Supergiant has created something truly special here.', sentiment: 0.97 },
    { creator: 'ACG', verdict: 'BUY', quote: 'Flawless execution of the roguelike formula with incredible writing and satisfying combat.', sentiment: 0.96 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'The best indie game of the generation. Every run feels fresh and rewarding.', sentiment: 0.95 },
  ],
  'hollow-knight': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Hollow Knight is the gold standard of the metroidvania genre. An absolute must play.', sentiment: 0.97 },
    { creator: 'ACG', verdict: 'BUY', quote: 'Team Cherry created a masterpiece for almost nothing. Stunning achievement in indie development.', sentiment: 0.96 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'One of the best games ever made regardless of price or genre. Just play it.', sentiment: 0.97 },
  ],
  'sekiro': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Sekiro has the best combat system ever designed. The parry mechanic is pure perfection.', sentiment: 0.96 },
    { creator: 'ACG', verdict: 'BUY', quote: 'FromSoftware at their most focused. Every fight is a masterclass in game design.', sentiment: 0.95 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'The most satisfying combat in any game period. The difficulty is completely fair.', sentiment: 0.94 },
  ],
  'red-dead-redemption-2': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'RDR2 is a cinematic achievement unlike anything else in gaming. Arthur Morgan is one of the greatest protagonists ever.', sentiment: 0.97 },
    { creator: 'ACG', verdict: 'BUY', quote: 'The most detailed open world ever created. Rockstar outdid themselves completely.', sentiment: 0.96 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'A slow burn masterpiece that rewards patience. One of the most moving game stories ever told.', sentiment: 0.95 },
  ],
  'witcher-3': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'The Witcher 3 remains the benchmark for open world RPGs even a decade later. Blood and Wine alone is worth the price.', sentiment: 0.97 },
    { creator: 'ACG', verdict: 'BUY', quote: 'CD Projekt Red created the definitive open world RPG. An essential purchase for any gamer.', sentiment: 0.96 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Still the best open world RPG ever made. The writing quality is unmatched.', sentiment: 0.95 },
  ],
  'dark-souls-3': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Dark Souls 3 is the most accessible entry in the series without sacrificing any of the depth.', sentiment: 0.92 },
    { creator: 'ACG', verdict: 'BUY', quote: 'A masterful conclusion to the trilogy with some of the best boss fights in the entire series.', sentiment: 0.91 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Essential Souls experience. The DLC content is among the best FromSoftware has ever made.', sentiment: 0.90 },
  ],
  'helldivers-2': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Helldivers 2 is the most fun I have had in a co-op game in years. Arrowhead nailed the chaotic comedy of war.', sentiment: 0.93 },
    { creator: 'ACG', verdict: 'BUY', quote: 'Best co-op shooter in years. The community-driven galactic war is genius.', sentiment: 0.91 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Play this with friends immediately. One of the best multiplayer experiences of 2024.', sentiment: 0.92 },
  ],
  'black-myth-wukong': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Black Myth Wukong is a stunning achievement from a first-time studio. The boss fights are spectacular.', sentiment: 0.92 },
    { creator: 'ACG', verdict: 'BUY', quote: 'Visually one of the most impressive games ever made. Game Science delivered something special.', sentiment: 0.90 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'A landmark moment for Chinese game development. The combat is deep and satisfying.', sentiment: 0.89 },
  ],
  'metaphor-refantazio': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Metaphor ReFantazio might be Atlus at their absolute best. A jaw dropping JRPG with incredible style and substance.', sentiment: 0.97 },
    { creator: 'ACG', verdict: 'BUY', quote: 'The best JRPG of the year and possibly the decade. Atlus has done the impossible and topped Persona 5.', sentiment: 0.96 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Essential JRPG experience. The themes, combat, and presentation are all exceptional.', sentiment: 0.95 },
  ],
  'astro-bot': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Astro Bot is pure joy. Team Asobi has created the best platformer in years and the best PS5 exclusive.', sentiment: 0.98 },
    { creator: 'ACG', verdict: 'BUY', quote: 'The most charming and creative platformer since Mario Odyssey. An absolute delight from start to finish.', sentiment: 0.97 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'If you have a PS5 this is required playing. Pure fun with incredible DualSense integration.', sentiment: 0.96 },
  ],
  'ff7-rebirth': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'FF7 Rebirth is a massive achievement. The combat is the best in the series and the world is breathtaking.', sentiment: 0.94 },
    { creator: 'ACG', verdict: 'BUY', quote: 'Square Enix knocked it out of the park. A worthy continuation of one of gaming greatest stories.', sentiment: 0.93 },
    { creator: 'Luke Stephens', verdict: 'WAIT', quote: 'Great game but the open world padding drags it down. Wait for a sale unless you are a die hard FF7 fan.', sentiment: 0.74 },
  ],
  'like-a-dragon-infinite-wealth': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Infinite Wealth is the best Yakuza game ever made. Ichiban in Hawaii is pure magic.', sentiment: 0.96 },
    { creator: 'ACG', verdict: 'BUY', quote: 'RGG Studio continues to be the most consistent developer in the industry. An absolute blast.', sentiment: 0.95 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'One of the best JRPGs of the decade. The story and characters are exceptional.', sentiment: 0.94 },
  ],
  'prince-of-persia-lost-crown': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'The Lost Crown is a surprise masterpiece. Ubisoft Montpellier made the best Metroidvania since Hollow Knight.', sentiment: 0.94 },
    { creator: 'ACG', verdict: 'BUY', quote: 'Incredible metroidvania that deserves way more attention. One of the best games of 2024.', sentiment: 0.93 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Essential Metroidvania. Do not sleep on this because of the Ubisoft name.', sentiment: 0.92 },
  ],
  'tekken-8': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Tekken 8 is the best in the series and a landmark fighting game. The heat system adds incredible depth.', sentiment: 0.91 },
    { creator: 'ACG', verdict: 'BUY', quote: 'The best 3D fighter available. Bandai Namco delivered a complete package at launch.', sentiment: 0.90 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Fighting game of the year without question. The roster and mechanics are both top tier.', sentiment: 0.89 },
  ],
  'dragons-dogma-2': [
    { creator: 'Skill Up', verdict: 'WAIT', quote: 'Dragons Dogma 2 has incredible bones but performance issues and lack of content hold it back at launch. Wait for patches.', sentiment: 0.68 },
    { creator: 'ACG', verdict: 'WAIT', quote: 'Fascinating and unique but rough around the edges. The pawn system is genius but the PC performance is unacceptable.', sentiment: 0.65 },
    { creator: 'Luke Stephens', verdict: 'WAIT', quote: 'Give it six months for patches and a price drop. The foundation is excellent but the execution is frustrating.', sentiment: 0.63 },
  ],
  'starfield': [
    { creator: 'Skill Up', verdict: 'SKIP', quote: 'Starfield is a profound disappointment. One thousand planets of nothing. Bethesda has lost the plot completely.', sentiment: 0.22 },
    { creator: 'ACG', verdict: 'WAIT', quote: 'Not terrible but not good either. Starfield feels like a game designed by committee with no soul.', sentiment: 0.45 },
    { creator: 'Luke Stephens', verdict: 'SKIP', quote: 'Skip it. The procedural generation killed any sense of wonder. This is not the Bethesda RPG we were promised.', sentiment: 0.20 },
  ],
  'skull-and-bones': [
    { creator: 'Skill Up', verdict: 'SKIP', quote: 'Six years of development for this? Skull and Bones is an embarrassment. Skip without hesitation.', sentiment: 0.08 },
    { creator: 'ACG', verdict: 'SKIP', quote: 'One of the most disappointing games in recent memory. The live service grind kills any fun within hours.', sentiment: 0.10 },
    { creator: 'Luke Stephens', verdict: 'SKIP', quote: 'Absolutely skip this. Ubisoft charged full price for a decade old concept executed poorly.', sentiment: 0.07 },
  ],
  'suicide-squad': [
    { creator: 'Skill Up', verdict: 'SKIP', quote: 'Rocksteady destroyed their legacy with this. A soulless live service looter shooter nobody asked for.', sentiment: 0.09 },
    { creator: 'ACG', verdict: 'SKIP', quote: 'One of the biggest disappointments in gaming history. The combat is repetitive and the story disrespects the characters.', sentiment: 0.11 },
    { creator: 'Luke Stephens', verdict: 'SKIP', quote: 'Hard skip. This killed Rocksteady as we knew them. A genuine tragedy for gaming.', sentiment: 0.08 },
  ],
  'concord': [
    { creator: 'Skill Up', verdict: 'SKIP', quote: 'Concord had nothing to offer in an already saturated hero shooter market. The $40 price tag sealed its fate.', sentiment: 0.12 },
    { creator: 'ACG', verdict: 'SKIP', quote: 'Nothing here justifies the price or the time investment when better options exist for free.', sentiment: 0.15 },
    { creator: 'Luke Stephens', verdict: 'SKIP', quote: 'The game that died in two weeks for good reason. Skip and play Marvel Rivals instead.', sentiment: 0.10 },
  ],
  'avowed': [
    { creator: 'Skill Up', verdict: 'WAIT', quote: 'Avowed is a solid 7/10 RPG that feels unfinished. Good combat and world building but shallow compared to its peers.', sentiment: 0.65 },
    { creator: 'ACG', verdict: 'WAIT', quote: 'Enjoyable but not essential. Wait for a sale — it does not justify full price against the competition.', sentiment: 0.62 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'I had more fun with Avowed than most games this year. The combat and exploration clicked for me.', sentiment: 0.78 },
  ],
  'monster-hunter-wilds': [
    { creator: 'Skill Up', verdict: 'BUY', quote: 'Monster Hunter Wilds is the best in the series. Capcom has outdone themselves with the living ecosystem and monster AI.', sentiment: 0.97 },
    { creator: 'ACG', verdict: 'BUY', quote: 'The most impressive Monster Hunter yet. The seamless open world and dynamic weather make every hunt feel alive.', sentiment: 0.96 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'Essential purchase for action RPG fans. Wilds perfects the Monster Hunter formula in every way.', sentiment: 0.95 },
  ],
  'highguard': [
    { creator: 'Skill Up', verdict: 'WAIT', quote: 'Highguard has real potential but launched too early with serious performance issues. Come back in six months.', sentiment: 0.58 },
    { creator: 'ACG', verdict: 'WAIT', quote: 'The core raid loop is genuinely innovative but the rough edges and solo queue experience hold it back.', sentiment: 0.55 },
    { creator: 'Luke Stephens', verdict: 'BUY', quote: 'The hate is overblown. Highguard is a fun free to play shooter with a genuinely unique mode. Try it.', sentiment: 0.72 },
  ],
};

async function analyzeReview(review, gameTitle, creatorName) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Analyze this gaming review and return ONLY valid JSON with no markdown:
{
  "verdict": "${review.verdict}",
  "sentiment_score": ${review.sentiment},
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "creator_quote": "${review.quote}",
  "sponsored": false
}

Game: ${gameTitle}
Creator: ${creatorName}
Review: ${review.quote}

Return the JSON with pros and cons filled in based on the review sentiment. Keep the verdict and sentiment_score exactly as provided.`
    }]
  });

  const raw = message.content[0].text;
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function run() {
  console.log('Starting bulk game population...\n');
  let gamesAdded = 0;
  let reviewsAdded = 0;

  for (const game of games) {
    console.log(`\nProcessing: ${game.title}`);

    // Insert game
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('slug', game.slug)
      .single();

    let gameRecord = existingGame;

    if (!existingGame) {
      const { data: newGame, error } = await supabase
        .from('games')
        .insert(game)
        .select()
        .single();

      if (error) {
        console.error(`  Error adding ${game.title}:`, error.message);
        continue;
      }
      gameRecord = newGame;
      gamesAdded++;
      console.log(`  ✓ Game added`);
    } else {
      console.log(`  → Game already exists`);
    }

    // Check if reviews already exist
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('game_id', gameRecord.id);

    if (existingReviews && existingReviews.length > 0) {
      console.log(`  → Reviews already exist, skipping`);
      continue;
    }

    // Process reviews
    const reviews = mockReviews[game.slug];
    if (!reviews) {
      console.log(`  → No mock reviews defined, skipping`);
      continue;
    }

    for (const review of reviews) {
      try {
        const analysis = await analyzeReview(review, game.title, review.creator);

        // Get or create creator
        let { data: creator } = await supabase
          .from('creators')
          .select('*')
          .eq('name', review.creator)
          .single();

        if (!creator) {
          const { data: newCreator, error: creatorError } = await supabase
            .from('creators')
            .insert({ name: review.creator, youtube_channel_id: `https://youtube.com/@${review.creator.replace(' ', '')}` })
            .select()
            .single();

          if (creatorError) {
            console.error(`  Creator error:`, creatorError.message);
            continue;
          }
          creator = newCreator;
        }

        const { error: reviewError } = await supabase.from('reviews').insert({
          game_id: gameRecord.id,
          creator_id: creator.id,
          youtube_video_id: `${game.slug}_${review.creator.replace(' ', '_').toLowerCase()}_001`,
          video_url: `https://youtube.com/watch?v=${game.slug}_${review.creator.replace(' ', '_').toLowerCase()}`,
          verdict: analysis.verdict,
          sentiment_score: analysis.sentiment_score,
          pros: analysis.pros,
          cons: analysis.cons,
          creator_quote: analysis.creator_quote,
          is_sponsored: false,
        });

        if (reviewError) {
          console.error(`  Review error:`, reviewError.message);
        } else {
          console.log(`  ✓ ${review.creator}: ${review.verdict}`);
          reviewsAdded++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.error(`  Error processing ${review.creator}:`, err.message);
      }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`Games added: ${gamesAdded}`);
  console.log(`Reviews added: ${reviewsAdded}`);
}

run();
