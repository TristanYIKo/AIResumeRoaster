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
The user has uploaded their resume. Your job is to analyze it like a recruiter + hiring manager + ATS system combined.

IMPORTANT RULES:
- Do NOT mention graduation dates or timelines unless they directly impact hireability
- ONLY mention numbers if they come from the resume’s own bullet-point metrics
- Focus on CONTENT, STRUCTURE, CONSISTENCY, CLARITY, and IMPACT
- Roast the WRITING and PRESENTATION, not the person
- Humor should be sharp but constructive

You MUST analyze the following in your response:
1) Bullet point quality (clarity, length, action verbs, metrics, structure, fluff vs impact)
2) Consistency of formatting and style across all sections
3) Strength of experiences and projects as a whole
4) Strength of other sections (education, skills, certs, etc.)
5) Whether it sounds AI-generated or genuinely human
6) Overall hireability and clarity of the candidate’s direction
7) Whether the resume clearly communicates what the candidate is GOOD at

Respond in STRICT JSON with the following format (no extra words):

    {
  "roastBullets": [
    4–6 short, funny but actually useful roasts focused on:
    - bullet point quality and structure
    - consistency across sections
    - vague vs specific language
    - overuse or lack of buzzwords
    - unclear impact
    - weak wording
    - AI-sounding phrases
    - how well the resume actually shows real skills
    Do NOT mention dates. Do NOT make things up. Base everything on the resume.
  ],

  "tips": [
    3–5 HIGHLY SPECIFIC, actionable improvements focused on:
    - fixing bullet point structure (use of action verb + task + result)
    - improving wording and clarity
    - adding or removing detail
    - removing fluff and repetition
    - improving section organization and hierarchy
    - making it sound more human
    - improving overall hireability and focus
  ],

  "careerLevel": choose ONE of:
    "Intern" | "Corporate NPC" | "LinkedIn Influencer" | "Future CEO"

  "realityCheckPercent": a number from 0–100 measuring how grounded, realistic, and focused this resume is

  "realityCheckLabel": a short punchy label summarizing the resume’s current reality
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
