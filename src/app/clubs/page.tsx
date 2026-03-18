"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X, Star, Crown, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClubCard from "@/components/ClubCard";
import Button from "@/components/Button";
import { showToast } from "@/store";

interface Club {
    id: string;
    name: string;
    description: string;
    type: string;
    domain: string;
    gradient: string;
    tags: string[];
    memberCount: number;
    members: { id: string; name: string; image: string; impactXP: number }[];
    impactXP: number;
}

const typeFilters = ["All", "Open", "Invite Only", "Application"];
const domainFilters = ["All", "Tech", "Design", "Business", "Research"];

const gradientOptions = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

export default function ClubsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeType, setActiveType] = useState("All");
    const [activeDomain, setActiveDomain] = useState("All");
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClub, setNewClub] = useState({ name: "", description: "", type: "open", domain: "Tech", tags: "" });
    const [creating, setCreating] = useState(false);

    const fetchClubs = useCallback(async () => {
        try {
            const res = await fetch("/api/clubs");
            if (res.ok) setClubs(await res.json());
            else showToast("error", "Failed to load clubs");
        } catch (e) {
            showToast("error", "Network error — couldn't load clubs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClubs();
    }, [fetchClubs]);

    const handleCreateClub = async () => {
        if (!newClub.name || !newClub.description) return;
        setCreating(true);
        try {
            const res = await fetch("/api/clubs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newClub.name,
                    description: newClub.description,
                    type: newClub.type,
                    domain: newClub.domain,
                    tags: newClub.tags ? newClub.tags.split(",").map((t) => t.trim()) : [],
                    gradient: gradientOptions[Math.floor(Math.random() * gradientOptions.length)],
                }),
            });
            if (res.ok) {
                setNewClub({ name: "", description: "", type: "open", domain: "Tech", tags: "" });
                setShowCreateModal(false);
                showToast("success", "Club created!");
                fetchClubs();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to create club");
            }
        } catch (e) {
            showToast("error", "Network error — couldn't create club");
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (clubId: string) => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                if (data.requested) {
                    showToast("info", "Join request sent! Waiting for approval.");
                } else if (data.joined) {
                    showToast("success", "Joined club!");
                } else {
                    showToast("info", "Left club");
                }
            } else if (res.status === 409) {
                showToast("info", "You already have a pending request");
            } else {
                showToast("error", "Failed to join club");
            }
            fetchClubs();
        } catch (e) {
            showToast("error", "Network error");
        }
    };

    const filteredClubs = clubs.filter((club) => {
        const matchesSearch =
            !searchQuery ||
            club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            club.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType =
            activeType === "All" ||
            (activeType === "Open" && club.type === "open") ||
            (activeType === "Invite Only" && club.type === "invite") ||
            (activeType === "Application" && club.type === "application");
        const matchesDomain = activeDomain === "All" || club.domain === activeDomain;
        return matchesSearch && matchesType && matchesDomain;
    });

    return (
        <>
            <Navbar />
            <main className="min-h-screen">
                {/* ─── Premium Header ─── */}
                <section className="relative overflow-hidden bg-black py-20 border-b border-zinc-800/50">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,255,0.15),transparent_50%)]" />
                    <div className="max-w-content mx-auto px-6 relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-2xl text-center md:text-left">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider mb-6"
                                >
                                    <Star size={12} /> Community Hub
                                </motion.div>
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]"
                                >
                                    Find your crew. <br />
                                    <span className="text-zinc-500">Scale your impact.</span>
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-zinc-400 text-lg mb-8 max-w-xl"
                                >
                                    Clubs are the heart of Hoollow. Form a team, collaborate on ambitious projects, and earn collective ImpactXP.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap items-center justify-center md:justify-start gap-4"
                                >
                                    <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)} className="rounded-full px-8">
                                        Start a Club <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800" />
                                        ))}
                                        <div className="w-10 h-10 rounded-full border-2 border-black bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                            +2k
                                        </div>
                                    </div>
                                    <span className="text-small text-zinc-500 ml-2">Builders already joined</span>
                                </motion.div>
                            </div>
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="hidden md:block relative group"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-purple-500/50 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                <div className="relative w-[340px] aspect-[4/5] bg-zinc-900 border border-zinc-800 rounded-[30px] p-6 flex flex-col justify-between overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl -mr-16 -mt-16" />
                                     <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                            <Crown size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Elite Builders Club</h3>
                                        <p className="text-sm text-zinc-400 line-clamp-3">The most active community of open-source builders on Hoollow. Working on NextGen AI.</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">AI/ML</span>
                                            <span className="px-2 py-1 rounded-md bg-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Open Source</span>
                                        </div>
                                     </div>
                                     <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800" />
                                            <span className="text-xs text-zinc-500">842 Members</span>
                                        </div>
                                        <div className="text-accent font-bold">2.4k XP</div>
                                     </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <div className="max-w-content mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
                        {/* ─── Left Filter Panel ─── */}
                        <aside className="hidden lg:block">
                            <div className="sticky top-[76px] space-y-6">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search clubs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-input text-small text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <div>
                                    <p className="text-label text-text-muted mb-3 uppercase tracking-wider font-semibold">Type</p>
                                    <div className="space-y-1">
                                        {typeFilters.map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setActiveType(type)}
                                                className={`w-full text-left px-3 py-2 rounded-btn text-small font-medium transition-colors ${activeType === type ? "bg-surface-alt text-text-primary" : "text-text-secondary hover:bg-surface-alt"}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-label text-text-muted mb-3 uppercase tracking-wider font-semibold">Domain</p>
                                    <div className="space-y-1">
                                        {domainFilters.map((domain) => (
                                            <button
                                                key={domain}
                                                onClick={() => setActiveDomain(domain)}
                                                className={`w-full text-left px-3 py-2 rounded-btn text-small font-medium transition-colors ${activeDomain === domain ? "bg-surface-alt text-text-primary" : "text-text-secondary hover:bg-surface-alt"}`}
                                            >
                                                {domain}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* ─── Main Grid ─── */}
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white">Explore Clubs</h2>
                                <div className="text-small text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                    {filteredClubs.length} Clubs Available
                                </div>
                            </div>

                            {/* Mobile Filters */}
                            <div className="lg:hidden mb-6 space-y-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search clubs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-input text-small text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto">
                                    {typeFilters.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setActiveType(type)}
                                            className={`px-3 py-1.5 rounded-pill text-label whitespace-nowrap transition-colors ${activeType === type ? "bg-accent text-accent-inverse" : "bg-surface-alt text-text-secondary"}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="bg-surface border border-border rounded-card overflow-hidden animate-pulse">
                                            <div className="h-28 bg-surface-alt" />
                                            <div className="p-4 space-y-3">
                                                <div className="h-4 bg-surface-alt rounded w-3/4" />
                                                <div className="h-3 bg-surface-alt rounded w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredClubs.map((club, i) => (
                                        <motion.div
                                            key={club.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05, duration: 0.3 }}
                                        >
                                            <ClubCard club={club} onJoin={() => handleJoin(club.id)} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {!loading && filteredClubs.length === 0 && (
                                <div className="text-center py-16">
                                    <p className="text-text-muted text-lg mb-2">No clubs found</p>
                                    <p className="text-text-muted text-small mb-4">
                                        Try adjusting your filters, or create the first club!
                                    </p>
                                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                        Create Club
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* ─── Interactive Create Club Modal ─── */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0c0c0e] border border-zinc-800 rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_400px]"
                        >
                            <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh]">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">Create a Club</h2>
                                    <p className="text-zinc-500">Build your community and grow together.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Club Name</label>
                                            <input
                                                type="text"
                                                value={newClub.name}
                                                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                                                placeholder="e.g. AI Tinkerers"
                                                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Domain</label>
                                            <select
                                                value={newClub.domain}
                                                onChange={(e) => setNewClub({ ...newClub, domain: e.target.value })}
                                                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-accent transition-all appearance-none"
                                            >
                                                {domainFilters.filter(d => d !== "All").map(d => (
                                                    <option key={d} value={d} className="bg-zinc-900">{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Description</label>
                                        <textarea
                                            value={newClub.description}
                                            onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                                            placeholder="What is the mission of this club?"
                                            rows={4}
                                            className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-all resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Membership</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["open", "invite", "application"].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setNewClub({ ...newClub, type: t })}
                                                        className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                                                            newClub.type === t 
                                                            ? "bg-white text-black border-white" 
                                                            : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Tags (Comma separated)</label>
                                            <input
                                                type="text"
                                                value={newClub.tags}
                                                onChange={(e) => setNewClub({ ...newClub, tags: e.target.value })}
                                                placeholder="e.g. Demos, Coding, Hack"
                                                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between border-t border-zinc-800/50">
                                        <button 
                                            onClick={() => setShowCreateModal(false)}
                                            className="text-zinc-500 hover:text-white font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleCreateClub}
                                            disabled={creating || !newClub.name.trim() || !newClub.description.trim()}
                                            className="rounded-full px-10"
                                        >
                                            {creating ? "Launching..." : "Launch Club"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-col bg-[#141416] p-12 border-l border-zinc-800/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] -mr-32 -mt-32" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] -ml-32 -mb-32" />
                                
                                <div className="relative z-10">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8">Live Preview</p>
                                    
                                    <div className="pointer-events-none scale-110 origin-top-left pt-4">
                                        <ClubCard 
                                            club={{
                                                id: "preview",
                                                name: newClub.name || "Club Name",
                                                description: newClub.description || "Describe your club's mission and what makes it unique in this space.",
                                                type: newClub.type,
                                                domain: newClub.domain,
                                                gradient: gradientOptions[0],
                                                tags: newClub.tags ? newClub.tags.split(",").map(t => t.trim()) : [],
                                                memberCount: 1,
                                                members: [],
                                                impactXP: 0
                                            }}
                                        />
                                    </div>

                                    <div className="mt-20 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Boost Member Growth</p>
                                                <p className="text-zinc-500 text-xs mt-1">Clear descriptions help builders find your tribe.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Earn Collective XP</p>
                                                <p className="text-zinc-500 text-xs mt-1">Every project upvote adds to your club's status.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
