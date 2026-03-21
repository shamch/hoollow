"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Video, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaUploadProps {
    value?: string;
    onChange: (url: string) => void;
    type: "image" | "video";
    label?: string;
    aspectRatio?: "1:1" | "16:9" | "free";
    maxSizeMB?: number;
    onSizeExceeded?: () => void;
}

export default function MediaUpload({ value, onChange, type, label, aspectRatio = "free", maxSizeMB, onSizeExceeded }: MediaUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        // Size check
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
            setError(`File exceeds ${maxSizeMB}MB limit`);
            onSizeExceeded?.();
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            onChange(data.url);
        } catch (err) {
            setError("Failed to upload. Please try again.");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        await uploadFile(file);
    }, [maxSizeMB]);

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}

            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative cursor-pointer group overflow-hidden
                    bg-[#111114] border-2 border-dashed transition-all duration-300
                    ${isDragging ? "border-accent bg-accent/5 scale-[1.02]" : value ? "border-accent/30" : "border-white/5 hover:border-white/20"}
                    ${aspectRatio === "1:1" ? "aspect-square w-32" : aspectRatio === "16:9" ? "aspect-video w-full" : "min-h-[120px] w-full"}
                    rounded-2xl flex flex-col items-center justify-center p-4
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={type === "image" ? "image/*" : "video/*"}
                />

                <AnimatePresence mode="wait">
                    {uploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <Loader2 size={20} className="animate-spin text-accent" />
                            <span className="text-[10px] font-semibold text-zinc-500">Uploading...</span>
                        </motion.div>
                    ) : value ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 w-full h-full"
                        >
                            {type === "image" ? (
                                <img src={value} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                    <Video size={28} className="text-zinc-600" />
                                </div>
                            )}

                            <button
                                onClick={removeFile}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors z-10"
                            >
                                <X size={12} />
                            </button>

                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-green-500/20 backdrop-blur-md border border-green-500/30 flex items-center gap-1">
                                <Check size={8} className="text-green-500" />
                                <span className="text-[8px] font-semibold text-green-500 uppercase">Ready</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-2 text-center"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDragging ? "bg-accent/10 text-accent" : "bg-white/5 text-zinc-600 group-hover:text-zinc-400"}`}>
                                {isDragging ? <Upload size={18} /> : type === "image" ? <ImageIcon size={18} /> : <Video size={18} />}
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-zinc-400">
                                    {isDragging ? "Drop file here" : "Click or drag to upload"}
                                </p>
                                <p className="text-[8px] text-zinc-600 mt-0.5">
                                    {type === "image" ? "JPG, PNG, WebP" : `MP4, WebM${maxSizeMB ? ` (max ${maxSizeMB}MB)` : ""}`}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && (
                <p className="text-[10px] font-medium text-red-500 ml-1">
                    {error}
                </p>
            )}
        </div>
    );
}
