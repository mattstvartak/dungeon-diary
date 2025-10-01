import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import * as fs from "fs";

const client = new SecretManagerServiceClient();
let cachedApiKey: string | null = null;

async function getAssemblyApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  const [version] = await client.accessSecretVersion({
    name: "projects/dungeon-diary-95142/secrets/assemblyai-api-key/versions/latest",
  });

  const key = version.payload?.data?.toString();
  if (!key) {
    throw new Error("AssemblyAI API key not found in Secret Manager");
  }

  cachedApiKey = key;
  return key;
}

export async function processWithAssemblyAI(localFilePath: string, speakersExpected: string[] = []): Promise<any> {
  const apiKey = await getAssemblyApiKey();

  // 1) Upload audio
  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      authorization: apiKey,
    },
    body: fs.createReadStream(localFilePath) as any, // Node stream
    duplex: "half",
  } as any);

  const uploadJson = (await uploadRes.json().catch(async () => {
    // fallback if API returns plain text
    return { upload_url: await uploadRes.text() };
  })) as { upload_url: string };

  console.log("AssemblyAI upload response:", {
    status: uploadRes.status,
    statusText: uploadRes.statusText,
    uploadJson: uploadJson
  });

  const uploadUrl = uploadJson.upload_url;
  
  if (!uploadUrl) {
    console.error("AssemblyAI upload failed:", uploadJson);
    throw new Error("Failed to upload audio to AssemblyAI");
  }

  const wordBoost = [
  // Core D&D
  "Dungeon Master", "DM", "Player Character", "NPC", "Initiative", 
  "Hit Points", "Armor Class", "Saving Throw", "Ability Check", 
  "Critical Hit", "Nat 20", "Campaign", "Quest", "Encounter", "Battlemap",

  // Classes
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter", 
  "Monk", "Paladin", "Ranger", "Rogue", 
  "Sorcerer", "Warlock", "Wizard", "Artificer",

  // Races
  "Elf", "Dwarf", "Halfling", "Human", "Half-Elf", "Half-Orc", 
  "Dragonborn", "Tiefling", "Gnome", "Orc", "Goblin", "Kobold", 
  "Tabaxi", "Genasi", "Aasimar", "Lizardfolk",

  // Spells
  "Fireball", "Eldritch Blast", "Magic Missile", "Shield", 
  "Cure Wounds", "Healing Word", "Detect Magic", "Invisibility", 
  "Polymorph", "Counterspell", "Mage Hand", "Prestidigitation", 
  "Thunderwave", "Lightning Bolt", "Wish",

  // Monsters & Locations
  "Neverwinter", "Waterdeep", "Baldur’s Gate", "Icewind Dale", "Faerûn", "Underdark",
  "Mind Flayer", "Beholder", "Lich", "Dragon", "Owlbear", 
  "Mimic", "Goblin", "Troll", "Gelatinous Cube"
];


  // 2) Start transcription
  const transcriptionConfig: any = {
    audio_url: uploadUrl,
    speaker_labels: true,
    punctuate: true,
    format_text: true,
    word_boost: wordBoost,
  };

  // Let AssemblyAI automatically detect the number of speakers

  console.log("AssemblyAI transcription config:", JSON.stringify(transcriptionConfig, null, 2));

  const jobRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(transcriptionConfig),
  });

  const job = (await jobRes.json()) as { id: string; error?: string };
  
  console.log("AssemblyAI job response:", {
    status: jobRes.status,
    statusText: jobRes.statusText,
    job: job,
    transcriptionConfig: transcriptionConfig
  });
  
  if (!job?.id) {
    console.error("AssemblyAI job creation failed:", job);
    throw new Error(`Failed to start AssemblyAI transcription job: ${job?.error || 'Unknown error'}`);
  }

  // 3) Poll until done
  while (true) {
    const statusRes = await fetch(`https://api.assemblyai.com/v2/transcript/${job.id}`, {
      headers: { authorization: apiKey },
    });

    const status = (await statusRes.json()) as any;
    if (status.status === "completed") return status;
    if (status.status === "error") throw new Error(`AssemblyAI error: ${status.error}`);

    await new Promise((r) => setTimeout(r, 5000));
  }
}
