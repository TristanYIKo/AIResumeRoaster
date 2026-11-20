import type { Signal, Tone } from "./types";

/**
 * Deterministic measurements taken from the resume text in code.
 * They are shown to the user as-is, handed to the model as ground truth,
 * and used to cap category scores the evidence can't support.
 */
export interface Measurements {
    wordCount: number;
    bullets: string[];
    /** "marked" = lines that start with a bullet glyph; "inferred" = sentence-like lines used as a fallback. */
    bulletSource: "marked" | "inferred";
    quantified: number;
    weakOpeners: string[];
    buzzwords: string[];
    firstPerson: number;
    avgBulletWords: number;
    sections: string[];
    hasEmail: boolean;
    hasPhone: boolean;
    hasLink: boolean;
}

// Bullet glyphs, including the private-use code points Word's Symbol font leaves behind in PDFs.
const BULLET_START = /^\s*(?:[•●▪◦‣∙·■□►▶✓✔➢➤\-–—*]||||||o(?=\s))\s*/;

const WEAK_OPENERS = [
    "responsible for",
    "helped",
    "assisted",
    "worked on",
    "involved in",
    "participated in",
    "tasked with",
    "duties included",
    "in charge of",
    "contributed to",
];

const BUZZWORDS = [
    "synergy",
    "synergies",
    "passionate",
    "hardworking",
    "hard-working",
    "team player",
    "detail-oriented",
    "detail oriented",
    "results-driven",
    "results driven",
    "go-getter",
    "self-starter",
    "self starter",
    "dynamic",
    "leverage",
    "leveraged",
    "fast-paced",
    "think outside the box",
    "motivated",
    "proven track record",
    "best-in-class",
    "rockstar",
    "ninja",
    "guru",
    "spearheaded",
];

const SECTION_PATTERNS: [string, RegExp][] = [
    ["Experience", /\b(experience|employment|work history)\b/i],
    ["Education", /\beducation\b/i],
    ["Skills", /\b(skills|technologies|tech stack|toolkit)\b/i],
    ["Projects", /\bprojects?\b/i],
];

const words = (s: string) => s.split(/\s+/).filter(Boolean);

function findBullets(lines: string[]): { bullets: string[]; source: "marked" | "inferred" } {
    const marked: string[] = [];
    let current: string | null = null;

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) {
            if (current) marked.push(current);
            current = null;
            continue;
        }
        if (BULLET_START.test(line)) {
            if (current) marked.push(current);
            current = line.replace(BULLET_START, "").trim();
        } else if (current && /^[a-z0-9(%$&]/.test(line)) {
            // PDF extraction wraps long bullets; a lowercase start means it's a continuation.
            current += " " + line;
        } else {
            if (current) marked.push(current);
            current = null;
        }
    }
    if (current) marked.push(current);

    const cleaned = marked.filter((b) => words(b).length >= 4);
    if (cleaned.length >= 3) return { bullets: cleaned, source: "marked" };

    // No bullet glyphs survived extraction. Fall back to sentence-like lines.
    const inferred = lines
        .map((l) => l.trim())
        .filter((l) => {
            const n = words(l).length;
            return n >= 7 && n <= 45 && /^[A-Z]/.test(l);
        });
    return { bullets: inferred, source: "inferred" };
}

const normalise = (w: string) => w.replace(/[-\s]/g, "");

export function measure(text: string): Measurements {
    const lines = text.split(/\r?\n/);
    const { bullets, source } = findBullets(lines);
    const lower = text.toLowerCase();

    const quantified = bullets.filter((b) => /\d|%|\$/.test(b)).length;

    const weakOpeners = bullets.filter((b) => {
        const start = b.toLowerCase();
        return WEAK_OPENERS.some((w) => start.startsWith(w));
    });

    const buzzwords = BUZZWORDS.filter((w) =>
        new RegExp(`\\b${w.replace(/[-\s]/g, "[-\\s]")}\\b`, "i").test(lower),
    ).filter((w, i, all) => all.findIndex((x) => normalise(x) === normalise(w)) === i);

    const firstPerson = (text.match(/\bI\b|\b(?:my|me|mine|myself)\b/gi) ?? []).filter((m) => m !== "i").length;

    const sections = SECTION_PATTERNS.filter(([, re]) =>
        lines.some((l) => {
            const t = l.trim();
            return t.length > 0 && words(t).length <= 4 && re.test(t);
        }),
    ).map(([name]) => name);

    const bulletWords = bullets.map((b) => words(b).length);
    const avgBulletWords = bulletWords.length
        ? Math.round(bulletWords.reduce((a, b) => a + b, 0) / bulletWords.length)
        : 0;

    return {
        wordCount: words(text).length,
        bullets,
        bulletSource: source,
        quantified,
        weakOpeners,
        buzzwords,
        firstPerson,
        avgBulletWords,
        sections,
        hasEmail: /[\w.+-]+@[\w-]+\.[\w.]+/.test(text),
        hasPhone: /(\+?\d[\d\s().-]{8,}\d)/.test(text),
        hasLink: /(linkedin\.com|github\.com|https?:\/\/|www\.)/i.test(text),
    };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function grade(value: number, good: (v: number) => boolean, fair: (v: number) => boolean): Tone {
    if (good(value)) return "good";
    if (fair(value)) return "fair";
    return "weak";
}

/** Short, casual chips for the report. */
export function toSignals(m: Measurements): Signal[] {
    const n = m.bullets.length;
    const rate = n ? Math.round((m.quantified / n) * 100) : 0;
    const contact = [m.hasEmail, m.hasPhone, m.hasLink].filter(Boolean).length;

    return [
        {
            id: "quantified",
            chip: n ? `${m.quantified} of ${n} bullets have a number` : "No bullet points found",
            tone: grade(rate, (v) => v >= 50, (v) => v >= 25),
        },
        {
            id: "weak",
            chip: plural(m.weakOpeners.length, "weak opener", "weak openers"),
            tone: grade(m.weakOpeners.length, (v) => v === 0, (v) => v <= 2),
        },
        {
            id: "buzzwords",
            chip: plural(m.buzzwords.length, "buzzword", "buzzwords"),
            tone: grade(m.buzzwords.length, (v) => v <= 1, (v) => v <= 3),
        },
        {
            id: "pronouns",
            chip: plural(m.firstPerson, "use of I, me or my", "uses of I, me or my"),
            tone: grade(m.firstPerson, (v) => v === 0, (v) => v <= 2),
        },
        {
            id: "length",
            chip: m.avgBulletWords ? `${m.avgBulletWords}-word bullets on average` : "Bullet length unknown",
            tone: grade(m.avgBulletWords, (v) => v >= 10 && v <= 25, (v) => (v >= 7 && v < 10) || (v > 25 && v <= 32)),
        },
        {
            id: "words",
            chip: `${m.wordCount} words total`,
            tone: grade(m.wordCount, (v) => v >= 300 && v <= 800, (v) => (v >= 200 && v < 300) || (v > 800 && v <= 1000)),
        },
        {
            id: "sections",
            chip: `${m.sections.length} of 4 standard sections`,
            tone: grade(m.sections.length, (v) => v >= 3, (v) => v === 2),
        },
        {
            id: "contact",
            chip: contact === 3 ? "Email, phone and link present" : `${contact} of 3 contact details`,
            tone: grade(contact, (v) => v >= 2, (v) => v === 1),
        },
    ];
}

/** A compact, factual brief the model treats as ground truth. */
export function describeForModel(m: Measurements): string {
    return [
        `Word count: ${m.wordCount}`,
        `Bullet points detected: ${m.bullets.length} (${m.bulletSource === "marked" ? "from bullet markers" : "inferred from sentence-like lines, less reliable"})`,
        `Bullets containing a number, % or $: ${m.quantified} of ${m.bullets.length}`,
        `Bullets opening with a weak phrase: ${m.weakOpeners.length}`,
        `Buzzwords found: ${m.buzzwords.length ? m.buzzwords.join(", ") : "none"}`,
        `First-person pronouns: ${m.firstPerson}`,
        `Average bullet length: ${m.avgBulletWords} words`,
        `Standard section headings found: ${m.sections.length ? m.sections.join(", ") : "none"}`,
        `Contact details: email ${m.hasEmail ? "yes" : "no"}, phone ${m.hasPhone ? "yes" : "no"}, profile link ${m.hasLink ? "yes" : "no"}`,
    ].join("\n");
}
