"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Report } from "@/lib/types";
import { ReportView } from "./report-view";
import { TrackPicker, type TrackChoice } from "./track-picker";
import { UploadCard } from "./upload-card";
import { blurIn, EASE } from "./ui";

function Swoosh() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 220 24"
            preserveAspectRatio="none"
            className="absolute -bottom-[0.1em] left-[-3%] h-[0.24em] w-[106%] overflow-visible"
        >
            <motion.path
                d="M4 17 C 60 6, 140 3, 216 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.75, delay: 0.55, ease: EASE }}
            />
        </svg>
    );
}

function Landing({
    track,
    onTrack,
    onResult,
}: {
    track: TrackChoice;
    onTrack: (t: TrackChoice) => void;
    onResult: (r: Report) => void;
}) {
    const [busy, setBusy] = useState(false);

    return (
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 sm:px-8">
            <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-20">
                <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
                    <motion.h1
                        variants={blurIn}
                        className="text-[clamp(3.1rem,7.2vw,5.6rem)] font-extrabold leading-[0.92] tracking-[-0.045em]"
                    >
                        Let&apos;s{" "}
                        <span className="relative inline-block text-hot">
                            roast
                            <Swoosh />
                        </span>
                        <br />
                        your resume.
                    </motion.h1>
                    <motion.p variants={blurIn} className="mt-7 max-w-[34ch] text-xl leading-snug text-ink-2">
                        Pick the field, drop the file. Get a score, the roast, and the fixes that actually matter.
                    </motion.p>
                    <motion.div variants={blurIn} className="mt-10">
                        <TrackPicker value={track} onChange={onTrack} disabled={busy} />
                    </motion.div>
                </motion.div>

                <UploadCard track={track} onResult={onResult} onBusyChange={setBusy} />
            </div>
        </div>
    );
}

/**
 * One screen at a time. Leaving blurs the current screen out, then the next one mounts and blurs in.
 * Driven by state rather than AnimatePresence, whose exit could stall with layoutId children inside.
 */
function Stage({
    leaving,
    enter,
    onLeft,
    children,
}: {
    leaving: boolean;
    enter: boolean;
    onLeft: () => void;
    children: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={enter ? { opacity: 0, filter: "blur(14px)", y: reduce ? 0 : 20 } : false}
            animate={
                leaving
                    ? { opacity: 0, filter: "blur(14px)", y: 0, scale: 0.985 }
                    : { opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }
            }
            transition={{ duration: leaving ? 0.45 : 0.6, ease: EASE }}
            onAnimationComplete={() => {
                if (leaving) onLeft();
            }}
        >
            {children}
        </motion.div>
    );
}

export function RoastApp() {
    const [report, setReport] = useState<Report | null>(null);
    const [track, setTrack] = useState<TrackChoice>("auto");
    const [leaving, setLeaving] = useState(false);
    const next = useRef<Report | null>(null);
    const hasSwapped = useRef(false);

    const goTo = (target: Report | null) => {
        next.current = target;
        setLeaving(true);
    };

    const swap = () => {
        hasSwapped.current = true;
        setReport(next.current);
        setLeaving(false);
        window.scrollTo({ top: 0 });
    };

    return report ? (
        <Stage key="report" leaving={leaving} enter onLeft={swap}>
            <ReportView report={report} onBack={() => goTo(null)} />
        </Stage>
    ) : (
        <Stage key="landing" leaving={leaving} enter={hasSwapped.current} onLeft={swap}>
            <Landing track={track} onTrack={setTrack} onResult={goTo} />
        </Stage>
    );
}
