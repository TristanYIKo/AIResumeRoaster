import mammoth from "mammoth";

export class ExtractError extends Error {
    constructor(
        message: string,
        public status = 400,
    ) {
        super(message);
    }
}

type Kind = "pdf" | "docx" | "txt";

const MIME_KINDS: Record<string, Kind> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
};

/** Browsers report MIME types inconsistently (Windows often sends none), so the extension wins. */
function detectKind(file: File): Kind | "doc" | null {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || ext === "docx" || ext === "txt") return ext;
    if (ext === "doc" || file.type === "application/msword") return "doc";
    return MIME_KINDS[file.type] ?? null;
}

export async function extractText(file: File): Promise<string> {
    const kind = detectKind(file);

    if (kind === "doc") {
        throw new ExtractError("Older .doc files aren't supported. Save it as .docx or PDF and try again.", 415);
    }
    if (!kind) {
        throw new ExtractError("That file type isn't supported. Upload a PDF, DOCX or TXT file.", 415);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    try {
        if (kind === "pdf") {
            // Loaded at runtime and kept out of the bundle (see next.config.mjs).
            const pdfParse = (await import("pdf-parse")).default;
            text = (await pdfParse(buffer)).text;
        } else if (kind === "docx") {
            text = (await mammoth.extractRawText({ buffer })).value;
        } else {
            text = buffer.toString("utf-8");
        }
    } catch (err) {
        console.error(`Failed to read ${kind} file:`, err);
        throw new ExtractError(`Couldn't read that ${kind.toUpperCase()}. Try exporting it again, or upload a different format.`);
    }

    // Drop control characters, normalise spacing, keep line breaks (bullet detection needs them).
    return text
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
