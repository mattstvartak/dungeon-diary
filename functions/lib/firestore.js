"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveTranscript = saveTranscript;
async function saveTranscript(db, uid, sessionId, chunkFileName, transcript) {
    var _a, _b;
    // Get session data to get campaignId
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
        throw new Error(`Session ${sessionId} not found`);
    }
    const sessionData = sessionDoc.data();
    const campaignId = sessionData === null || sessionData === void 0 ? void 0 : sessionData.campaignId;
    // Store in root-level transcripts collection
    const transcriptRef = db.collection("transcripts").doc();
    // Convert utterances to segments format and combine consecutive utterances by same speaker
    const rawSegments = ((_a = transcript.utterances) !== null && _a !== void 0 ? _a : []).map((utterance) => ({
        speaker: utterance.speaker || "Unknown",
        text: utterance.text || "",
        startTime: utterance.start || 0,
        endTime: utterance.end || 0,
    }));
    // Combine consecutive utterances by the same speaker
    const segments = [];
    let currentSegment = null;
    for (const utterance of rawSegments) {
        if (currentSegment && currentSegment.speaker === utterance.speaker) {
            // Same speaker - combine with current segment
            currentSegment.text += " " + utterance.text;
            currentSegment.endTime = utterance.endTime;
        }
        else {
            // Different speaker or first utterance - start new segment
            if (currentSegment) {
                segments.push(currentSegment);
            }
            currentSegment = Object.assign({}, utterance);
        }
    }
    // Don't forget the last segment
    if (currentSegment) {
        segments.push(currentSegment);
    }
    // Collect unique speakers
    const speakers = [...new Set(segments.map((s) => s.speaker))];
    await transcriptRef.set({
        userId: uid,
        campaignId: campaignId,
        sessionId: sessionId,
        chunkFileName: chunkFileName,
        text: (_b = transcript.text) !== null && _b !== void 0 ? _b : "",
        segments: segments,
        speakers: speakers,
        status: "completed",
        createdAt: new Date(),
    });
    // Store speakers in root-level speakers collection
    const speakersCol = db.collection("speakers");
    for (const speaker of speakers) {
        await speakersCol.doc(`${sessionId}_${speaker}`).set({
            userId: uid,
            campaignId: campaignId,
            sessionId: sessionId,
            speakerLabel: speaker,
            assignedName: null,
            updatedAt: new Date()
        }, { merge: true });
    }
}
//# sourceMappingURL=firestore.js.map