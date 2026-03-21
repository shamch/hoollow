"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Rocket, Github, Image as ImageIcon, Sparkles, Video, Link, Check, AlertCircle, Loader2, Monitor, Users } from "lucide-react";
import Button from "@/components/Button";
import MediaUpload from "@/components/MediaUpload";

interface LaunchpadModalsProps {
    showSubmit: boolean;
    onCloseSubmit: () => void;
    newProject: any;
    setNewProject: (p: any) => void;
    submitting: boolean;
    onSubmit: () => void;
}

export default function LaunchpadModals({ 
    showSubmit, onCloseSubmit, newProject, setNewProject, submitting, onSubmit 
}: LaunchpadModalsProps) {
    const [checkingDemo, setCheckingDemo] = useState(false);
    const [checkingGithub, setCheckingGithub] = useState(false);
    const [demoStatus, setDemoStatus] = useState<{ ok?: boolean; message?: string }>({});
    const [githubStatus, setGithubStatus] = useState<{ ok?: boolean; message?: string }>({});
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");

    const validateUrl = async (url: string, isGithub: boolean = false) => {
        if (!url) return;
        const setter = isGithub ? setCheckingGithub : setCheckingDemo;
        const statusSetter = isGithub ? setGithubStatus : setDemoStatus;

        setter(true);
        try {
            const res = await fetch("/api/projects/check-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, isGithub })
            });
            const data = await res.json();
            statusSetter({ ok: data.ok, message: data.message });
        } catch (e) {
            statusSetter({ ok: false, message: "Validation service unavailable" });
        } finally {
            setter(false);
        }
    };

    const handleMediaChange = (index: number, field: string, value: any) => {
        const newMedia = [...(newProject.media || [])];
        if (!newMedia[index]) newMedia[index] = { url: "", type: "image" };
        newMedia[index] = { ...newMedia[index], [field]: value };
        setNewProject({ ...newProject, media: newMedia });
    };

    return (
        <AnimatePresence>
            {showSubmit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onCloseSubmit}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 flex flex-col"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <Rocket size={24} className="text-accent" /> Launch Project
                                </h3>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mt-1 flex items-center gap-2">
                                    <Sparkles size={10} /> Reveal your breakthrough to the ecosystem
                                </p>
                            </div>
                            <button onClick={onCloseSubmit} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            {/* Section: Core Identity */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Project Name</label>
                                        <input
                                            type="text"
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            placeholder="Ex: Hoollow"
                                            className="w-full bg-[#111114] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent/30 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Category</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["SaaS", "Hardware", "Social", "EdTech", "AI/ML", "Open Source", "FinTech", "DevTools"].map(cat => {
                                                const selected = Array.isArray(newProject.tags)
                                                    ? newProject.tags.includes(cat)
                                                    : typeof newProject.tags === "string" && newProject.tags.split(",").map((t: string) => t.trim()).includes(cat);
                                                return (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = Array.isArray(newProject.tags)
                                                                ? newProject.tags
                                                                : typeof newProject.tags === "string" && newProject.tags
                                                                    ? newProject.tags.split(",").map((t: string) => t.trim())
                                                                    : [];
                                                            const updated = selected
                                                                ? current.filter((t: string) => t !== cat)
                                                                : [...current, cat];
                                                            setNewProject({ ...newProject, tags: updated });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selected
                                                            ? "bg-white text-black border-white"
                                                            : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300"
                                                        }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const el = document.getElementById("custom-tag-input");
                                                    if (el) el.style.display = el.style.display === "none" ? "flex" : "none";
                                                }}
                                                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-zinc-500 border border-dashed border-white/10 hover:text-zinc-300 transition-all"
                                            >
                                                + Other
                                            </button>
                                        </div>
                                        <div id="custom-tag-input" className="gap-2 mt-2" style={{ display: "none" }}>
                                            <input
                                                type="text"
                                                placeholder="Custom tag..."
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        const val = (e.target as HTMLInputElement).value.trim();
                                                        if (!val) return;
                                                        const current = Array.isArray(newProject.tags)
                                                            ? newProject.tags
                                                            : typeof newProject.tags === "string" && newProject.tags
                                                                ? newProject.tags.split(",").map((t: string) => t.trim())
                                                                : [];
                                                        if (!current.includes(val)) {
                                                            setNewProject({ ...newProject, tags: [...current, val] });
                                                        }
                                                        (e.target as HTMLInputElement).value = "";
                                                    }
                                                }}
                                                className="flex-1 bg-[#111114] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/30 transition-all font-medium"
                                            />
                                            <p className="text-[8px] text-zinc-600 mt-1 ml-1">Press Enter to add</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Project Pitch</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="What problem does it solve? Why now?"
                                        rows={3}
                                        className="w-full bg-[#111114] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent/30 transition-all font-medium resize-none"
                                    />
                                </div>
                            </div>

                            {/* Section: Brand Assets */}
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-px bg-white/10" /> Brand Identity
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <MediaUpload 
                                            label="Logo (1:1)"
                                            type="image"
                                            aspectRatio="1:1"
                                            value={newProject.logo}
                                            onChange={(url) => setNewProject({ ...newProject, logo: url })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <MediaUpload 
                                            label="Banner (16:9)"
                                            type="image"
                                            aspectRatio="16:9"
                                            value={newProject.banner}
                                            onChange={(url) => setNewProject({ ...newProject, banner: url })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Screenshots */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-px bg-white/10" /> Screenshots
                                    <span className="text-zinc-600 font-bold text-[9px] tracking-normal normal-case">({(newProject.media || []).filter((m: any) => m.type === "image").length}/4)</span>
                                </h4>

                                {/* Single uploader — hidden once 4 images reached */}
                                {(newProject.media || []).filter((m: any) => m.type === "image").length < 4 && (
                                    <MediaUpload
                                        type="image"
                                        value=""
                                        onChange={(url) => {
                                            if (!url) return;
                                            setNewProject({ ...newProject, media: [...(newProject.media || []), { url, type: "image" }] });
                                        }}
                                        aspectRatio="16:9"
                                    />
                                )}

                                {/* Uploaded thumbnails */}
                                {(newProject.media || []).filter((m: any) => m.type === "image").length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {(newProject.media || []).filter((m: any) => m.type === "image").map((img: any, idx: number) => (
                                            <div key={idx} className="relative rounded-xl overflow-hidden border border-white/5 aspect-square group">
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => {
                                                        const allMedia = [...(newProject.media || [])];
                                                        const realIdx = allMedia.findIndex((m: any) => m.url === img.url);
                                                        allMedia.splice(realIdx, 1);
                                                        setNewProject({ ...newProject, media: allMedia });
                                                    }}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Section: Video (1 slot, 30MB max) */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-px bg-white/10" /> Demo Video
                                    <span className="text-zinc-600 font-bold text-[9px] tracking-normal normal-case">max 30MB</span>
                                </h4>
                                {(() => {
                                    const video = (newProject.media || []).find((m: any) => m.type === "video");
                                    if (video) {
                                        return (
                                            <div className="relative rounded-xl overflow-hidden border border-white/5 aspect-video group">
                                                {video.url.includes("youtube") || video.url.includes("youtu.be") ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400">
                                                        <Video size={24} className="mr-2" /> YouTube: {video.url}
                                                    </div>
                                                ) : (
                                                    <video src={video.url} className="w-full h-full object-cover" controls />
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const allMedia = (newProject.media || []).filter((m: any) => m.type !== "video");
                                                        setNewProject({ ...newProject, media: allMedia });
                                                        setShowYoutubeInput(false);
                                                    }}
                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="space-y-3">
                                            {!showYoutubeInput && (
                                                <MediaUpload
                                                    type="video"
                                                    value=""
                                                    maxSizeMB={30}
                                                    onSizeExceeded={() => setShowYoutubeInput(true)}
                                                    onChange={(url) => {
                                                        if (!url) return;
                                                        setNewProject({ ...newProject, media: [...(newProject.media || []), { url, type: "video" }] });
                                                    }}
                                                    aspectRatio="16:9"
                                                />
                                            )}
                                            {showYoutubeInput && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] text-amber-400 font-semibold">Video too large? Paste a YouTube link instead:</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="url"
                                                            value={youtubeUrl}
                                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                                            placeholder="https://youtube.com/watch?v=..."
                                                            className="flex-1 bg-[#111114] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/30 transition-all"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                if (!youtubeUrl.trim()) return;
                                                                setNewProject({ ...newProject, media: [...(newProject.media || []), { url: youtubeUrl, type: "video" }] });
                                                                setYoutubeUrl("");
                                                                setShowYoutubeInput(false);
                                                            }}
                                                            className="px-4 rounded-xl bg-white/5 text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    <button onClick={() => setShowYoutubeInput(false)} className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors">
                                                        ← Back to file upload
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Section: Connectivity & Open Source */}
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-px bg-white/10" /> Connectivity
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Monitor size={12} /> Demo Link</label>
                                            {demoStatus.ok !== undefined && (
                                                <span className={`text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${demoStatus.ok ? "text-green-500" : "text-red-500"}`}>
                                                    {demoStatus.ok ? <Check size={10} /> : <AlertCircle size={10} />}
                                                    {demoStatus.message}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <input
                                                type="url"
                                                value={newProject.demoUrl}
                                                onChange={(e) => setNewProject({ ...newProject, demoUrl: e.target.value })}
                                                onBlur={() => validateUrl(newProject.demoUrl)}
                                                placeholder="https://yourdemo.com"
                                                className="flex-1 bg-[#111114] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent/30 transition-all"
                                            />
                                            <button 
                                                onClick={() => validateUrl(newProject.demoUrl)}
                                                disabled={checkingDemo}
                                                className="px-6 rounded-2xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                {checkingDemo ? <Loader2 size={16} className="animate-spin" /> : "Verify OK"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                                <Github size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-widest">Protocol is Open Source</p>
                                                <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter">Share the logic with other builders</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setNewProject({ ...newProject, isOpenSource: !newProject.isOpenSource })} 
                                            className={`w-14 h-7 rounded-full relative transition-colors ${newProject.isOpenSource ? "bg-accent" : "bg-white/10"}`}
                                        >
                                            <motion.div 
                                                animate={{ x: newProject.isOpenSource ? 32 : 4 }}
                                                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg" 
                                            />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {newProject.isOpenSource && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="space-y-2"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Github size={12} /> Repository URL</label>
                                                    {githubStatus.ok !== undefined && (
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${githubStatus.ok ? "text-green-500" : "text-red-500"}`}>
                                                            {githubStatus.ok ? <Check size={10} /> : <AlertCircle size={10} />}
                                                            {githubStatus.message}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="url"
                                                        value={newProject.githubUrl}
                                                        onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                                                        onBlur={() => validateUrl(newProject.githubUrl, true)}
                                                        placeholder="github.com/org/repo"
                                                        className="flex-1 bg-[#111114] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent/30 transition-all font-mono"
                                                    />
                                                    <button 
                                                        onClick={() => validateUrl(newProject.githubUrl, true)}
                                                        disabled={checkingGithub}
                                                        className="px-6 rounded-2xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                                                    >
                                                        {checkingGithub ? <Loader2 size={16} className="animate-spin" /> : "Check Repo"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Section: Collaboration */}
                            <div className="flex items-center justify-between p-6 bg-[#111114] rounded-[32px] border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase tracking-widest">Open for Collaboration</p>
                                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter">Allow builders to join your project team</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setNewProject({ ...newProject, openToCollab: !newProject.openToCollab })} 
                                    className={`w-14 h-7 rounded-full relative transition-colors ${newProject.openToCollab ? "bg-green-500" : "bg-white/10"}`}
                                >
                                    <motion.div 
                                        animate={{ x: newProject.openToCollab ? 32 : 4 }}
                                        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg" 
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 bg-zinc-900 border-t border-white/5 z-20">
                            <Button 
                                variant="primary" 
                                onClick={onSubmit} 
                                disabled={submitting || !newProject.name || !newProject.description}
                                className="w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                {submitting ? "Initiating Protocol..." : "Confirm Project Launch 🚀"}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
