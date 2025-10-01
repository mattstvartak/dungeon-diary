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
exports.reprocessAudio = exports.processAudio = exports.onAudioUpload = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const assemblyai_1 = require("./assemblyai");
const firestore_1 = require("./firestore");
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
/**
 * Update session with processing completion status for client-side notifications
 */
async function updateSessionProcessingStatus(userId, sessionId, chunkFileName, status) {
    try {
        // Update the session document to trigger client-side notifications
        const sessionRef = db.collection("sessions").doc(sessionId);
        await sessionRef.update({
            [`audioChunks.${chunkFileName}.processingStatus`]: status,
            [`audioChunks.${chunkFileName}.processedAt`]: new Date(),
            updatedAt: new Date(),
        });
        console.log(`Updated session ${sessionId} processing status for ${chunkFileName}: ${status}`);
    }
    catch (error) {
        console.error("Error updating session processing status:", error);
    }
}
// 1) Auto-process on upload
exports.onAudioUpload = (0, storage_1.onObjectFinalized)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (event) => {
    const object = event.data;
    const filePath = object.name || "";
    if (!filePath.endsWith(".webm"))
        return; // ignore non-audio chunks
    // Expect: users/{uid}/sessions/{sessionId}/audio_chunk_000.webm
    const parts = filePath.split("/");
    if (parts.length < 5 || parts[0] !== "users" || parts[2] !== "sessions") {
        console.log("Skipping non-session file:", filePath);
        return;
    }
    const uid = parts[1];
    const sessionId = parts[3];
    const chunkFileName = parts[4];
    // Get session data to determine expected speakers
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
        console.log(`Session ${sessionId} not found, skipping processing`);
        return;
    }
    const sessionData = sessionDoc.data();
    const campaignId = sessionData === null || sessionData === void 0 ? void 0 : sessionData.campaignId;
    // Get campaign data to get players and DM
    let speakersExpected = [];
    if (campaignId) {
        const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
        if (campaignDoc.exists) {
            const campaignData = campaignDoc.data();
            const dm = campaignData === null || campaignData === void 0 ? void 0 : campaignData.dm;
            const players = (campaignData === null || campaignData === void 0 ? void 0 : campaignData.players) || [];
            // Build expected speakers list: DM + unique players (count each player once, not both player and character names)
            speakersExpected = [dm].filter(Boolean);
            if (players && Array.isArray(players)) {
                players.forEach((player) => {
                    // Only count the player once, prefer character name if available, otherwise player name
                    const speakerName = player.characterName || player.playerName;
                    if (speakerName && !speakersExpected.includes(speakerName)) {
                        speakersExpected.push(speakerName);
                    }
                });
            }
        }
    }
    const bucket = storage.bucket(object.bucket);
    const tmp = path.join(os.tmpdir(), chunkFileName);
    await bucket.file(filePath).download({ destination: tmp });
    const transcript = await (0, assemblyai_1.processWithAssemblyAI)(tmp, speakersExpected);
    await (0, firestore_1.saveTranscript)(db, uid, sessionId, chunkFileName, transcript);
    // Update session status for client-side notifications
    await updateSessionProcessingStatus(uid, sessionId, chunkFileName, "completed");
    console.log(`Saved transcript for ${sessionId}/${chunkFileName}`);
});
// 2) Manual process from your app (for unprocessed chunks)
exports.processAudio = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (request, response) => {
    // Handle CORS preflight
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
    }
    try {
        // Verify authentication
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            response.status(401).json({ error: "Missing or invalid authorization header" });
            return;
        }
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Parse request body
        const { data } = request.body;
        const { sessionId, chunkFileName } = data || {};
        if (!sessionId || !chunkFileName) {
            response.status(400).json({ error: "Missing sessionId or chunkFileName" });
            return;
        }
        // Get session data to determine expected speakers
        const sessionDoc = await db.collection("sessions").doc(sessionId).get();
        if (!sessionDoc.exists) {
            response.status(404).json({ error: "Session not found" });
            return;
        }
        const sessionData = sessionDoc.data();
        const campaignId = sessionData === null || sessionData === void 0 ? void 0 : sessionData.campaignId;
        // Get campaign data to get players and DM
        let speakersExpected = [];
        if (campaignId) {
            const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
            if (campaignDoc.exists) {
                const campaignData = campaignDoc.data();
                const dm = campaignData === null || campaignData === void 0 ? void 0 : campaignData.dm;
                const players = (campaignData === null || campaignData === void 0 ? void 0 : campaignData.players) || [];
                // Build expected speakers list: DM + unique players (count each player once, not both player and character names)
                speakersExpected = [dm].filter(Boolean);
                if (players && Array.isArray(players)) {
                    players.forEach((player) => {
                        // Only count the player once, prefer character name if available, otherwise player name
                        const speakerName = player.characterName || player.playerName;
                        if (speakerName && !speakersExpected.includes(speakerName)) {
                            speakersExpected.push(speakerName);
                        }
                    });
                }
            }
        }
        const bucket = storage.bucket(); // default bucket
        const filePath = `users/${uid}/sessions/${sessionId}/${chunkFileName}`;
        const tmp = path.join(os.tmpdir(), chunkFileName);
        await bucket.file(filePath).download({ destination: tmp });
        const transcript = await (0, assemblyai_1.processWithAssemblyAI)(tmp, speakersExpected);
        await (0, firestore_1.saveTranscript)(db, uid, sessionId, chunkFileName, transcript);
        // Update session status for client-side notifications
        await updateSessionProcessingStatus(uid, sessionId, chunkFileName, "completed");
        response.json({ ok: true, transcriptId: transcript.id || null });
    }
    catch (error) {
        console.error("Error in processAudio:", error);
        response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
});
// 3) Manual (re)process from your app (for existing transcripts)
exports.reprocessAudio = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (request, response) => {
    // Handle CORS preflight
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
    }
    try {
        // Verify authentication
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            response.status(401).json({ error: "Missing or invalid authorization header" });
            return;
        }
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Parse request body
        const { data } = request.body;
        const { sessionId, chunkFileName } = data || {};
        if (!sessionId || !chunkFileName) {
            response.status(400).json({ error: "Missing sessionId or chunkFileName" });
            return;
        }
        // Get session data to determine expected speakers
        const sessionDoc = await db.collection("sessions").doc(sessionId).get();
        if (!sessionDoc.exists) {
            response.status(404).json({ error: "Session not found" });
            return;
        }
        const sessionData = sessionDoc.data();
        const campaignId = sessionData === null || sessionData === void 0 ? void 0 : sessionData.campaignId;
        // Get campaign data to get players and DM
        let speakersExpected = [];
        if (campaignId) {
            const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
            if (campaignDoc.exists) {
                const campaignData = campaignDoc.data();
                const dm = campaignData === null || campaignData === void 0 ? void 0 : campaignData.dm;
                const players = (campaignData === null || campaignData === void 0 ? void 0 : campaignData.players) || [];
                // Build expected speakers list: DM + unique players (count each player once, not both player and character names)
                speakersExpected = [dm].filter(Boolean);
                if (players && Array.isArray(players)) {
                    players.forEach((player) => {
                        // Only count the player once, prefer character name if available, otherwise player name
                        const speakerName = player.characterName || player.playerName;
                        if (speakerName && !speakersExpected.includes(speakerName)) {
                            speakersExpected.push(speakerName);
                        }
                    });
                }
            }
        }
        const bucket = storage.bucket(); // default bucket
        const filePath = `users/${uid}/sessions/${sessionId}/${chunkFileName}`;
        const tmp = path.join(os.tmpdir(), chunkFileName);
        await bucket.file(filePath).download({ destination: tmp });
        const transcript = await (0, assemblyai_1.processWithAssemblyAI)(tmp, speakersExpected);
        await (0, firestore_1.saveTranscript)(db, uid, sessionId, chunkFileName, transcript);
        response.json({ ok: true, transcriptId: transcript.id || null });
    }
    catch (error) {
        console.error("Error in reprocessAudio:", error);
        response.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
});
//# sourceMappingURL=index.js.map