"use client";

import React from "react";
import { motion } from "framer-motion";
import ProjectRow from "@/components/ProjectRow";
import { Project } from "./constants";
import Button from "@/components/Button";
import { SearchX } from "lucide-react";

interface LaunchpadGridProps {
    projects: Project[];
    loading: boolean;
    onUpvote: (id: string) => void;
    onRefresh: () => void;
    onOpenSubmit: () => void;
}

export default function LaunchpadGrid({ 
    projects, loading, onUpvote, onRefresh, onOpenSubmit 
}: LaunchpadGridProps) {
    if (loading) {
        return (
            <div className="flex-1 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="py-6 border-b border-white/5 flex items-center gap-4 px-4 h-28 animate-pulse">
                        <div className="w-8 h-4 bg-white/5 rounded" />
                        <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-white/5 rounded w-1/4" />
                            <div className="h-3 bg-white/5 rounded w-3/4" />
                        </div>
                        <div className="w-12 h-16 rounded-xl bg-white/5 flex-shrink-0" />
                    </div>
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-24 bg-[#111114]/20 rounded-[40px] border border-white/5 backdrop-blur-xl">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <SearchX size={40} className="text-zinc-600" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">No Projects Detected</h3>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-8">Be the first to launch in this category</p>
                <Button variant="primary" onClick={onOpenSubmit} className="px-8 py-3 rounded-full">
                    Start Your Launch
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-3">
            {projects.map((project, i) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <ProjectRow 
                        project={project} 
                        onUpvote={() => onUpvote(project.id)} 
                        onUpdated={onRefresh} 
                    />
                </motion.div>
            ))}
        </div>
    );
}
