"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrack } from "@/lib/tracks";
import type { Report } from "@/lib/types";
import { LoaderSteps } from "./loader-steps";
import type { TrackChoice } from "./track-picker";
import { EASE, PressButton, SPRING } from "./ui";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["pdf", "docx", "txt"];

type Phase = "idle" | "loading" | "finishing";

const swap = {
    initial: { opacity: 0, filter: "blur(8px)", scale: 0.985 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, filter: "blur(8px)", scale: 0.985 },
    transition: { duration: 0.35, ease: EASE },
};

function formatSize(bytes: number) {
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validate(file: File): string | null {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "doc") return "Old .doc files won't open. Save it as .docx or PDF first.";
    if (!ACCEPTED.includes(ext)) return "That's not a PDF, DOCX or TXT.";
    if (file.size > MAX_BYTES) return "That file's over 5 MB. Try a smaller copy.";
    return null;
}

export function UploadCard({
    track,
    onResult,
    onBusyChange,
}: {
    track: TrackChoice;
    onResult: (report: Report) => void;
    onBusyChange: (busy: boolean) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [dragging, setDragging] = useState(false);
    const result = useRef<Report | null>(null);

    const steps = useMemo(
        () => [
            "Reading your resume",
            track === "auto"
                ? "Figuring out what field it's for"
                : `Holding it to ${getTrack(track).label.toLowerCase()} standards`,
            "Counting numbers, buzzwords and weak verbs",
            "Scoring it like a recruiter would",
            "Writing the roast",
        ],
        [track],
    );

    const choose = (next: File | undefined) => {
        if (!next) return;
        const problem = validate(next);
        setError(problem);
        if (!problem) setFile(next);
    };

    const submit = async () => {
        if (!file || phase !== "idle") return;
        setError(null);
        setPhase("loading");
        onBusyChange(true);
        try {
            const body = new FormData();
            body.append("file", file);
            body.append("track", track);
            const res = await fetch("/api/roast", { method: "POST", body });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) throw new Error(data?.error ?? "Something broke on our end. Try again.");
            result.current = data as Report;
            setPhase("finishing");
        } catch (err) {
            const message = err instanceof Error ? err.message : "";
            setError(!message || message === "Failed to fetch" ? "Couldn't reach the server. Check your connection." : message);
            setPhase("idle");
            onBusyChange(false);
        }
    };

    const finish = useCallback(() => {
        if (result.current) onResult(result.current);
    }, [onResult]);

    const busy = phase !== "idle";

    return (
        <div className="relative pt-8 lg:pt-0">
            <motion.p
                aria-hidden
                initial={{ opacity: 0, filter: "blur(6px)", rotate: 0 }}
                animate={{ opacity: 1, filter: "blur(0px)", rotate: 5 }}
                transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
                className="absolute right-4 top-0 z-10 font-hand text-[26px] leading-none text-hot-ink lg:-top-10"
            >
                psst, we never save it
            </motion.p>

            <motion.div
                initial={{ rotate: -3.5, opacity: 0, y: 28, filter: "blur(12px)" }}
                animate={{ rotate: -1.25, opacity: 1, y: 0, filter: "blur(0px)" }}
                whileHover={{ rotate: 0 }}
                transition={{ ...SPRING, opacity: { duration: 0.6 }, filter: { duration: 0.6 }, delay: 0.15 }}
                className="rounded-[32px] bg-paper p-3 shadow-card ring-1 ring-ink/[0.06]"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {busy ? (
                        <motion.div key="loader" {...swap}>
                            <LoaderSteps steps={steps} finishing={phase === "finishing"} onFinished={finish} />
                        </motion.div>
                    ) : (
                        <motion.label
                            key="drop"
                            {...swap}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                choose(e.dataTransfer.files?.[0]);
                            }}
                            className={cn(
                                "flex min-h-[19rem] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 py-8 text-center transition-colors duration-300",
                                "focus-within:outline focus-within:outline-[2.5px] focus-within:outline-offset-2 focus-within:outline-hot",
                                dragging ? "border-hot bg-peach/60" : "border-ink/15 bg-cream/70 hover:border-hot/50 hover:bg-peach/30",
                            )}
                        >
                            <input
                                type="file"
                                accept=".pdf,.docx,.txt"
                                className="sr-only"
                                onChange={(e) => {
                                    choose(e.target.files?.[0]);
                                    e.target.value = "";
                                }}
                            />
                            <AnimatePresence mode="wait" initial={false}>
                                {file ? (
                                    <motion.div key="file" {...swap} className="flex w-full max-w-sm flex-col items-center">
                                        <div className="flex w-full items-center gap-3 rounded-2xl bg-paper p-3 text-left shadow-[0_8px_20px_-12px_rgb(166_72_20/0.4)] ring-1 ring-ink/10">
                                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-peach text-hot-ink">
                                                <FileText className="size-5" strokeWidth={2} aria-hidden />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-semibold">{file.name}</span>
                                                <span className="block text-sm text-ink-2">{formatSize(file.size)}, ready to roast</span>
                                            </span>
                                            <motion.button
                                                type="button"
                                                aria-label="Remove file"
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={SPRING}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setFile(null);
                                                }}
                                                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                                            >
                                                <X className="size-[18px]" strokeWidth={2.25} />
                                            </motion.button>
                                        </div>
                                        <span className="mt-4 text-sm text-ink-2">Wrong file? Click anywhere here to swap it.</span>
                                    </motion.div>
                                ) : (
                                    <motion.div key="empty" {...swap} className="flex flex-col items-center">
                                        <motion.span
                                            animate={dragging ? { y: -8, rotate: -8, scale: 1.1 } : { y: 0, rotate: 0, scale: 1 }}
                                            transition={SPRING}
                                            className="grid size-16 place-items-center rounded-2xl bg-peach text-hot-ink"
                                        >
                                            <FileUp className="size-7" strokeWidth={2} aria-hidden />
                                        </motion.span>
                                        <span className="mt-5 text-2xl font-bold tracking-tight">
                                            {dragging ? "Let go, we've got it" : "Drop your resume here"}
                                        </span>
                                        <span className="mt-1.5 text-ink-2">
                                            or <span className="font-semibold text-ink underline decoration-hot decoration-2 underline-offset-4">pick a file</span>
                                        </span>
                                        <span className="mt-5 text-sm text-ink-2">PDF, DOCX or TXT, up to 5&nbsp;MB</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.label>
                    )}
                </AnimatePresence>

                <PressButton className="mt-3 w-full" disabled={!file} busy={busy} onClick={submit}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={busy ? "busy" : "idle"}
                            initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
                            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                            exit={{ opacity: 0, filter: "blur(6px)", y: -6 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="inline-flex items-center gap-2"
                        >
                            {busy ? "Roasting..." : "Roast it"}
                            {!busy && <ArrowRight className="size-5" strokeWidth={2.5} aria-hidden />}
                        </motion.span>
                    </AnimatePresence>
                </PressButton>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        role="alert"
                        initial={{ opacity: 0, filter: "blur(6px)", y: -6 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(6px)" }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="mt-4 rounded-2xl bg-weak/10 px-4 py-3 text-[15px] font-medium text-weak"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
