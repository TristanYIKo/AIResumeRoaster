import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key present:", !!apiKey);
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 5MB" }, { status: 400 });
        }

        let text = "";
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.type === "application/pdf") {
            try {
                // Dynamic import to avoid webpack bundling issues
                // @ts-ignore
                const pdfParse = (await import("pdf-parse")).default;
                const data = await pdfParse(buffer);
                text = data.text;

                if (!text || text.trim().length < 10) {
                    return NextResponse.json({
                        error: "Could not extract text from PDF. It might be an image-based PDF."
                    }, { status: 400 });
                }
            } catch (err) {
                console.error("PDF parsing error:", err);
                return NextResponse.json({
                    error: "Failed to parse PDF. Please try a .txt or .docx file.",
                    debug: err instanceof Error ? err.message : String(err)
                }, { status: 400 });
            }
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "application/msword"
        ) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (file.type === "text/plain") {
            text = buffer.toString("utf-8");
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        if (!text.trim()) {
            return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are a blunt but kind career coach AND resume reviewer for university students.
The user has uploaded their resume. Analyze it like a recruiter, hiring manager, and ATS combined.

FOCUS YOUR CRITIQUE ON:
- Bullet points: clarity, length, structure (action + context + result), tense, metrics, and fluff vs impact
- Consistency: formatting, verb tense, punctuation, and style across all sections
- Experience & projects: do they clearly show what the user can do? are they specific and outcome-driven?
- Skills: are they relevant, believable, and supported by experience/projects, or just a buzzword dump?
- Other sections (education, awards, certs, etc.): are they helping or just taking space?
- Overall voice: does it sound AI-generated or human? generic or tailored?
- Hireability: would this resume make you want to interview them for internships/entry-level roles?

STRICT RULES:
- Do NOT mention graduation dates or timelines.
- ONLY mention numbers that already exist in bullet points (metrics, results, etc.).
- Do NOT invent experience, tools, or achievements.
- No Markdown or HTML formatting (no **bold**, lists, etc.). Plain text only.
- Roast the resume, not the person. Playful, but constructive.

Respond in STRICT JSON with this exact shape and nothing else:

    {
  "roastBullets": [
    4 to 6 short, funny but accurate roasts that target real issues in:
    bullet structure, vagueness, missing metrics, weak verbs, generic phrasing,
    poor section balance, AI-sounding language, or unclear career story.
    Each roast should point to a pattern you actually see in the resume.
  ],

  "tips": [
    3 to 5 specific, actionable suggestions on how to:
    improve bullet formulas, add or sharpen metrics, remove fluff,
    reorganize sections, make skills more credible, and sound more human
    while better showing hireability for internships/entry roles.
  ],

  "careerLevel": one of "Intern" | "Corporate NPC" | "LinkedIn Influencer" | "Future CEO",

  "realityCheckPercent": a number from 0 to 100 based on how focused, credible,
  and internship-ready the resume is,

  "realityCheckLabel": a short, punchy phrase summarizing your verdict
}

    The humor should be playful, not mean. Avoid insulting identity, race, gender, etc. Focus only on resume content and career.

    Resume Text:
    ${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean up markdown code blocks if present
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, "").trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", textResponse);
            return NextResponse.json({ error: "Failed to generate roast" }, { status: 500 });
        }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error("Error processing roast:", error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}
