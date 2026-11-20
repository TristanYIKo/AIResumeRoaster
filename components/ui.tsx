"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;

/** Blur-in used for anything appearing on screen. */
export const blurIn = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 14 },
    show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: EASE } },
};

type PressButtonProps = HTMLMotionProps<"button"> & { size?: "md" | "lg"; busy?: boolean };

/** Primary pill. Springs up on hover, squishes on press. `busy` keeps the colour but stops interaction. */
export function PressButton({ className, disabled, busy, size = "md", children, ...props }: PressButtonProps) {
    const inert = disabled || busy;
    return (
        <motion.button
            type="button"
            disabled={inert}
            aria-busy={busy || undefined}
            whileHover={inert ? undefined : { scale: 1.025, y: -2 }}
            whileTap={inert ? undefined : { scale: 0.96, y: 0 }}
            transition={SPRING}
            className={cn(
                "inline-flex items-center justify-center gap-2.5 rounded-full font-bold tracking-tight transition-[background-color,box-shadow,color] duration-300",
                size === "lg" ? "h-16 px-9 text-xl" : "h-14 px-7 text-lg",
                busy
                    ? "cursor-progress bg-hot/85 text-ink"
                    : disabled
                      ? "cursor-not-allowed bg-ink/[0.07] text-ink/35"
                      : "bg-hot text-ink shadow-hot hover:shadow-[0_18px_36px_-14px_rgb(var(--hot)/0.85)]",
                className,
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
            transition={SPRING}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-paper/80 pl-3.5 pr-5 text-[15px] font-semibold text-ink ring-1 ring-ink/10 transition-colors hover:bg-paper"
        >
            <motion.span variants={{ rest: { x: 0 }, hover: { x: -3 } }} transition={SPRING} className="grid">
                <ArrowLeft className="size-[18px]" strokeWidth={2.25} aria-hidden />
            </motion.span>
            {label}
        </motion.button>
    );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h2 className={cn("text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.1rem]", className)}>{children}</h2>;
}

export function Bar({ value, className }: { value: number; className?: string }) {
    return (
        <div className={cn("h-3 overflow-hidden rounded-full bg-ink/[0.07]", className)}>
            <motion.div
                className="h-full origin-left rounded-full bg-hot"
                style={{ width: `${value}%` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE }}
            />
        </div>
    );
}
