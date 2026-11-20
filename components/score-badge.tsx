"use client";

import { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";
import { EASE } from "./ui";

const toneText: Record<Tone, string> = { good: "text-good", fair: "text-fair", weak: "text-weak" };

function noteFor(score: number) {
    if (score >= 85) return "honestly? great";
    if (score >= 70) return "pretty solid!";
    if (score >= 55) return "getting there...";
    if (score >= 40) return "oof.";
    return "we need to talk";
}

export function ScoreBadge({ score, band }: { score: number; band: { label: string; tone: Tone } }) {
    const numberRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = numberRef.current;
        if (!el) return;
        const controls = animate(0, score, {
            duration: 1.3,
            delay: 0.3,
            ease: EASE,
            onUpdate: (v) => {
                el.textContent = String(Math.round(v));
            },
        });
        return () => controls.stop();
    }, [score]);

    return (
        <div className="relative w-fit">
            <div className="relative size-[200px]">
                <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
                    <circle cx="100" cy="100" r="84" fill="none" strokeWidth="18" className="stroke-ink/[0.07]" />
                    <motion.circle
                        cx="100"
                        cy="100"
                        r="84"
                        fill="none"
                        strokeWidth="18"
                        strokeLinecap="round"
                        className="stroke-hot"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: score / 100 }}
                        transition={{ duration: 1.3, delay: 0.3, ease: EASE }}
                    />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <span ref={numberRef} aria-hidden className="block text-[4rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                            0
                        </span>
                        <span className="sr-only">Score: {score} out of 100</span>
                        <span aria-hidden className="mt-1 block text-sm font-semibold text-ink-2">
                            out of 100
                        </span>
                    </div>
                </div>
            </div>

            <motion.p
                aria-hidden
                initial={{ opacity: 0, scale: 0.6, filter: "blur(8px)", rotate: 0 }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)", rotate: 9 }}
                transition={{ delay: 1.45, type: "spring", stiffness: 300, damping: 16 }}
                className="absolute -top-10 left-[42%] whitespace-nowrap font-hand text-[30px] leading-none text-hot-ink"
            >
                {noteFor(score)}
            </motion.p>

            <p className={cn("mt-4 text-center text-lg font-bold", toneText[band.tone])}>{band.label}</p>
        </div>
    );
}
