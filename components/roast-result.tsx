"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Lightbulb, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import ReactMarkdown from "react-markdown";

interface RoastResultProps {
    data: {
        roastBullets: string[];
        tips: string[];
        careerLevel: string;
        realityCheckPercent: number;
        realityCheckLabel: string;
    };
    onReset: () => void;
}

export function RoastResult({ data, onReset }: RoastResultProps) {
    const container = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Flame className="w-6 h-6 text-orange-500" />
                            The Roast
                        </CardTitle>
                        <Badge variant="outline" className="text-lg py-1 px-3 border-primary/50">
                            {data.careerLevel}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {data.roastBullets.map((bullet, i) => (
                            <motion.li key={i} variants={item} className="flex gap-3 text-sm md:text-base items-start">
                                <span className="text-xl mt-0.5">💀</span>
                                <div className="flex-1">
                                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>li]:m-0">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p {...props} className="leading-relaxed" />,
                                                strong: ({ node, ...props }) => <span {...props} className="font-bold text-foreground" />,
                                                em: ({ node, ...props }) => <span {...props} className="italic" />
                                            }}
                                        >
                                            {bullet}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Reality Check
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Groundedness</span>
                                <span className="font-bold">{data.realityCheckPercent}%</span>
                            </div>
                            <Progress value={data.realityCheckPercent} className="h-3" />
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                            "{data.realityCheckLabel}"
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Quick Fixes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.tips.map((tip, i) => (
                                <motion.li key={i} variants={item} className="text-sm flex gap-2 items-start">
                                    <span className="text-primary mt-1">•</span>
                                    <div className="flex-1">
                                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p {...props} className="leading-relaxed" />,
                                                    strong: ({ node, ...props }) => <span {...props} className="font-bold text-foreground" />
                                                }}
                                            >
                                                {tip}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center pt-4">
                <Button onClick={onReset} variant="outline" size="lg" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Roast Another Resume
                </Button>
            </div>
        </motion.div>
    );
}
