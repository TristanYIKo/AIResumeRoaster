import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText, ExtractError } from "@/lib/extract";
import { describeForModel, measure } from "@/lib/signals";
import { buildUserPrompt, RESPONSE_SCHEMA, SYSTEM_PROMPT } from "@/lib/prompt";
import { buildReport, ModelOutputError } from "@/lib/scoring";
import { getTrack, isTrackId, type Track } from "@/lib/tracks";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CHARS = 20_000;
const MIN_WORDS = 60;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set");
        return fail("The roaster isn't configured yet. Try again later.", 503);
    }

    let file: File | null = null;
    let chosen: Track | null = null;
    try {
        const form = await req.formData();
        const value = form.get("file");
        file = value instanceof File ? value : null;
        const track = form.get("track");
        chosen = isTrackId(track) ? getTrack(track) : null; // "auto" or missing means detect it
    } catch {
        return fail("The upload didn't come through. Try again.", 400);
    }
    if (!file) return fail("Choose a file to upload.", 400);
    if (file.size > MAX_BYTES) return fail("That file is over 5 MB. Upload a smaller copy.", 413);

    let text: string;
    try {
        text = await extractText(file);
    } catch (err) {
        if (err instanceof ExtractError) return fail(err.message, err.status);
        throw err;
    }

    const measurements = measure(text);
    if (measurements.wordCount < MIN_WORDS) {
        return fail(
            measurements.wordCount === 0
                ? "No text could be read from that file. If it's a scanned PDF, export a text-based version."
                : `Only ${measurements.wordCount} word${measurements.wordCount === 1 ? "" : "s"} came through. Upload your full resume.`,
            422,
        );
    }

    try {
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
            model: MODEL,
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
                // Low temperature keeps scores stable when the same resume is uploaded twice.
                temperature: 0.1,
            },
        });

        const result = await model.generateContent(
            buildUserPrompt(describeForModel(measurements), text.slice(0, MAX_CHARS), chosen),
        );
        const raw = JSON.parse(result.response.text());

        if (raw?.isResume === false) {
            const reason = typeof raw.notResumeReason === "string" ? raw.notResumeReason.trim() : "";
            return fail(`This doesn't look like a resume. ${reason}`.trim(), 422);
        }

        return NextResponse.json(buildReport(raw, measurements, file.name, chosen?.id ?? null));
    } catch (err) {
        console.error("Roast failed:", err);
        const message =
            err instanceof SyntaxError || err instanceof ModelOutputError
                ? "The review came back incomplete. Run it again."
                : "The reviewer is unavailable right now. Try again in a minute.";
        return fail(message, 502);
    }
}
