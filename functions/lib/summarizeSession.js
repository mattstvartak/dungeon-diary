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
exports.summarizeSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = require("openai");
const marked = __importStar(require("marked"));
// Define the secret
const openaiApiKey = (0, params_1.defineSecret)("OPENAI_API_KEY");
/**
 * Summarize a given text (transcript of D&D session).
 *
 * @param text - transcript text to summarize
 * @returns summary string
 */
async function generateSummary(text) {
    var _a, _b, _c;
    const prompt = `You are an expert D&D session summarizer. Please create a comprehensive summary of the following D&D session transcript.

Please provide a summary that includes:
1. **Session Overview**: Brief summary of what happened in this session
2. **Key Events**: Important plot points, encounters, and story developments
3. **Character Actions**: Notable actions taken by player characters
4. **NPCs Met**: Non-player characters introduced or interacted with
5. **Items/Loot**: Important items, treasures, or equipment acquired
6. **Locations**: Places visited or discovered
7. **Combat Encounters**: Any battles, their outcomes, and notable moments
8. **Quests/Objectives**: Progress made on ongoing quests or new objectives
9. **Player Decisions**: Important choices made by players and their consequences
10. **Session Notes**: Any other important details worth remembering

Please format the summary in a clear, organized manner that will help the players and DM remember what happened in this session.

Transcript:
${text}`;
    try {
        // Initialize OpenAI client with API key from secrets
        const openai = new openai_1.OpenAI({
            apiKey: openaiApiKey.value(),
        });
        const completion = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_completion_tokens: 4000,
        });
        return (_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) !== null && _c !== void 0 ? _c : "No summary generated";
    }
    catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw new Error("Failed to generate summary with OpenAI");
    }
}
/**
 * Firebase v2 Callable Function:
 * Pass sessionId from your frontend,
 * returns a comprehensive summary with notifications.
 */
exports.summarizeSession = (0, https_1.onCall)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 300,
    secrets: [openaiApiKey],
}, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new Error("User must be authenticated.");
    }
    const { sessionId } = request.data;
    if (!sessionId || typeof sessionId !== "string") {
        throw new Error("Session ID is required.");
    }
    const uid = request.auth.uid;
    const db = admin.firestore();
    try {
        // Get session data
        const sessionDoc = await db.collection("sessions").doc(sessionId).get();
        if (!sessionDoc.exists) {
            throw new Error("Session not found.");
        }
        const sessionData = sessionDoc.data();
        if ((sessionData === null || sessionData === void 0 ? void 0 : sessionData.userId) !== uid) {
            throw new Error("Access denied.");
        }
        // Get campaign data for context (for future use)
        const campaignId = sessionData === null || sessionData === void 0 ? void 0 : sessionData.campaignId;
        if (campaignId) {
            await db.collection("campaigns").doc(campaignId).get();
            // campaignData could be used for additional context in the future
        }
        // Get all transcript chunks for this session
        const transcriptsSnapshot = await db.collection("transcripts")
            .where("userId", "==", uid)
            .where("sessionId", "==", sessionId)
            .orderBy("createdAt", "asc")
            .get();
        if (transcriptsSnapshot.empty) {
            throw new Error("No transcripts found for this session.");
        }
        // Combine all transcript segments in chronological order
        const allSegments = [];
        transcriptsSnapshot.docs.forEach(doc => {
            const transcriptData = doc.data();
            if (transcriptData.segments && Array.isArray(transcriptData.segments)) {
                allSegments.push(...transcriptData.segments);
            }
        });
        // Sort segments by start time
        allSegments.sort((a, b) => a.startTime - b.startTime);
        // Convert segments to readable transcript
        const transcriptText = allSegments
            .map(segment => `${segment.speaker}: ${segment.text}`)
            .join('\n');
        // Generate summary
        const summaryMarkdown = await generateSummary(transcriptText);
        // Convert markdown to HTML
        const summaryHtml = marked.parse(summaryMarkdown);
        // Save summary to Firestore (store both markdown and HTML)
        const summaryRef = await db.collection("summaries").add({
            sessionId,
            userId: uid,
            text: summaryMarkdown,
            html: summaryHtml,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update session with summary status
        await db.collection("sessions").doc(sessionId).update({
            summaryStatus: "completed",
            summaryId: summaryRef.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Send notification to user about summary completion
        try {
            const userDoc = await db.collection("users").doc(uid).get();
            const userData = userDoc.data();
            const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
            if (fcmToken) {
                const sessionTitle = (sessionData === null || sessionData === void 0 ? void 0 : sessionData.title) || "D&D Session";
                const message = {
                    notification: {
                        title: "Session Summary Complete",
                        body: `AI summary has been generated for "${sessionTitle}"`,
                    },
                    data: {
                        sessionId,
                        summaryId: summaryRef.id,
                        type: "summary_complete",
                        action: "view_summary",
                    },
                    token: fcmToken,
                };
                await admin.messaging().send(message);
                console.log(`Summary completion notification sent to user ${uid}`);
            }
        }
        catch (notificationError) {
            console.error("Error sending summary completion notification:", notificationError);
            // Don't fail the entire request if notification fails
        }
        return {
            ok: true,
            summaryId: summaryRef.id,
            summary: summaryMarkdown,
            html: summaryHtml
        };
    }
    catch (error) {
        console.error("Error summarizing session:", error);
        throw new Error(`Failed to summarize session: ${error.message}`);
    }
});
//# sourceMappingURL=summarizeSession.js.map