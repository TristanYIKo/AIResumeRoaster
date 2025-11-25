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

        const prompt = `You are a blunt but kind career coach for university students. The user has uploaded their resume. Read it and respond in STRICT JSON with this exact shape:

    {
      "roastBullets": [4 to 5 short, funny but light-hearted roast bullet points about their career so far],
      "tips": [3 specific, practical tips to improve their resume, skills, or career direction],
      "careerLevel": "Intern" | "Corporate NPC" | "LinkedIn Influencer" | "Future CEO",
      "realityCheckPercent": number (0 to 100),
      "realityCheckLabel": short phrase summarizing how grounded their career is
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
