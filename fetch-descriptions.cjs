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
    body: `search "${gameTitle}"; fields name,summary; limit 1;`
  });
  const data = await res.json();
  return data[0] || null;
}

async function run() {
  console.log('📝 Fetching descriptions from IGDB...\n');

  const token = await getTwitchToken();
  console.log('✅ Got Twitch token\n');

  const { data: games } = await supabase
    .from('games')
    .select('id, title, slug, description')
    .order('title');

  for (const game of games) {
    try {
      const result = await searchIGDB(token, game.title);
      if (!result || !result.summary) {
        console.log(`❌ ${game.title} — no description found`);
        continue;
      }

      await supabase.from('games').update({ description: result.summary }).eq('id', game.id);
      console.log(`✅ ${game.title}`);

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.log(`❌ ${game.title} — ${err.message}`);
    }
  }

  console.log('\n🎉 Done! All descriptions updated.');
}

run().catch(console.error);
