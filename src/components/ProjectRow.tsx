"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronUp, Github, ExternalLink, Users } from "lucide-react";
import Avatar from "./Avatar";
import ImpactXPBadge from "./ImpactXPBadge";
import { Project as ProjectData } from "./launchpad/constants";
import { useSession } from "next-auth/react";
import ProjectDetailModal from "./launchpad/ProjectDetailModal";
import { useState } from "react";

interface ProjectRowProps {
    project: ProjectData;
    onUpvote?: () => void;
    onUpdated?: () => void;
}

export default function ProjectRow({ project, onUpvote, onUpdated }: ProjectRowProps) {
    const { data: session } = useSession();
    const [showDetail, setShowDetail] = useState(false);
    const isOwner = session?.user?.id === project.authorId;
    const tags = Array.isArray(project.tags) ? project.tags : (project.tags?.split(",") || []);

    return (
        <>
            <motion.div
                layout
                onClick={() => setShowDetail(true)}
                className="group relative flex items-center gap-4 py-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer px-4 -mx-4 rounded-2xl"
            >
                {/* Ranking Number */}
                <div className="w-8 flex-shrink-0">
                    <span className="text-xs font-black text-zinc-600 group-hover:text-zinc-400 transition-colors">
                        #{project.rank || 1}
                    </span>
                </div>

                {/* Logo */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-white/5 bg-[#111114]">
                    <img 
                        src={project.logo || project.imageUrl || project.thumbnail || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=200&h=200&fit=crop"} 
                        className="w-full h-h-full object-cover" 
                        alt={project.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=200&h=200&fit=crop"; }}
                    />
                </div>

                {/* Info Container */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-black text-white hover:text-accent transition-colors truncate">
                            {project.name}
                        </h3>
                        {project.openToCollab && (
                            <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-[8px] font-black text-green-500 uppercase tracking-tighter">Collab</span>
                        )}
                    </div>
                    
                    <p className="text-sm text-zinc-400 line-clamp-1 mb-2 font-medium">
                        {project.description}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] font-bold">
                        {/* Rating */}
                        <div className="flex items-center gap-1 group/rating">
                            <span className="text-amber-500">★</span>
                            <span className="text-zinc-500">{project.rating?.toFixed(1) || "0.0"}</span>
                            <span className="text-zinc-700">({project.reviewCount || 0})</span>
                        </div>

                        {/* Comments */}
                        <div className="flex items-center gap-1">
                            <span className="text-zinc-500">💬</span>
                            <span className="text-zinc-500">{project.commentCount || 0}</span>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-700">•</span>
                            {tags.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="text-zinc-500 hover:text-white transition-colors">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Upvote Button (Square) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpvote?.();
                    }}
                    className="flex-shrink-0 w-12 h-16 rounded-xl border border-white/5 bg-[#111114] flex flex-col items-center justify-center gap-1 hover:border-accent/40 hover:bg-accent/10 transition-all group/upvote"
                >
                    <ChevronUp size={20} className="text-zinc-600 group-hover/upvote:text-accent group-hover/upvote:-translate-y-0.5 transition-all" />
                    <span className="text-sm font-black text-white">{project.upvotes || 0}</span>
                </button>
            </motion.div>

        <ProjectDetailModal 
            project={project}
            isOpen={showDetail}
            onClose={() => setShowDetail(false)}
            onUpdate={onUpdated}
        />
    </>
    );
}
