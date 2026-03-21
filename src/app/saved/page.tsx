"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Inbox, Sparkles, TrendingUp, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import FeedCard from "@/components/FeedCard";

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
    isSaved?: boolean;
    imageUrl?: string | null;
    openToCollab?: boolean;
}

export default function SavedPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = useCallback(async () => {
        try {
            const res = await fetch("/api/posts/saved");
            if (res.ok) setPosts(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSaved();
    }, [fetchSaved]);

    const RightSidebarContent = (
        <aside className="p-8 space-y-10">
            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" /> Archives
                </h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Total Saved</p>
                        <p className="text-2xl font-black text-white italic">{posts.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Search size={14} className="text-accent" /> Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                    {["All", "Projects", "Discussions", "Articles"].map(cat => (
                        <span key={cat} className="text-[9px] font-black px-3 py-1.5 bg-white/5 text-white/40 rounded-full border border-white/5 uppercase tracking-widest hover:border-accent transition-colors cursor-pointer">
                            {cat}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    );

    return (
        <AppLayout rightSidebar={RightSidebarContent}>
            <div className="px-8 pt-12 pb-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center border border-accent/20">
                        <Bookmark size={28} className="text-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                            Bookmarks
                        </h1>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                            Your curated intel and blueprints
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-white/5 rounded-[40px] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32 bg-[#111114] border border-white/5 rounded-[40px]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Inbox size={32} className="text-zinc-800" />
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase mb-2">Empty Vault</h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs mx-auto opacity-60">
                            Capture interesting builds and ideas from the feed to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {posts.map((post, i) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <FeedCard
                                        post={post}
                                        onUpvote={fetchSaved}
                                        onPostUpdated={fetchSaved}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
