import type { Config } from "tailwindcss";

// Colours are CSS variables (app/globals.css) so alpha modifiers like bg-hot/10 work.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
    content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                cream: token("cream"),
                paper: token("paper"),
                peach: token("peach"),
                ink: { DEFAULT: token("ink"), 2: token("ink-2") },
                hot: { DEFAULT: token("hot"), ink: token("hot-ink") },
                good: token("good"),
                fair: token("fair"),
                weak: token("weak"),
            },
            fontFamily: {
                sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
                hand: ["var(--font-hand)", "cursive"],
            },
            boxShadow: {
                card: "0 1px 0 rgb(var(--ink) / 0.04), 0 28px 56px -32px rgb(166 72 20 / 0.45)",
                hot: "0 12px 28px -12px rgb(var(--hot) / 0.75)",
            },
        },
    },
    plugins: [],
};

export default config;
