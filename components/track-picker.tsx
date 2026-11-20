"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TRACKS } from "@/lib/tracks";
import type { TrackId } from "@/lib/types";

export type TrackChoice = TrackId | "auto";

const OPTIONS: { id: TrackChoice; label: string }[] = [
    { id: "auto", label: "Auto-detect" },
    ...TRACKS.filter((t) => t.id !== "general").map((t) => ({ id: t.id, label: t.label })),
];

export function TrackPicker({
    value,
    onChange,
    disabled,
}: {
    value: TrackChoice;
    onChange: (v: TrackChoice) => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <p id="track-label" className="text-[15px] font-semibold">
                What&apos;s it for?
            </p>
            <div role="radiogroup" aria-labelledby="track-label" className="mt-3 flex flex-wrap gap-2">
                {OPTIONS.map((o) => {
                    const selected = o.id === value;
                    return (
                        <motion.button
                            key={o.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={disabled}
                            onClick={() => onChange(o.id)}
                            whileTap={disabled ? undefined : { scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 500, damping: 28 }}
                            className={cn(
                                "relative rounded-full px-4 py-2 text-[15px] font-semibold transition-colors duration-200",
                                selected ? "text-cream" : "bg-paper/70 text-ink ring-1 ring-ink/10 hover:bg-paper",
                                disabled && !selected && "opacity-50",
                            )}
                        >
                            {selected && (
                                <motion.span
                                    layoutId="track-pill"
                                    className="absolute inset-0 rounded-full bg-ink"
                                    transition={{ type: "spring", stiffness: 480, damping: 34 }}
                                />
                            )}
                            <span className="relative">{o.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
