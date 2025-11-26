"use client";

import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { RoastResult } from "@/components/roast-result";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
    const [roastData, setRoastData] = useState<any>(null);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-roast-bg relative overflow-hidden font-chewy">
            {/* Background Robots */}
            <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                <img
                    src="/robot-background-rich.png"
                    alt="Background Robots"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative flex flex-col items-center justify-center gap-6 w-full max-w-2xl z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-wider text-roast-text drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                        Roast-Bot 🔥
                    </h1>
                    <p className="text-roast-text text-xl md:text-2xl max-w-[600px] mx-auto font-medium">
                        Your ai resume roaster, upload your resume and let the roasting begin!
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!roastData ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full"
                        >
                            <FileUpload onRoastComplete={setRoastData} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full"
                        >
                            <RoastResult data={roastData} onReset={() => setRoastData(null)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
