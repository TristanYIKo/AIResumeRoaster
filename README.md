# Roast-Bot

Resume review that doesn't hold back. Pick your field, upload a resume, and get a score, a field-specific roast, rewrites for your weakest bullets, and the three fixes that matter most.

Built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion and Google Gemini.

## How the score works

Every resume is judged through a field lens: Software, Data, Business, Finance, Marketing or Design (picked by the user or auto-detected). The lens changes what the reviewer looks for and how the six categories are weighted (`lib/tracks.ts`). Finance, for example, weights clarity and formatting at 20%, while Software puts 25% on skills that are backed by real work.

| Category | What it checks |
| --- | --- |
| Impact | Bullets show results, not duties, and back them with numbers |
| Bullet craft | Action verb, context, result. Tight, specific, consistent tense |
| Story | A clear target role and a path that makes sense for it |
| Skills | Every listed skill shows up in real work or projects |
| Clarity | Scannable, consistent, the right length |
| ATS-friendly | Standard headings, parseable text, contact details |

Scoring happens in three passes:

1. **Measure.** `lib/signals.ts` counts bullets, quantified bullets, weak openers ("helped", "worked on"), buzzwords, first-person pronouns, section headings and contact details directly from the extracted text.
2. **Score.** Gemini rates each category against anchored rubric bands (`lib/prompt.ts`). It returns structured JSON validated against a response schema, writes its evidence before each score, and receives the measurements as ground truth.
3. **Cap.** `lib/scoring.ts` caps any category the measurements contradict. For example, impact can't exceed 55 when fewer than 20% of bullets contain a number. The report shows every cap and its reason. The overall number is computed in code, never by the model.

## Running locally

```bash
npm install
cp .env.example .env.local   # then add your key
npm run dev
```

| Variable | Required | Default |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` |

## Project structure

```
app/api/roast/route.ts   Upload handling, measurement, Gemini call, report assembly
lib/extract.ts           PDF (pdf-parse), DOCX (mammoth) and TXT text extraction
lib/signals.ts           Deterministic measurements
lib/prompt.ts            System prompt, rubric and response schema
lib/tracks.ts            Field lenses and per-field category weights
lib/scoring.ts           Categories, evidence caps, validation
components/              Landing page, loader and report view
```

## Privacy

Uploaded files are read in memory and never written to disk or stored. The extracted text is sent to Google Gemini for analysis.
