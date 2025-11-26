"use client";

import { useState } from "react";

// I'll use native drag and drop to avoid extra deps if possible, or just install react-dropzone.
// The user didn't explicitly ask for react-dropzone, but it's standard.
// I'll use native events for simplicity and to avoid another install step if I can, but react-dropzone is robust.
// Let's stick to native for now to keep it lightweight, or I can install it.
// Actually, I'll install react-dropzone, it's safer.
// I'll add it to the install command.
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onRoastComplete: (data: any) => void;
}

export function FileUpload({ onRoastComplete }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        setError(null);
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ];
        if (!validTypes.includes(file.type) && !file.name.endsWith(".txt")) { // .txt mime type can vary
            // fallback check for extension
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
                setError("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.");
                return;
            }
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB.");
            return;
        }
        setFile(file);
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/roast", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            onRoastComplete(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto font-chewy">
            <Card className={cn(
                "border-4 border-dashed border-roast-text/30 bg-roast-card transition-all duration-300 relative overflow-visible",
                dragActive ? "border-roast-orange scale-105" : "",
                "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl"
            )}>
                <CardContent className="p-0">
                    <div
                        className="flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-[300px]"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                            accept=".pdf,.doc,.docx,.txt"
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <div className="p-4 rounded-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <File className="w-10 h-10 text-roast-text" />
                                </div>
                                <div>
                                    <p className="font-bold text-xl text-roast-text">{file.name}</p>
                                    <p className="text-sm text-roast-text/70">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-roast-red hover:text-roast-red/80 hover:bg-roast-red/10 font-bold"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                {/* Robot Placeholder */}
                                <div className="w-40 h-40 relative">
                                    <img
                                        src="/roast-bot-mascot.png"
                                        alt="Roast-Bot"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute -right-2 -top-2 bg-roast-orange rounded-full p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                                        <Upload className="w-4 h-4 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="font-bold text-2xl text-roast-text">Feed the Roast-bot</p>
                                    <p className="text-sm font-medium text-roast-text/70 uppercase tracking-wide">
                                        PDF, DOC, DOCX, TXT - Max 5MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="mt-4 p-3 text-sm font-bold text-white bg-roast-red rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 animate-in slide-in-from-top-2">
                    <X className="w-5 h-5" />
                    {error}
                </div>
            )}

            <Button
                className={cn(
                    "w-full mt-8 h-14 text-xl font-bold rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    "bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white"
                )}
                disabled={!file || loading}
                onClick={handleSubmit}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Cooking your roast...
                    </>
                ) : (
                    "Start the Roasting & Learning! 🔥"
                )}
            </Button>
        </div>
    );
}
