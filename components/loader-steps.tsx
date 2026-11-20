"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "./ui";

type StepState = "pending" | "active" | "done";

// When each step becomes active while we wait. The last one spins until the response lands.
const STEP_AT_MS = [0, 700, 1700, 4200, 8500];
const FINISH_STAGGER_MS = 170;
const FINISH_HOLD_MS = 650;

function StepIcon({ state }: { state: StepState }) {
    return (
        <span className="relative grid size-7 shrink-0 place-items-center">
            <AnimatePresence initial={false}>
                {state === "done" ? (
                    <motion.span
                        key="done"
                        className="absolute inset-0 grid place-items-center rounded-full bg-hot"
                        initial={{ scale: 0.2, opacity: 0, filter: "blur(8px)" }}
                        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 17 }}
                    >
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                            <motion.path
                                d="M5 12.5l4.5 4.5L19 7.5"
                                className="stroke-ink"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.35, delay: 0.1, ease: EASE }}
                            />
                        </svg>
                    </motion.span>
                ) : (
                    <motion.span
                        key="ring"
                        className="absolute inset-0"
                        exit={{ scale: 1.6, opacity: 0, filter: "blur(6px)" }}
                        transition={{ duration: 0.35, ease: EASE }}
                    >
                        <svg
                            viewBox="0 0 28 28"
                            aria-hidden
                            className={cn(
                                "size-full",
                                state === "active"
                                    ? "animate-[spin_0.8s_linear_infinite]"
                                    : "animate-[spin_3.5s_linear_infinite]",
                            )}
                        >
                            <circle cx="14" cy="14" r="11" fill="none" strokeWidth="3" className="stroke-ink/[0.1]" />
                            <circle
                                cx="14"
                                cy="14"
                                r="11"
                                fill="none"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={state === "active" ? "24 70" : "3 8.5"}
                                className={cn(
                                    "transition-[stroke] duration-300",
                                    state === "active" ? "stroke-hot" : "stroke-ink/25",
                                )}
                            />
                        </svg>
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}

export function LoaderSteps({
    steps,
    finishing,
    onFinished,
}: {
    steps: string[];
    finishing: boolean;
    onFinished: () => void;
}) {
    const [done, setDone] = useState(0);
    const finishedRef = useRef(onFinished);
    finishedRef.current = onFinished;

    // Advance on a rough clock while the request is in flight.
    useEffect(() => {
        const timers = STEP_AT_MS.slice(1, steps.length).map((ms, i) =>
            setTimeout(() => setDone((d) => Math.max(d, i + 1)), ms),
        );
        return () => timers.forEach(clearTimeout);
    }, [steps.length]);

    // Response is in: tick off whatever is left, one after another.
    useEffect(() => {
        if (!finishing) return;
        const id = setInterval(() => setDone((d) => Math.min(steps.length, d + 1)), FINISH_STAGGER_MS);
        return () => clearInterval(id);
    }, [finishing, steps.length]);

    const complete = finishing && done >= steps.length;
    useEffect(() => {
        if (!complete) return;
        const t = setTimeout(() => finishedRef.current(), FINISH_HOLD_MS);
        return () => clearTimeout(t);
    }, [complete]);

    const progress = Math.min(1, (done + (done < steps.length ? 0.45 : 0)) / steps.length);

    return (
        <div className="px-5 pb-5 pt-6 sm:px-7 sm:pt-7" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
                <motion.p
                    key={complete ? "done" : "wait"}
                    initial={{ opacity: 0, filter: "blur(6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(6px)" }}
                    transition={{ duration: 0.3 }}
                    className="font-hand text-2xl leading-none text-hot-ink"
                >
                    {complete ? "done! plating it up..." : "hang tight, about 15 seconds"}
                </motion.p>
            </AnimatePresence>

            <ol className="mt-5 space-y-4">
                {steps.map((label, i) => {
                    const state: StepState = i < done ? "done" : i === done ? "active" : "pending";
                    return (
                        <li key={label} className="flex items-center gap-3.5">
                            <StepIcon state={state} />
                            <motion.span
                                key={state}
                                initial={{ opacity: 0.35, filter: "blur(4px)" }}
                                animate={{ opacity: state === "pending" ? 0.45 : 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.45, ease: EASE }}
                                className={cn(
                                    "text-[17px] leading-tight",
                                    state === "active" ? "font-semibold text-ink" : state === "done" ? "text-ink" : "text-ink-2",
                                )}
                            >
                                {label}
                            </motion.span>
                        </li>
                    );
                })}
            </ol>

            <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
                <motion.div
                    className="h-full origin-left rounded-full bg-hot"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progress }}
                    transition={{ type: "spring", stiffness: 55, damping: 18 }}
                />
            </div>
        </div>
    );
}
