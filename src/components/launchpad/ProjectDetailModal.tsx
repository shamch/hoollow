"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Github, Send, Check, Loader2, Sparkles, Rocket,
    Bookmark, ArrowUpRight, Award, Zap, Trash2, Pencil
} from "lucide-react";
import Avatar from "@/components/Avatar";
import UpvoteButton from "@/components/UpvoteButton";
import { getTimeAgo } from "@/lib/mockData";
import { useSession } from "next-auth/react";
import MediaUpload from "@/components/MediaUpload";
import { useRouter } from "next/navigation";

interface ProjectDetailModalProps {
    project: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function ProjectDetailModal({ project, isOpen, onClose, onUpdate }: ProjectDetailModalProps) {
    const { data: session } = useSession();
    const router = useRouter();

    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const [rating, setRating] = useState({ average: 0, count: 0, idea: 0, execution: 0, design: 0 });
    const [userRating, setUserRating] = useState({ idea: 0, execution: 0, design: 0 });
    const [submittingRate, setSubmittingRate] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);

    const [stats, setStats] = useState({ upvotes: project.upvotes || 0, views: 0, commentsCount: 0, supporters: [] as any[] });

    // Owner controls
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingMedia, setIsEditingMedia] = useState(false);
    const [savingMedia, setSavingMedia] = useState(false);
    const [editedMedia, setEditedMedia] = useState({
        logo: project.logo || "",
        banner: project.banner || "",
        media: Array.isArray(project.media) ? project.media : []
    });

    const isOwner = session?.user?.id === project.authorId;

    const media = Array.isArray(project.media) ? project.media : [];
    const allMedia = [
        ...(project.banner ? [{ url: project.banner, type: "image" }] : []),
        ...media
    ].filter(m => m.url).slice(0, 3);

    // Fetch data on open
    useEffect(() => {
        if (isOpen && project?.id) {
            fetchComments();
            fetchRatings();
            fetchStats();
            // Fire-and-forget view increment
            fetch(`/api/projects/${project.id}/view`, { method: "POST" }).catch(() => {});
        }
    }, [isOpen, project?.id]);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/comments`);
            if (res.ok) setComments(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingComments(false); }
    };

    const fetchRatings = async () => {
        try {
            const res = await fetch(`/api/projects/${project.id}/rate`);
            if (res.ok) setRating(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/projects/${project.id}/stats`);
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleRate = async () => {
        if (!session) return;
        setSubmittingRate(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userRating),
            });
            if (res.ok) { setShowRatingModal(false); fetchRatings(); }
        } catch (e) { console.error(e); }
        finally { setSubmittingRate(false); }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !session) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: commentText }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setCommentText("");
            }
        } catch (e) { console.error(e); }
        finally { setSubmittingComment(false); }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/projects?id=${project.id}`, { method: "DELETE" });
            if (res.ok) { onClose(); onUpdate?.(); router.refresh(); }
        } catch (e) { console.error(e); }
        finally { setIsDeleting(false); }
    };

    const handleSaveMedia = async () => {
        setSavingMedia(true);
        try {
            const res = await fetch("/api/projects", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: project.id, ...editedMedia }),
            });
            if (res.ok) { setIsEditingMedia(false); onUpdate?.(); router.refresh(); }
        } catch (e) { console.error(e); }
        finally { setSavingMedia(false); }
    };

    if (!project) return null;

    const safeRating = (val: number | undefined) => (val ?? 0).toFixed(1);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="bg-[#0c0c0e] border border-white/[0.06] w-full max-w-5xl h-full md:h-[88vh] md:rounded-2xl overflow-hidden relative z-10 flex flex-col"
                    >
                        {/* ── Header ── */}
                        <div className="relative px-6 md:px-10 pt-8 pb-6 border-b border-white/[0.04]">
                            {/* Close + Owner Actions */}
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                {isOwner && (
                                    <>
                                        <button
                                            onClick={() => setIsEditingMedia(!isEditingMedia)}
                                            className={`h-8 px-3 rounded-lg text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${isEditingMedia
                                                ? "bg-white text-black border-white"
                                                : "bg-white/5 text-zinc-400 border-white/[0.06] hover:border-white/10"
                                            }`}
                                        >
                                            <Pencil size={12} />
                                            {isEditingMedia ? "Cancel" : "Edit"}
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="h-8 w-8 rounded-lg bg-white/5 border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={onClose}
                                    className="h-8 w-8 rounded-lg bg-white/5 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Project Identity */}
                            <div className="flex items-center gap-4">
                                {isEditingMedia ? (
                                    <div className="w-16 h-16 shrink-0">
                                        <MediaUpload
                                            value={editedMedia.logo}
                                            onChange={(url) => setEditedMedia(prev => ({ ...prev, logo: url }))}
                                            type="image"
                                            aspectRatio="1:1"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-white/[0.06] overflow-hidden shrink-0">
                                        <img src={project.logo || "/placeholder-logo.png"} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h1 className="text-xl font-bold text-white tracking-tight truncate">{project.name}</h1>
                                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{project.description?.split(".")[0]}.</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="flex-1 flex flex-col md:flex-row min-h-0">
                            {/* Left: Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">

                                {/* Media */}
                                {isEditingMedia ? (
                                    <div className="space-y-4">
                                        <MediaUpload
                                            value={editedMedia.banner}
                                            onChange={(url) => setEditedMedia(prev => ({ ...prev, banner: url }))}
                                            type="image"
                                            aspectRatio="16:9"
                                            label="Cover Banner"
                                        />
                                        <div className="grid grid-cols-3 gap-3">
                                            {[0, 1, 2].map(idx => (
                                                <MediaUpload
                                                    key={idx}
                                                    value={editedMedia.media[idx]?.url || ""}
                                                    onChange={(url) => {
                                                        const m = [...editedMedia.media];
                                                        if (url) m[idx] = { url, type: url.match(/\.(mp4|webm)$/i) ? "video" : "image" };
                                                        else m.splice(idx, 1);
                                                        setEditedMedia(prev => ({ ...prev, media: m.filter(Boolean) }));
                                                    }}
                                                    type="image"
                                                    aspectRatio="16:9"
                                                    label={`Slot ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleSaveMedia}
                                            disabled={savingMedia}
                                            className="w-full py-3 bg-white text-black font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {savingMedia ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                            {savingMedia ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                ) : allMedia.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {allMedia.map((m, i) => (
                                            <div key={i} className="relative rounded-xl overflow-hidden border border-white/[0.06] aspect-[4/3] group">
                                                {m.type === "video" ? (
                                                    <video src={m.url} className="w-full h-full object-cover" controls />
                                                ) : (
                                                    <img src={m.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-40 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.06] flex items-center justify-center text-zinc-600">
                                        <p className="text-xs text-zinc-500">No media uploaded</p>
                                    </div>
                                )}

                                {/* Author & Tags */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar name={project.author?.name} image={project.author?.image} size="sm" />
                                        <span className="text-sm font-medium text-white">{project.author?.username || project.author?.name}</span>
                                    </div>
                                    <div className="h-4 w-px bg-white/[0.06]" />
                                    {project.isOpenSource && (
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                            <Github size={12} /> Open Source
                                        </div>
                                    )}
                                    {Array.isArray(project.tags) && project.tags.map((tag: string) => (
                                        <span key={tag} className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                            #{tag}
                                        </span>
                                    ))}
                                    {project.demoUrl && (
                                        <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                                            Live Demo <ArrowUpRight size={12} />
                                        </a>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-zinc-400 leading-relaxed">{project.description}</p>

                                {/* Comments */}
                                <div className="pt-6 border-t border-white/[0.04] space-y-6">
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        Discussion ({comments.length})
                                    </h3>

                                    {/* Comment Input */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                            <img src={session?.user?.image || "/placeholder-avatar.png"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                                placeholder="Leave a comment..."
                                                className="w-full h-10 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-colors pr-10"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!commentText.trim() || submittingComment}
                                                className="absolute right-1.5 top-1.5 w-7 h-7 rounded-md bg-white/5 text-zinc-400 flex items-center justify-center disabled:opacity-30 hover:text-white transition-colors"
                                            >
                                                <Send size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comments List */}
                                    <div className="space-y-5">
                                        {loadingComments ? (
                                            <Loader2 className="animate-spin text-zinc-700 mx-auto" size={20} />
                                        ) : comments.length === 0 ? (
                                            <p className="text-xs text-zinc-600 text-center py-6">No comments yet. Be the first!</p>
                                        ) : comments.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <Avatar name={comment.author?.name} image={comment.author?.image} size="sm" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-white">{comment.author?.username || comment.author?.name}</span>
                                                        <span className="text-[10px] text-zinc-600">{getTimeAgo(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-400 mt-0.5">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Sidebar */}
                            <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/[0.04] overflow-y-auto p-6 space-y-6">
                                {/* Stats */}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-white tabular-nums">{stats.upvotes}</p>
                                            <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">Upvotes</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-white tabular-nums">{stats.commentsCount}</p>
                                            <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">Comments</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-white tabular-nums">{stats.views}</p>
                                            <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">Views</p>
                                        </div>
                                    </div>

                                    {/* Supporters */}
                                    {stats.supporters.length > 0 && (
                                        <div className="mt-5 pt-4 border-t border-white/[0.04]">
                                            <div className="flex justify-center">
                                                {stats.supporters.slice(0, 8).map((user: any) => (
                                                    <div key={user.id} className="w-7 h-7 rounded-full border-2 border-[#0c0c0e] overflow-hidden -ml-1.5 first:ml-0" title={user.name}>
                                                        <img src={user.image || "/placeholder-avatar.png"} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-center text-[10px] text-zinc-600 mt-2">
                                                {stats.upvotes} supporter{stats.upvotes !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Rating */}
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-white">{safeRating(rating.average)}</span>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Rocket key={i} size={10} fill={i < Math.round(rating.average || 0) ? "currentColor" : "none"} className={i < Math.round(rating.average || 0) ? "text-white" : "text-zinc-700"} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-zinc-600">{rating.count || 0} ratings</span>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="space-y-2.5">
                                        {[
                                            { label: "Idea", val: rating.idea },
                                            { label: "Execution", val: rating.execution },
                                            { label: "Design", val: rating.design }
                                        ].map(stat => (
                                            <div key={stat.label}>
                                                <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                                                    <span>{stat.label}</span>
                                                    <span className="text-zinc-300 tabular-nums">{safeRating(stat.val)}</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${((stat.val ?? 0) / 5) * 100}%` }}
                                                        className="h-full bg-white/60 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setShowRatingModal(true)}
                                        className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                                    >
                                        Rate Project
                                    </button>
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-2">
                                    {project.githubUrl && (
                                        <a
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 w-full py-2.5 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:border-white/10 transition-all"
                                        >
                                            <Github size={14} /> View Repository <ArrowUpRight size={10} className="ml-auto" />
                                        </a>
                                    )}
                                    {project.demoUrl && (
                                        <a
                                            href={project.demoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 w-full py-2.5 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:border-white/10 transition-all"
                                        >
                                            <Rocket size={14} /> Try Demo <ArrowUpRight size={10} className="ml-auto" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRatingModal(false)} />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111114] border border-white/[0.06] rounded-2xl p-8 w-full max-w-sm relative z-10">
                        <h3 className="text-lg font-bold text-white mb-6">Rate this project</h3>
                        <div className="space-y-5">
                            {(["idea", "execution", "design"] as const).map((key) => (
                                <div key={key}>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-medium text-zinc-400 capitalize">{key}</label>
                                        <span className="text-sm font-bold text-white">{userRating[key]}/5</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setUserRating(prev => ({ ...prev, [key]: num }))}
                                                className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all ${userRating[key] === num
                                                    ? "bg-white text-black"
                                                    : "bg-white/5 text-zinc-500 hover:bg-white/10"
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleRate}
                            disabled={submittingRate || Object.values(userRating).some(v => v === 0)}
                            className="w-full mt-6 py-3 bg-white text-black font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-40"
                        >
                            {submittingRate ? "Submitting..." : "Submit Rating"}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
