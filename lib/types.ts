export type CategoryId = "impact" | "bullets" | "story" | "skills" | "clarity" | "ats";

export type TrackId = "software" | "data" | "business" | "finance" | "marketing" | "design" | "general";

export type Tone = "good" | "fair" | "weak";

export interface CategoryResult {
    id: CategoryId;
    label: string;
    weight: number;
    /** Final score after evidence caps, 0-100. */
    score: number;
    /** What the model scored before any cap was applied. */
    modelScore: number;
    verdict: string;
    cap?: { limit: number; reason: string };
}

export interface Signal {
    id: string;
    /** Short casual phrase, e.g. "5 weak openers". */
    chip: string;
    tone: Tone;
}

export interface Roast {
    section: string;
    text: string;
}

export interface Rewrite {
    original: string;
    improved: string;
}

export interface Fix {
    title: string;
    detail: string;
}

export interface Report {
    fileName: string;
    track: { id: TrackId; label: string; detected: boolean };
    overall: number;
    band: { label: string; tone: Tone };
    headline: string;
    summary: string;
    archetype: { name: string; reason: string };
    categories: CategoryResult[];
    signals: Signal[];
    roasts: Roast[];
    rewrites: Rewrite[];
    fixes: Fix[];
    strengths: string[];
}
