import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import "./globals.css";

const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans", axes: ["opsz"] });
const hand = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
    title: "Roast-Bot | Get your resume roasted",
    description: "Drop your resume, pick your field, and get a score, a roast, and the fixes that actually matter.",
};

export const viewport: Viewport = {
    themeColor: "#FFF6EC",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${sans.variable} ${hand.variable}`}>
            <body>{children}</body>
        </html>
    );
}
