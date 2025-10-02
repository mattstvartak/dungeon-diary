import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { OpenAI } from "openai";
import * as marked from "marked";

// Define the secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Summarize a given text (transcript of D&D session).
 * 
 * @param text - transcript text to summarize
 * @returns summary string
 */
async function generateSummary(text: string): Promise<string> {
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
    const openai = new OpenAI({
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

    return completion.choices[0]?.message?.content ?? "No summary generated";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate summary with OpenAI");
  }
}

/**
 * Firebase v2 Callable Function:
 * Pass sessionId from your frontend,
 * returns a comprehensive summary with notifications.
 */
export const summarizeSession = onCall({
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
    if (sessionData?.userId !== uid) {
      throw new Error("Access denied.");
    }

    // Get campaign data for context (for future use)
    const campaignId = sessionData?.campaignId;
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
    const allSegments: any[] = [];
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
      const fcmToken = userData?.fcmToken;

      if (fcmToken) {
        const sessionTitle = sessionData?.title || "D&D Session";
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
    } catch (notificationError) {
      console.error("Error sending summary completion notification:", notificationError);
      // Don't fail the entire request if notification fails
    }

    return { 
      ok: true, 
      summaryId: summaryRef.id,
      summary: summaryMarkdown,
      html: summaryHtml
    };

  } catch (error: any) {
    console.error("Error summarizing session:", error);
    throw new Error(`Failed to summarize session: ${error.message}`);
  }
});
