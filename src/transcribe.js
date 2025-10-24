import "./config/environment.js";

// transcribe.mjs
// npm install openai

import fs from "fs";
import path from "path";
import process from "process";
import OpenAI from "openai";

// === 🔑 SET YOUR OPENAI KEY HERE ===
const OPENAI_API_KEY = process.env.CHATGPT_API_KEY; // <--- put your real key here

// === CONFIG ===
const MODEL_NAME = "gpt-4o-transcribe-diarize";
const TRANSCRIPTION_LANGUAGE = "he"; // e.g. "en"

// Required for diarization models
const CHUNKING_STRATEGY = "auto";
 

// Helper: convert seconds to SRT-style timestamp
function toSrtTime(seconds) {
  const msTotal = Math.max(0, parseFloat(seconds)) * 1000;
  const hours = Math.floor(msTotal / 3600000);
  const minutes = Math.floor((msTotal % 3600000) / 60000);
  const secs = Math.floor((msTotal % 60000) / 1000);
  const ms = Math.floor(msTotal % 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// Transcribe with diarization
export async function transcribeWithDiarization(audioPath) {
 const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const fileStream = fs.createReadStream(audioPath);

  const kwargs = {
    model: MODEL_NAME,
    file: fileStream,
    response_format: "diarized_json",
    chunking_strategy: CHUNKING_STRATEGY,
  };

  if (TRANSCRIPTION_LANGUAGE) {
    kwargs.language = TRANSCRIPTION_LANGUAGE;
  }

  return await client.audio.transcriptions.create(kwargs);
}

// Extract diarized segments
export function extractSegments(resp) {
  const segments = resp.segments ?? resp?.data?.segments ?? [];
  if (!segments.length) {
    throw new Error("No diarized segments found in response.");
  }
  return segments.map((s) => ({
    speaker: s.speaker ?? "Speaker",
    start: s.start ?? 0.0,
    end: s.end ?? s.start ?? 0.0,
    text: s.text ?? "",
  }));
}

// Print formatted transcript
function printPrettyTranscript(segments) {
  for (const seg of segments) {
    const { speaker, start, end, text } = seg;
    console.log(`[${toSrtTime(start)} → ${toSrtTime(end)}] ${speaker}: ${text.trim()}`);
  }
}

// Save transcript as SRT
function saveSrt(segments, outPath = "transcript_diarized.srt") {
  const lines = segments.map((seg, i) => {
    const start = toSrtTime(seg.start);
    const end = toSrtTime(seg.end);
    return `${i + 1}\n${start} --> ${end}\n${seg.speaker}: ${seg.text.trim()}\n`;
  });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  return outPath;
}

// Save transcript as TXT
function saveTxt(segments, outPath = "transcript_diarized.txt") {
  const lines = segments.map(
    (seg) => `[${toSrtTime(seg.start)} → ${toSrtTime(seg.end)}] ${seg.speaker}: ${seg.text.trim()}`
  );
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  return outPath;
}

// Save transcript as JSON
function saveJson(segments, outPath = "transcript_diarized.json") {
  fs.writeFileSync(outPath, JSON.stringify(segments, null, 2), "utf8");
  return outPath;
}

// === MAIN ===
// async function main() {
//   const client = new OpenAI({ apiKey: OPENAI_API_KEY });
//   const audioPath = process.argv[2] || DEFAULT_AUDIO_PATH;

//   console.log(`Transcribing: ${audioPath}`);
//   const resp = await transcribeWithDiarization(client, audioPath);
//   const segments = extractSegments(resp);

//   console.log("\n=== Speaker-labeled transcript ===\n");
//   printPrettyTranscript(segments);

//   const srtPath = saveSrt(segments);
//   const txtPath = saveTxt(segments);
//   const jsonPath = saveJson(segments);

//   console.log(`\nSaved files:\n  ${srtPath}\n  ${txtPath}\n  ${jsonPath}`);
// }

// // Run if executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main().catch((err) => {
//     console.error("Error:", err);
//     process.exit(1);
//   });
// }
