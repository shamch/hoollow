"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    Plus,
    X,
} from "lucide-react";
import FeedCard from "@/components/FeedCard";
import ImpactXPBadge from "@/components/ImpactXPBadge";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { useSession } from "next-auth/react";
import { showToast } from "@/store";
import AppLayout from "@/components/AppLayout";

const feedTabs = ["For You", "Trending"];

interface Post {
    id: string;
    title: string;
    body: string;
    tags: string[];
    upvotes: number;
    authorId: string;
    author: { id: string; name: string; image: string; role: string; impactXP: number };
    createdAt: string;
    commentCount: number;
    isProject?: boolean;
    hasUpvoted?: boolean;
}

interface LeaderboardUser {
    id: string;
    name: string;
    image: string;
    role: string;
    impactXP: number;
    username?: string;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};

export default function FeedPage() {
    const [activeTab, setActiveTab] = useState("For You");
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPost, setNewPost] = useState({ title: "", body: "", tags: "", imageUrl: "", openToCollab: false });
    const [creating, setCreating] = useState(false);
    const [postErrors, setPostErrors] = useState<Record<string, string>>({});

    const fetchPosts = useCallback(async () => {
        try {
            const res = await fetch("/api/posts");
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            } else {
                showToast("error", "Failed to load posts");
            }
        } catch (e) {
            showToast("error", "Network error — couldn't load posts");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch("/api/users/leaderboard");
            if (res.ok) setLeaderboard(await res.json());
        } catch (e) {
            console.error("Failed to fetch leaderboard", e);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
        fetchLeaderboard();
    }, [fetchPosts, fetchLeaderboard]);

    const handleCreatePost = async () => {
        const errors: Record<string, string> = {};
        if (!newPost.title.trim()) errors.title = "Title is required";
        if (!newPost.body.trim()) errors.body = "Body is required";
        if (Object.keys(errors).length > 0) {
            setPostErrors(errors);
            showToast("error", "Please fill in all required fields.");
            return;
        }
        setPostErrors({});
        setCreating(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newPost.title,
                    body: newPost.body,
                    tags: newPost.tags ? newPost.tags.split(",").map((t) => t.trim()) : [],
                    imageUrl: newPost.imageUrl || null,
                    openToCollab: newPost.openToCollab,
                }),
            });
            if (res.ok) {
                setNewPost({ title: "", body: "", tags: "", imageUrl: "", openToCollab: false });
                setShowCreateModal(false);
                showToast("success", "Post published!");
                fetchPosts();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to create post");
            }
        } catch (e) {
            showToast("error", "Network error — couldn't publish post");
        } finally {
            setCreating(false);
        }
    };


    const displayPosts =
        activeTab === "Trending"
            ? [...posts].sort((a, b) => b.upvotes - a.upvotes)
            : posts;

    const RightSidebarContent = (
        <div className="space-y-6">
            <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" />
                    Top Builders
                </h3>
                <div className="space-y-4">
                    {leaderboard.map((user, i) => (
                        <Link
                            key={user.id}
                            href={`/profile/${user.username || user.id}`}
                            className="flex items-center gap-3 group"
                        >
                            <span className="text-[10px] font-black text-zinc-700 w-4">{i + 1}</span>
                            <Avatar name={user.name || "User"} image={user.image} size="sm" />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-bold text-white truncate group-hover:text-accent transition-colors">{user.name || "User"}</span>
                                <span className="text-[10px] text-zinc-500 font-medium truncate">@{user.username || user.id}</span>
                            </div>
                            <ImpactXPBadge score={user.impactXP} size="sm" showIcon={false} />
                        </Link>
                    ))}
                    {leaderboard.length === 0 && (
                        <p className="text-[10px] font-semibold text-zinc-600 italic">Finding the best builders...</p>
                    )}
                </div>
                <Link href="/leaderboard" className="mt-6 block w-full py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest text-center rounded-xl transition-colors">
                    View Rankings
                </Link>
            </div>
        </div>
    );

    return (
        <AppLayout rightSidebar={RightSidebarContent}>
            <div className="px-8 py-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6 border-b border-white/5 flex-1">
                        {feedTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative pb-3 text-sm font-bold tracking-tight transition-colors duration-200 ${activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.span
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="ml-6 px-6">
                        <Plus size={16} className="mr-1" /> Post
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-[#111114] border border-white/5 rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-full" />
                                    <div className="h-3 bg-white/5 rounded w-32" />
                                </div>
                                <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
                                <div className="h-3 bg-white/5 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : displayPosts.length === 0 ? (
                    <div className="text-center py-20 bg-[#111114] border border-white/5 rounded-3xl">
                        <div className="w-16 h-16 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
                            <Plus size={24} className="text-accent" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Build something?</h3>
                        <p className="text-zinc-500 text-sm mb-6 max-w-[240px] mx-auto font-medium">Be the first to share your progress with the community.</p>
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>Create First Post</Button>
                    </div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {displayPosts.map((post, i) => (
                            <motion.div key={post.id} variants={fadeInUp} custom={i}>
                                <FeedCard post={post} onUpvote={fetchPosts} onPostUpdated={fetchPosts} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Create Post Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#111111] border border-white/10 rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            
                            <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Create Post</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => { setNewPost({ ...newPost, title: e.target.value }); setPostErrors((prev) => ({ ...prev, title: "" })); }}
                                        placeholder="What's the breakthrough?"
                                        className={`w-full bg-black border rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder:text-zinc-700 focus:outline-none focus:border-accent transition-all ${postErrors.title ? "border-red-500/50" : "border-white/5"}`}
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Details</label>
                                    <textarea
                                        value={newPost.body}
                                        onChange={(e) => { setNewPost({ ...newPost, body: e.target.value }); setPostErrors((prev) => ({ ...prev, body: "" })); }}
                                        placeholder="Tell us everything..."
                                        rows={4}
                                        className={`w-full bg-black border rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder:text-zinc-700 focus:outline-none focus:border-accent transition-all resize-none ${postErrors.body ? "border-red-500/50" : "border-white/5"}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Tags</label>
                                        <input
                                            type="text"
                                            value={newPost.tags}
                                            onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                            placeholder="AI, Web3, SaaS..."
                                            className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder:text-zinc-700 focus:outline-none focus:border-accent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Media URL</label>
                                        <input
                                            type="url"
                                            value={newPost.imageUrl}
                                            onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                                            placeholder="Image or video link"
                                            className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder:text-zinc-700 focus:outline-none focus:border-accent transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreatePost}
                                    disabled={creating}
                                    className="w-full py-4 bg-white text-black text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
                                >
                                    {creating ? "Publishing..." : "Publish Breakthrough"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
