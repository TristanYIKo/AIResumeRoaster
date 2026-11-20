"use client";

import { motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report, Tone } from "@/lib/types";
import { ScoreBadge } from "./score-badge";
import { BackButton, Bar, blurIn, PressButton, SectionTitle } from "./ui";

const chipTone: Record<Tone, string> = {
    good: "bg-good/10 text-good",
    fair: "bg-fair/10 text-fair",
    weak: "bg-weak/10 text-weak",
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };

/** Reveals each block as it scrolls into view. */
function Block({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.section
            variants={blurIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

export function ReportView({ report, onBack }: { report: Report; onBack: () => void }) {
    const { track, archetype, roasts, fixes, categories, rewrites, signals, strengths } = report;

    return (
        <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
            <div className="flex h-20 items-center">
                <BackButton onClick={onBack} />
            </div>

            {/* Verdict */}
            <motion.header
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid items-center gap-10 pt-2 md:grid-cols-[auto_1fr] md:gap-16"
            >
                <motion.div variants={blurIn} className="justify-self-center md:justify-self-start">
                    <ScoreBadge score={report.overall} band={report.band} />
                </motion.div>
                <div>
                    <motion.div variants={blurIn} className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-hot px-3.5 py-1.5 text-sm font-bold">{track.label} resume</span>
                        <span className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-bold ring-1 ring-ink/10">
                            {archetype.name}
                        </span>
                        {track.detected && <span className="font-hand text-xl leading-none text-ink-2">(our guess)</span>}
                    </motion.div>
                    <motion.h1
                        variants={blurIn}
                        className="mt-5 text-balance text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.04em]"
                    >
                        {report.headline || "Here's the damage."}
                    </motion.h1>
                    {report.summary && (
                        <motion.p variants={blurIn} className="mt-5 max-w-[46ch] text-lg leading-snug text-ink-2">
                            {report.summary}
                        </motion.p>
                    )}
                </div>
            </motion.header>

            {/* Roast */}
            {roasts.length > 0 && (
                <Block className="mt-20">
                    <SectionTitle>The roast</SectionTitle>
                    <ol className="mt-6 grid gap-4 md:grid-cols-2">
                        {roasts.map((r, i) => (
                            <motion.li
                                key={i}
                                whileHover={{ rotate: 0, y: -3 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                style={{ rotate: i % 2 ? 0.6 : -0.6 }}
                                className={cn(
                                    "rounded-[24px] bg-paper p-6 shadow-card ring-1 ring-ink/[0.05]",
                                    roasts.length % 2 === 1 && i === roasts.length - 1 && "md:col-span-2",
                                )}
                            >
                                {r.section && <p className="font-hand text-[22px] leading-none text-hot-ink">{r.section}</p>}
                                <p className="mt-2 text-lg font-medium leading-snug">{r.text}</p>
                            </motion.li>
                        ))}
                    </ol>
                </Block>
            )}

            {/* Fixes + breakdown */}
            <div className="mt-20 grid gap-16 md:grid-cols-2 md:gap-14">
                {fixes.length > 0 && (
                    <Block>
                        <SectionTitle>Fix these first</SectionTitle>
                        <ol className="mt-6 space-y-6">
                            {fixes.map((f, i) => (
                                <li key={i} className="flex gap-4">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hot text-lg font-extrabold">
                                        {i + 1}
                                    </span>
                                    <div className="pt-1">
                                        <p className="text-xl font-bold leading-tight tracking-tight">{f.title}</p>
                                        <p className="mt-1.5 leading-snug text-ink-2">{f.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Block>
                )}

                <Block>
                    <SectionTitle>The breakdown</SectionTitle>
                    <ul className="mt-6 space-y-5">
                        {categories.map((c) => (
                            <li key={c.id}>
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="text-lg font-bold tracking-tight">{c.label}</span>
                                    <span className="text-lg font-extrabold tabular-nums">{c.score}</span>
                                </div>
                                <Bar value={c.score} className="mt-2" />
                                {c.cap ? (
                                    <p className="mt-1.5 font-hand text-xl leading-tight text-hot-ink">capped: {c.cap.reason}</p>
                                ) : (
                                    c.verdict && <p className="mt-1.5 text-[15px] leading-snug text-ink-2">{c.verdict}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </Block>
            </div>

            {/* Rewrites */}
            {rewrites.length > 0 && (
                <Block className="mt-20">
                    <SectionTitle>Steal these rewrites</SectionTitle>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {rewrites.map((r, i) => (
                            <div key={i} className="rounded-[24px] bg-paper p-6 shadow-card ring-1 ring-ink/[0.05]">
                                <p className="leading-snug text-ink-2 line-through decoration-hot/60 decoration-2">{r.original}</p>
                                <p className="mt-4 font-hand text-[22px] leading-none text-hot-ink">try:</p>
                                <p className="mt-1.5 text-lg font-medium leading-snug">{r.improved}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 font-hand text-xl text-ink-2">swap the [brackets] for your real numbers</p>
                </Block>
            )}

            {/* Stats + strengths */}
            <div className="mt-20 grid gap-16 md:grid-cols-2 md:gap-14">
                <Block>
                    <SectionTitle>Quick stats</SectionTitle>
                    <ul className="mt-6 flex flex-wrap gap-2">
                        {signals.map((s) => (
                            <li key={s.id} className={cn("rounded-full px-3.5 py-2 text-[15px] font-semibold", chipTone[s.tone])}>
                                {s.chip}
                            </li>
                        ))}
                    </ul>
                </Block>

                {strengths.length > 0 && (
                    <Block>
                        <SectionTitle>Keep doing this</SectionTitle>
                        <ul className="mt-6 space-y-3">
                            {strengths.map((s, i) => (
                                <li key={i} className="flex gap-3 text-lg leading-snug">
                                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-good/15 text-good">
                                        <Check className="size-4" strokeWidth={3} aria-hidden />
                                    </span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </Block>
                )}
            </div>

            <Block className="mt-24 flex justify-center">
                <PressButton size="lg" onClick={onBack}>
                    <RotateCcw className="size-5" strokeWidth={2.5} aria-hidden />
                    Roast another one
                </PressButton>
            </Block>
        </div>
    );
}
