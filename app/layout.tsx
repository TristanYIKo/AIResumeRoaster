import type { Metadata } from "next";
import { Chewy } from "next/font/google";
import "./globals.css";

const chewy = Chewy({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-chewy",
});

export const metadata: Metadata = {
    title: "AI Career Roast",
    description: "Get your resume roasted by AI",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={chewy.className}>
                {children}
            </body>
        </html>
    );
}
