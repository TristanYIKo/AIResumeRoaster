import type { CategoryId, CategoryResult, Fix, Report, Rewrite, Roast, Tone, TrackId } from "./types";
import { toSignals, type Measurements } from "./signals";
import { getTrack, isTrackId } from "./tracks";

export interface CategoryDef {
    id: CategoryId;
    label: string;
    description: string;
}

/** Weights live per field in lib/tracks.ts and always sum to 100. */
export const CATEGORIES: CategoryDef[] = [
    { id: "impact", label: "Impact", description: "Bullets show results, not duties, and back them with numbers." },
    { id: "bullets", label: "Bullet craft", description: "Action verb, context, result. Tight, specific, consistent tense." },
    { id: "story", label: "Story", description: "A clear target role and a path that makes sense for it." },
    { id: "skills", label: "Skills", description: "Every listed skill shows up in real work or projects." },
    { id: "clarity", label: "Clarity", description: "Scannable, consistent, the right length, no clutter." },
    { id: "ats", label: "ATS-friendly", description: "Standard headings, parseable text, contact details present." },
];

export const ARCHETYPES = ["Intern", "Corporate NPC", "LinkedIn Influencer", "Quiet Achiever", "Future CEO"] as const;

export function scoreBand(overall: number): { label: string; tone: Tone } {
    if (overall >= 85) return { label: "Interview-ready", tone: "good" };
    if (overall >= 70) return { label: "Strong draft", tone: "good" };
    if (overall >= 55) return { label: "Needs polish", tone: "fair" };
    if (overall >= 40) return { label: "Needs work", tone: "weak" };
    return { label: "Needs a rebuild", tone: "weak" };
}

export function weightedOverall(categories: { score: number; weight: number }[]): number {
    const total = categories.reduce((sum, c) => sum + c.score * c.weight, 0);
    return Math.round(total / 100);
}

type Cap = { limit: number; reason: string };

/**
 * Evidence caps: hard limits a category can't exceed when the measured text contradicts a high score.
 * Only applied when the measurement is reliable (e.g. bullets came from real bullet markers).
 */
function evidenceCaps(m: Measurements): Partial<Record<CategoryId, Cap[]>> {
    const caps: Partial<Record<CategoryId, Cap[]>> = {};
    const add = (id: CategoryId, limit: number, reason: string) => {
        (caps[id] ??= []).push({ limit, reason });
    };

    const n = m.bullets.length;
    const reliableBullets = m.bulletSource === "marked" && n >= 5;

    if (reliableBullets) {
        const rate = m.quantified / n;
        if (m.quantified === 0) add("impact", 35, `none of your ${n} bullets has a number`);
        else if (rate < 0.2) add("impact", 55, `only ${m.quantified} of ${n} bullets have a number`);
        else if (rate < 0.35) add("impact", 70, `only ${m.quantified} of ${n} bullets have a number`);

        if (m.weakOpeners.length >= 4) add("bullets", 60, `${m.weakOpeners.length} bullets open with "helped" and friends`);
        if (m.avgBulletWords > 35) add("bullets", 60, `bullets average ${m.avgBulletWords} words`);
    }

    if (m.buzzwords.length >= 5) {
        add("skills", 65, `${m.buzzwords.length} buzzwords, zero proof`);
        add("clarity", 75, `${m.buzzwords.length} buzzwords read as filler`);
    }

    if (m.firstPerson >= 5) add("clarity", 70, `${m.firstPerson} uses of I, me or my`);
    if (m.wordCount > 1200) add("clarity", 65, `${m.wordCount} words is more than two pages`);

    if (!m.hasEmail) add("ats", 60, "no email address found");
    if (m.sections.length <= 1)
        add("ats", 55, `only ${m.sections.length} standard section heading${m.sections.length === 1 ? "" : "s"}`);

    return caps;
}

// ---------- validation helpers for model output ----------

/** Normalise model text: no markdown, no em/en dashes, single spaces, cut at a word boundary. */
const clean = (v: unknown, max = 400): string => {
    if (typeof v !== "string") return "";
    const text = v
        // Gemini sometimes marks quoted resume text with *emphasis* instead of quote marks.
        .replace(/\*{1,2}([^*]+?)\*{1,2}/g, (_, inner: string) =>
            inner.trim().split(/\s+/).length >= 3 ? `"${inner.trim()}"` : inner,
        )
        .replace(/\s*[—–]\s*/g, " - ")
        .replace(/\s+/g, " ")
        .trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:(]+$/, "") + "...";
};

/** "WORK EXPERIENCE" -> "Work experience". Leaves normal casing alone. */
const sectionName = (v: unknown): string => {
    const s = clean(v, 40);
    return s && s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s;
};

const clampScore = (v: unknown): number => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
};

const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);

const obj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};

export class ModelOutputError extends Error {}

/**
 * Validates the model's JSON and combines it with code-measured evidence into the final report.
 * `chosenTrack` is the field the user picked; null means the model's detected field is used.
 */
export function buildReport(raw: unknown, m: Measurements, fileName: string, chosenTrack: TrackId | null): Report {
    const data = obj(raw);
    const scores = obj(data.scores);
    const caps = evidenceCaps(m);

    const track = getTrack(chosenTrack ?? (isTrackId(data.track) ? data.track : "general"));

    const categories: CategoryResult[] = CATEGORIES.map((def) => {
        const entry = obj(scores[def.id]);
        if (entry.score === undefined) throw new ModelOutputError(`Missing score for ${def.id}`);

        const modelScore = clampScore(entry.score);
        const binding = (caps[def.id] ?? [])
            .filter((c) => c.limit < modelScore)
            .sort((a, b) => a.limit - b.limit)[0];

        return {
            id: def.id,
            label: def.label,
            weight: track.weights[def.id],
            modelScore,
            score: binding ? binding.limit : modelScore,
            verdict: clean(entry.verdict, 140),
            cap: binding,
        };
    });

    const overall = weightedOverall(categories);

    const roasts: Roast[] = list(data.roasts, 5)
        .map((r) => ({ section: sectionName(obj(r).section), text: clean(obj(r).text, 220) }))
        .filter((r) => r.text);

    const rewrites: Rewrite[] = list(data.rewrites, 2)
        .map((r) => ({ original: clean(obj(r).original, 300), improved: clean(obj(r).improved, 300) }))
        .filter((r) => r.original && r.improved);

    const fixes: Fix[] = list(data.fixes, 3)
        .map((f) => ({ title: clean(obj(f).title, 70), detail: clean(obj(f).detail, 160) }))
        .filter((f) => f.title);

    const archetypeRaw = obj(data.archetype);
    const archetypeName = clean(archetypeRaw.name, 40);

    return {
        fileName,
        track: { id: track.id, label: track.label, detected: chosenTrack === null },
        overall,
        band: scoreBand(overall),
        headline: clean(data.headline, 110),
        summary: clean(data.summary, 220),
        archetype: {
            name: (ARCHETYPES as readonly string[]).includes(archetypeName) ? archetypeName : "Corporate NPC",
            reason: clean(archetypeRaw.reason, 120),
        },
        categories,
        signals: toSignals(m),
        roasts,
        rewrites,
        fixes,
        strengths: list(data.strengths, 2)
            .map((s) => clean(s, 140))
            .filter(Boolean),
    };
}
