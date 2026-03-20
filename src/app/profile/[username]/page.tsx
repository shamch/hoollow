"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import ImpactXPBadge from "@/components/ImpactXPBadge";
import RoleBadge from "@/components/RoleBadge";
import ProjectCard from "@/components/ProjectCard";
import FeedCard from "@/components/FeedCard";
import Button from "@/components/Button";
import Link from "next/link";
import {
    MessageCircle,
    Settings,
    X,
    Check,
    Plus,
    ExternalLink,
    Calendar,
    Award,
    Zap,
    Share2,
    Copy,
    Link as LinkIcon,
    Github,
    Twitter,
    Trash2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { xpHistory } from "@/lib/mockData";

// ── Sparkline Chart ──
function Sparkline({ data }: { data: { xp: number }[] }) {
    const max = Math.max(...data.map((d) => d.xp));
    const min = Math.min(...data.map((d) => d.xp));
    const range = max - min || 1;
    const width = 200;
    const height = 40;
    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.xp - min) / range) * height;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg width={width} height={height} className="overflow-visible opacity-50">
            <polyline points={points} fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Stat Item ──
function StatBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xl font-black text-white italic uppercase tracking-tighter">{value}</span>
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">{label}</span>
        </div>
    );
}

interface UserProfile {
    id: string;
    name: string;
    image: string;
    role: string;
    impactXP: number;
    bio: string;
    skills: string[];
    openToCollab: boolean;
    createdAt: string;
    email?: string;
    posts: any[];
    projects: any[];
    clubMembers: { club: { id: string; name: string; gradient: string; _count: { members: number } } }[];
}

export default function ProfilePage({ params }: { params: { username: string } }) {
    const { data: session } = useSession();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("projects");
    const [showShareToast, setShowShareToast] = useState(false);

    const userId = params.username;
    const isOwnProfile = 
        (session?.user?.username?.toLowerCase() === userId?.toLowerCase()) || 
        (session?.user?.id === user?.id && user !== null) ||
        (session?.user?.email === user?.email && user !== null);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const displayUser = user || (isOwnProfile && session?.user ? {
        id: session.user.id,
        name: session.user.name || "User",
        image: session.user.image || "",
        role: session.user.role || "builder",
        impactXP: session.user.impactXP || 50,
        bio: "",
        skills: [],
        openToCollab: true,
        createdAt: new Date().toISOString(),
        posts: [],
        projects: [],
        clubMembers: [],
    } : null);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
    };

    if (loading) return <AppLayout><div className="flex items-center justify-center min-h-screen opacity-20"><Zap size={32} className="animate-pulse" /></div></AppLayout>;
    if (!displayUser) return <AppLayout><div className="flex flex-col items-center justify-center min-h-screen text-center"><h1 className="text-xl font-black text-white italic uppercase mb-2">Ghost Node</h1><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">This builder hasn't manifested yet.</p></div></AppLayout>;

    const skills = Array.isArray(displayUser.skills) ? displayUser.skills : [];
    const clubs = displayUser.clubMembers || [];
    const posts = (displayUser.posts || []).map((p: any) => ({
        ...p,
        upvotes: p._count?.upvotes || p.upvotes || 0,
        commentCount: p._count?.comments || p.commentCount || 0,
        author: p.author || { id: displayUser.id, name: displayUser.name, image: displayUser.image, role: displayUser.role, impactXP: displayUser.impactXP },
    }));
    const projects = (displayUser.projects || []).map((p: any) => ({
        ...p,
        author: p.author || { id: displayUser.id, name: displayUser.name, image: displayUser.image, role: displayUser.role, impactXP: displayUser.impactXP },
    }));

    const RightSidebarContent = (
        <aside className="p-8 space-y-10">
            {/* Skills Segment */}
            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Award size={14} className="text-accent" /> Combat Skills
                </h3>
                {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <span key={skill} className="text-[9px] font-black px-3 py-1.5 bg-white/5 text-white/60 rounded-full border border-white/5 uppercase tracking-widest hover:border-accent transition-colors">
                                {skill}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-[9px] font-bold text-zinc-700 uppercase italic">Skill tree empty</p>
                )}
            </div>

            {/* XP Integrity */}
            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-accent" /> XP Vector
                </h3>
                <div className="space-y-4">
                    {[
                        { label: "Projects", val: projects.length * 20, col: "bg-accent" },
                        { label: "Posts", val: posts.length * 5, col: "bg-blue-500" },
                        { label: "Influence", val: displayUser.impactXP, col: "bg-purple-500" },
                    ].map(item => (
                        <div key={item.label}>
                            <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                                <span>{item.label}</span>
                                <span className="text-white">+{item.val}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (item.val/500)*100)}%` }}
                                    className={`h-full ${item.col}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comms */}
            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon size={14} className="text-accent" /> Neural Links
                </h3>
                <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-[20px] text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest border border-white/5">
                        <Github size={14} /> GitHub Node
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-[20px] text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest border border-white/5">
                        <Twitter size={14} /> X Network
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-[20px] text-[10px] font-black text-accent hover:scale-[1.02] transition-all uppercase tracking-widest border border-accent/20">
                        <Plus size={14} /> Connection
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <AppLayout rightSidebar={RightSidebarContent}>
            <div className="px-8 pt-12 pb-24">
                {/* ─── Profile Header ─── */}
                <div className="flex flex-col md:flex-row items-start gap-10 mb-16">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-accent to-purple-600 rounded-[48px] blur-2xl opacity-10 group-hover:opacity-20 transition-all" />
                        <Avatar name={displayUser.name} image={displayUser.image} size="xl" />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black border-4 border-[#080808] rounded-2xl flex items-center justify-center shadow-2xl">
                            <Sparkles size={16} className="text-accent" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                                {displayUser.name}
                            </h1>
                            {isOwnProfile ? (
                                <Link href="/account" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                                    <Settings size={18} className="text-zinc-600" />
                                </Link>
                            ) : (
                                <button className="px-6 py-2.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-accent/20">
                                    Message
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="text-[10px] font-black px-3 py-1 bg-white text-black rounded-full uppercase tracking-tighter italic">
                                {displayUser.role}级
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                <Calendar size={12} /> Joined {new Date(displayUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </div>
                        </div>

                        {displayUser.bio && (
                            <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-xl mb-8 italic">
                                &ldquo;{displayUser.bio}&rdquo;
                            </p>
                        )}

                        <div className="flex items-center gap-12 pt-4 border-t border-white/[0.03]">
                            <StatBox value={projects.length} label="Launch" />
                            <StatBox value={clubs.length} label="Nodes" />
                            <StatBox value={posts.length} label="Intel" />
                            <div className="flex-1 max-w-[150px]">
                                <Sparkline data={xpHistory} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Content Tabs ─── */}
                <div className="flex items-center gap-8 border-b border-white/5 mb-8">
                    {["Projects", "Feed", "Clubs"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`relative pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.toLowerCase() ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                            }`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase() && (
                                <motion.span
                                    layoutId="profileTabLine"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* ─── Cards Grid ─── */}
                <AnimatePresence mode="wait">
                    {activeTab === "projects" && (
                        <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                            {projects.length === 0 && <p className="text-[10px] font-bold text-zinc-700 uppercase italic py-20 text-center col-span-2">No projects deployed</p>}
                        </motion.div>
                    )}
                    {activeTab === "feed" && (
                        <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {posts.map(p => <FeedCard key={p.id} post={p} />)}
                            {posts.length === 0 && <p className="text-[10px] font-bold text-zinc-700 uppercase italic py-20 text-center">No intel shared</p>}
                        </motion.div>
                    )}
                    {activeTab === "clubs" && (
                        <motion.div key="clubs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {clubs.map(cm => (
                                <div key={cm.club.id} className="p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all group">
                                    <div className="w-full h-20 rounded-2xl mb-4 bg-gradient-to-br from-zinc-800 to-black" style={{ background: cm.club.gradient }} />
                                    <p className="text-[11px] font-black text-white uppercase italic truncate">{cm.club.name}</p>
                                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{cm.club._count.members} Members</p>
                                </div>
                            ))}
                            {clubs.length === 0 && <p className="text-[10px] font-bold text-zinc-700 uppercase italic py-20 text-center col-span-3">No nodes joined</p>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Share Toast */}
            <AnimatePresence>
                {showShareToast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-2xl z-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Check size={14} /> Link Copied
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
