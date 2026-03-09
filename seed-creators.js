import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const creators = [
  { name: "YongYea", youtube_channel_id: "UCT6iAerLNE-0J1S_E97UAuQ" },
  { name: "Maximilian Dood", youtube_channel_id: "UCOgaIuQYGr6ow_jbote4BKA" },
  { name: "TheBackgroundNPC", youtube_channel_id: "UCuEAyHQajqJrWeVrJKgIS_Q" },
  { name: "Jake Baldino", youtube_channel_id: "UC7s6t5KCNwRkb7U_3-E1Tpw" },
  { name: "Legendary Drops", youtube_channel_id: "UCPKhwe5ok7BLniu-WWVSrxw" },
  { name: "The Sphere Hunter", youtube_channel_id: "UCJhsl2VeLfSXzkutwlICyZw" },
  { name: "Vara Dark", youtube_channel_id: "UCcrXOqPJU1uaXJLlH2ZYvtQ" },
  { name: "Dunkey", youtube_channel_id: "UCsvn_Po0SmunchJYOWpOxMg" },
  { name: "Skill Up", youtube_channel_id: "UCZ7AeeVbyslLM_8-nVy2B8Q" },
  { name: "ACG", youtube_channel_id: "UCX5Ess-4_-yxfMaAkOt2vhA" },
  { name: "Gameranx", youtube_channel_id: "UCNAz5Ut1Swwg6h6ysBMZnYg" },
  { name: "Luke Stephens", youtube_channel_id: "UC9AHMBMgYCAnYDVJMQqRBBg" },
  { name: "Dan Allen Gaming", youtube_channel_id: "UCnNSmhDMxGMSGRBXGDmblgQ" },
  { name: "Mortismal Gaming", youtube_channel_id: "UCftSPghD4gY8jm2NVECGxKA" },
  { name: "Joseph Anderson", youtube_channel_id: "UCyhnYIvIKK_--PiJXCMKxQQ" },
  { name: "NakeyJakey", youtube_channel_id: "UCSuSDfIdGbTG9JDok6eDpWA" },
  { name: "Upper Echelon Gamez", youtube_channel_id: "UCxsQHCLkXtAoJJbRaw-b6YQ" },
  { name: "Laymen Gaming", youtube_channel_id: "UCYdv8bMxuMqBPAtAEJQSMIw" },
  { name: "Cohh Carnage", youtube_channel_id: "UCrRQB1mfKNwim0-qMGAXeww" },
  { name: "MKIceAndFire", youtube_channel_id: "UCMi6J4XFkCHqQqfN5aM4VeA" },
  { name: "Asmongold", youtube_channel_id: "UCQeRaTukNYft1_6AZPACnog" },
  { name: "Worth A Buy", youtube_channel_id: "UCBo1p1gFbBT-s3hSvkBBDFQ" },
  { name: "Easy Allies", youtube_channel_id: "UCyNDZKMBNxQbIgnSVoJbLdg" },
  { name: "AngryJoeShow", youtube_channel_id: "UCsgv2QHkT9x0-9rTqoTYfNw" },
];

async function seedCreators() {
  console.log("🌱 Seeding creators...");

  for (const creator of creators) {
    const { error } = await supabase
      .from("creators")
      .upsert(creator, { onConflict: "youtube_channel_id" });

    if (error) {
      console.log(`❌ Failed: ${creator.name} - ${error.message}`);
    } else {
      console.log(`✅ ${creator.name}`);
    }
  }

  console.log("\n✅ Done!");
}

seedCreators().catch(console.error);