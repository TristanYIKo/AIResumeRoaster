import type { CategoryId, TrackId } from "./types";

export interface Track {
    id: TrackId;
    label: string;
    /** What recruiters in this field look for. Injected into the prompt as the lens for scoring and roasting. */
    lens: string;
    /** Category weights for this field. Always sum to 100. */
    weights: Record<CategoryId, number>;
}

export const TRACKS: Track[] = [
    {
        id: "software",
        label: "Software",
        lens: "Software engineering. Recruiters want shipped projects with real users, scale or performance numbers, a tech stack that actually shows up in the work, and GitHub or live demo links. Roast laundry-list stacks, tutorial projects (to-do apps, weather apps, clones) with no twist, and vague bullets like \"worked on the backend\".",
        weights: { impact: 25, bullets: 15, story: 10, skills: 25, clarity: 10, ats: 15 },
    },
    {
        id: "data",
        label: "Data",
        lens: "Data science and analytics. Recruiters want the business impact of the analysis (decisions made, money saved, time cut), the methods and tools actually used (SQL, Python, models, dashboards), dataset scale, and clear problem framing. Roast \"used machine learning\" with no problem attached, Kaggle-only work dressed up as experience, and dashboards with no outcome.",
        weights: { impact: 25, bullets: 15, story: 15, skills: 25, clarity: 10, ats: 10 },
    },
    {
        id: "business",
        label: "Business",
        lens: "Business, consulting and operations. Recruiters want ownership, leadership, client or stakeholder impact in dollars or percentages, and structured problem solving. Clubs and case competitions only count when they show results. Roast \"assisted with projects\", soft-skill lists and inflated titles.",
        weights: { impact: 30, bullets: 20, story: 20, skills: 10, clarity: 10, ats: 10 },
    },
    {
        id: "finance",
        label: "Finance",
        lens: "Finance and banking. Recruiters expect a strict one-page format, education and GPA near the top, deal or transaction exposure, financial modelling (DCF, LBO, comps), Excel and valuation skills, and formal, precise wording. Roast casual tone, long bullets, missing technical finance skills and design-heavy layouts.",
        weights: { impact: 25, bullets: 20, story: 10, skills: 15, clarity: 20, ats: 10 },
    },
    {
        id: "marketing",
        label: "Marketing",
        lens: "Marketing and growth. Recruiters want campaign results (reach, CTR, conversion, follower or revenue growth), the channels and tools used, links to creative work, and audience insight. Roast \"managed social media\" with no numbers and buzzword-heavy summaries.",
        weights: { impact: 30, bullets: 20, story: 20, skills: 10, clarity: 10, ats: 10 },
    },
    {
        id: "design",
        label: "Design",
        lens: "Product and UX design. Recruiters want a portfolio link, a visible process (research, iteration, testing), outcomes for users, and tools used on real projects. Roast a missing portfolio link, tool lists with no projects, and pretty-pictures claims with no impact.",
        weights: { impact: 20, bullets: 15, story: 20, skills: 20, clarity: 15, ats: 10 },
    },
    {
        id: "general",
        label: "General",
        lens: "No specific field. Judge against general early-career standards.",
        weights: { impact: 25, bullets: 20, story: 15, skills: 15, clarity: 15, ats: 10 },
    },
];

export const TRACK_IDS = TRACKS.map((t) => t.id);

export const getTrack = (id: string | null | undefined): Track =>
    TRACKS.find((t) => t.id === id) ?? TRACKS[TRACKS.length - 1];

export const isTrackId = (v: unknown): v is TrackId => typeof v === "string" && (TRACK_IDS as string[]).includes(v);
