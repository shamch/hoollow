"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Rocket } from "lucide-react";
import { Project } from "@/components/launchpad/constants";
import LaunchpadHeader from "@/components/launchpad/LaunchpadHeader";
import LaunchpadSidebar from "@/components/launchpad/LaunchpadSidebar";
import LaunchpadGrid from "@/components/launchpad/LaunchpadGrid";
import LaunchpadModals from "@/components/launchpad/LaunchpadModals";
import LeftSidebar from "@/components/launchpad/LeftSidebar";

import { categories, sortOptions } from "@/components/launchpad/constants";

function useCountdown() {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        // Deterministic 30-day cycle based on UNIX epoch
        const cycleMs = 30 * 24 * 60 * 60 * 1000;

        const update = () => {
            const now = Date.now();
            const remainder = now % cycleMs;
            const diff = cycleMs - remainder;

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        };

        update(); // immediate first update
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, []);

    return timeLeft;
}

export default function LaunchpadPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSort, setActiveSort] = useState("Most Voted");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [newProject, setNewProject] = useState({ 
        name: "", 
        description: "", 
        tags: "", 
        logo: "", 
        banner: "", 
        media: [] as { url: string; type: "image" | "video" }[], 
        demoUrl: "", 
        githubUrl: "", 
        isOpenSource: false, 
        openToCollab: false 
    });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast({ message: "", visible: false }), 4000);
    };

    const countdown = useCountdown();

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch("/api/projects");
            if (res.ok) setProjects(await res.json());
        } catch (e) {
            console.error("Failed to fetch projects", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleSubmitProject = async () => {
        if (!newProject.name?.trim()) { showToast("Project name is required"); return; }
        if (!newProject.description?.trim()) { showToast("Project description is required"); return; }
        setSubmitting(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newProject,
                    tags: newProject.tags ? (typeof newProject.tags === 'string' ? newProject.tags.split(",").map((t) => t.trim()) : newProject.tags) : [],
                }),
            });
            if (res.ok) {
                setNewProject({ 
                    name: "", description: "", tags: "", 
                    logo: "", banner: "", media: [], 
                    demoUrl: "", githubUrl: "", 
                    isOpenSource: false, openToCollab: false 
                });
                setShowSubmitModal(false);
                fetchProjects();
            } else {
                const data = await res.json().catch(() => null);
                showToast(data?.error || "Failed to create project. Please try again.");
            }
        } catch (e) {
            console.error("Failed to submit project", e);
            showToast("Something went wrong. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpvote = async (projectId: string) => {
        try {
            await fetch(`/api/projects/${projectId}/upvote`, { method: "POST" });
            fetchProjects();
        } catch (e) {
            console.error("Failed to upvote project", e);
        }
    };

    const topProjects = [...projects].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

    const filteredProjects =
        activeCategory === "All"
            ? projects
            : projects.filter((p) => {
                const tags = Array.isArray(p.tags) ? p.tags : [];
                return tags.some((t: string) => t.toLowerCase().includes(activeCategory.toLowerCase()));
            });

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        if (activeSort === "Most Voted") return b.upvotes - a.upvotes;
        if (activeSort === "Newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return b.xpThreshold - a.xpThreshold;
    });

    // ─── Stats & Builders Calculation ───
    const stats = {
        totalProjects: projects.length,
        totalUpvotes: projects.reduce((acc, p) => acc + (p.upvotes || 0), 0),
        activeBuilders: new Set(projects.map(p => p.authorId)).size
    };

    // Derived Top Builders from project data
    const topBuilders = Array.from(
        projects.reduce((acc, p) => {
            const author = p.author;
            if (!acc.has(author.id)) {
                acc.set(author.id, { ...author, totalUpvotes: 0 });
            }
            acc.get(author.id).totalUpvotes += p.upvotes;
            return acc;
        }, new Map())
    ).map(([_, b]: [any, any]) => b).sort((a, b) => b.totalUpvotes - a.totalUpvotes);

    return (
        <div className="flex min-h-screen bg-[#000000] selection:bg-accent/30 selection:text-white">
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>

            {/* Left Persistent Navigation */}
            <LeftSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 flex flex-col lg:flex-row">
                    {/* Main Content Column */}
                    <main className="flex-1 min-w-0 border-r border-white/5 pb-32 overflow-y-auto h-screen custom-scrollbar">
                        <LaunchpadHeader 
                            countdown={countdown} 
                            onOpenSubmit={() => setShowSubmitModal(true)} 
                        />

                        <div className="max-w-4xl mx-auto px-8 space-y-8 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-3">
                                    {activeCategory} Breakthroughs
                                </h2>
                                <div className="flex items-center gap-2">
                                    {sortOptions.map((sort) => (
                                        <button
                                            key={sort}
                                            onClick={() => setActiveSort(sort)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeSort === sort
                                                ? "bg-white/10 text-white border border-white/10"
                                                : "text-zinc-600 hover:text-zinc-400 border border-transparent"
                                                }`}
                                        >
                                            {sort}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <LaunchpadGrid 
                                projects={sortedProjects}
                                loading={loading}
                                onUpvote={handleUpvote}
                                onRefresh={fetchProjects}
                                onOpenSubmit={() => setShowSubmitModal(true)}
                            />
                        </div>
                    </main>

                    {/* Right Sidebar */}
                    <LaunchpadSidebar 
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        activeSort={activeSort}
                        setActiveSort={setActiveSort}
                        stats={stats}
                        topBuilders={topBuilders}
                    />
                </div>
            </div>

            <LaunchpadModals 
                showSubmit={showSubmitModal}
                onCloseSubmit={() => setShowSubmitModal(false)}
                newProject={newProject}
                setNewProject={setNewProject}
                submitting={submitting}
                onSubmit={handleSubmitProject}
            />

            {/* Error Toast */}
            <AnimatePresence>
                {toast.visible && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 bg-red-500/90 backdrop-blur-md text-white rounded-xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] border border-red-400/30"
                    >
                        <AlertCircle size={16} />
                        <span className="text-sm font-semibold">{toast.message}</span>
                        <button onClick={() => setToast({ message: "", visible: false })} className="ml-2 text-white/60 hover:text-white">
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
