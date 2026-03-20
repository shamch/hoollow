"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Check, TrendingUp, Info } from "lucide-react";
import Link from "next/link";
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

export default function PostDetailPage({ params }: { params: { postId: string } }) {
    const { data: session } = useSession();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [shared, setShared] = useState(false);

    const fetchPost = useCallback(async () => {
        try {
            const res = await fetch(`/api/posts/${params.postId}`);
            if (res.ok) {
                setPost(await res.json());
            } else if (res.status === 404) {
                setNotFound(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [params.postId]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
    };

    const RightSidebarContent = (
        <aside className="p-8 space-y-10">
            {post && (
                <>
                    <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="absolute -inset-2 bg-accent/20 rounded-full blur-xl opacity-50" />
                            <Link href={`/profile/${post.author.id}`}>
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring" }}>
                                    <img src={post.author.image} alt={post.author.name} className="w-16 h-16 rounded-full border-2 border-white/10 relative z-10" />
                                </motion.div>
                            </Link>
                        </div>
                        <h3 className="text-sm font-black text-white italic uppercase">{post.author.name}</h3>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{post.author.role}级</p>
                    </div>

                    <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                        <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={14} className="text-accent" /> Statistics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                <span>Upvotes</span>
                                <span className="text-white">{post.upvotes}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                <span>Comments</span>
                                <span className="text-white">{post.commentCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                <span>ImpactXP</span>
                                <span className="text-accent">+{post.upvotes * 2}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            {!post && (
                <div className="opacity-10 py-20 text-center uppercase font-black text-[10px] tracking-widest">
                    Post Metadata Pending...
                </div>
            )}
        </aside>
    );

    return (
        <AppLayout rightSidebar={RightSidebarContent}>
            <div className="px-8 pt-8 pb-24">
                {/* Back + Share */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/feed"
                        className="group flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-all"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                            <ArrowLeft size={14} />
                        </div>
                        Back to Intel
                    </Link>
                    {post && (
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-3 px-5 py-2.5 bg-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest rounded-xl hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                            {shared ? (
                                <><Check size={14} className="text-accent" /> Copied</>
                            ) : (
                                <><Share2 size={14} /> Share</>
                            )}
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="h-[400px] bg-white/5 rounded-[40px] animate-pulse border border-white/5" />
                ) : notFound ? (
                    <div className="text-center py-32 bg-[#111114] border border-white/5 rounded-[40px]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Info size={32} className="text-zinc-800" />
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase mb-2">Intel Purged</h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs mx-auto opacity-60">
                            This transmission has been lost or retracted from the nexus.
                        </p>
                        <Link href="/feed" className="inline-block mt-8 text-[10px] font-black text-white px-8 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 uppercase tracking-widest">
                            Return to Feed
                        </Link>
                    </div>
                ) : post ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                    >
                        <FeedCard
                            post={post}
                            onUpvote={fetchPost}
                            onPostUpdated={fetchPost}
                        />
                    </motion.div>
                ) : null}
            </div>
        </AppLayout>
    );
}
