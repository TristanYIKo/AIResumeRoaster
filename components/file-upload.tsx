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
        <div className="w-full max-w-md mx-auto">
            <Card className={cn("border-2 border-dashed transition-colors", dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25")}>
                <CardContent className="p-0">
                    <div
                        className="flex flex-col items-center justify-center p-10 text-center cursor-pointer"
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
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-primary/10">
                                    <File className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-muted">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Click or drag file to upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT (Max 5MB)</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {error}
                </div>
            )}

            <Button
                className="w-full mt-6"
                size="lg"
                disabled={!file || loading}
                onClick={handleSubmit}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cooking your roast...
                    </>
                ) : (
                    "Roast Me 🔥"
                )}
            </Button>
        </div>
    );
}
