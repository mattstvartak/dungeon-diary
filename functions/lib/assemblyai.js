"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWithAssemblyAI = processWithAssemblyAI;
const secret_manager_1 = require("@google-cloud/secret-manager");
const fs = __importStar(require("fs"));
const client = new secret_manager_1.SecretManagerServiceClient();
let cachedApiKey = null;
async function getAssemblyApiKey() {
    var _a, _b;
    if (cachedApiKey)
        return cachedApiKey;
    const [version] = await client.accessSecretVersion({
        name: "projects/dungeon-diary-95142/secrets/assemblyai-api-key/versions/latest",
    });
    const key = (_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
    if (!key) {
        throw new Error("AssemblyAI API key not found in Secret Manager");
    }
    cachedApiKey = key;
    return key;
}
async function processWithAssemblyAI(localFilePath, speakersExpected = []) {
    const apiKey = await getAssemblyApiKey();
    // 1) Upload audio
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
            authorization: apiKey,
        },
        body: fs.createReadStream(localFilePath), // Node stream
        duplex: "half",
    });
    const uploadJson = (await uploadRes.json().catch(async () => {
        // fallback if API returns plain text
        return { upload_url: await uploadRes.text() };
    }));
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
    const transcriptionConfig = {
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
    const job = (await jobRes.json());
    console.log("AssemblyAI job response:", {
        status: jobRes.status,
        statusText: jobRes.statusText,
        job: job,
        transcriptionConfig: transcriptionConfig
    });
    if (!(job === null || job === void 0 ? void 0 : job.id)) {
        console.error("AssemblyAI job creation failed:", job);
        throw new Error(`Failed to start AssemblyAI transcription job: ${(job === null || job === void 0 ? void 0 : job.error) || 'Unknown error'}`);
    }
    // 3) Poll until done
    while (true) {
        const statusRes = await fetch(`https://api.assemblyai.com/v2/transcript/${job.id}`, {
            headers: { authorization: apiKey },
        });
        const status = (await statusRes.json());
        if (status.status === "completed")
            return status;
        if (status.status === "error")
            throw new Error(`AssemblyAI error: ${status.error}`);
        await new Promise((r) => setTimeout(r, 5000));
    }
}
//# sourceMappingURL=assemblyai.js.map