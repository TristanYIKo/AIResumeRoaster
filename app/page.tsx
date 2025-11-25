"use client";

import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { RoastResult } from "@/components/roast-result";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
    const [roastData, setRoastData] = useState<any>(null);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-24 bg-background text-foreground">
            <div className="relative flex flex-col items-center justify-center gap-8 w-full max-w-3xl">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        AI Career Roast 🔥
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-[600px] mx-auto">
                        Upload your resume. Get humbled. Improve your career.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!roastData ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full"
                        >
                            <FileUpload onRoastComplete={setRoastData} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full"
                        >
                            <RoastResult data={roastData} onReset={() => setRoastData(null)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <footer className="mt-20 text-center text-sm text-muted-foreground">
                <p>Powered by Gemini ✦ Built with Next.js</p>
            </footer>
        </main>
    );
}
