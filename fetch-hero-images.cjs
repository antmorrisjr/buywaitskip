require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getTwitchToken() {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await res.json();
  return data.access_token;
}

async function searchIGDB(token, gameTitle) {
  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'text/plain'
    },
    body: `search "${gameTitle}"; fields name,cover.image_id,artworks.image_id,screenshots.image_id; limit 1;`
  });
  const data = await res.json();
  return data[0] || null;
}

async function run() {
  console.log('🎮 Fetching hero images from IGDB...\n');

  const token = await getTwitchToken();
  console.log('✅ Got Twitch token\n');

  const { data: games } = await supabase.from('games').select('id, title, slug').order('title');

  const heroImages = {};

  for (const game of games) {
    try {
      const result = await searchIGDB(token, game.title);
      if (!result) {
        console.log(`❌ ${game.title} — not found`);
        continue;
      }

      // Prefer artworks (wide hero images), fall back to screenshots, then cover
      let imageId = null;
      let imageType = '';

      if (result.artworks && result.artworks.length > 0) {
        imageId = result.artworks[0].image_id;
        imageType = 'artwork';
      } else if (result.screenshots && result.screenshots.length > 0) {
        imageId = result.screenshots[0].image_id;
        imageType = 'screenshot';
      } else if (result.cover) {
        imageId = result.cover.image_id;
        imageType = 'cover';
      }

      if (!imageId) {
        console.log(`❌ ${game.title} — no image found`);
        continue;
      }

      // Use 1080p size for hero images
      const heroUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg`;
      heroImages[game.slug] = heroUrl;

      // Also update cover_url in Supabase with the proper cover
      if (result.cover) {
        const coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${result.cover.image_id}.jpg`;
        await supabase.from('games').update({ cover_url: coverUrl }).eq('id', game.id);
      }

      console.log(`✅ ${game.title} — ${imageType}`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log(`❌ ${game.title} — ${err.message}`);
    }
  }

  console.log('\n\n📋 Copy this into your steamHeroImages in page.tsx:\n');
  console.log('const steamHeroImages: Record<string, string> = {');
  for (const [slug, url] of Object.entries(heroImages)) {
    console.log(`  "${slug}": "${url}",`);
  }
  console.log('};');
}

run().catch(console.error);
