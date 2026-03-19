"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    ArrowRight, 
    X, 
    Star, 
    Crown, 
    TrendingUp, 
    Camera, 
    Loader2, 
    LayoutDashboard, 
    Compass, 
    Users, 
    Lock,
    Settings,
    Filter,
    Plus,
    ChevronRight,
    SearchX
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClubCard from "@/components/ClubCard";
import Button from "@/components/Button";
import { showToast } from "@/store";
import { useRef } from "react";
import { useSession } from "next-auth/react";

interface Club {
    id: string;
    name: string;
    description: string;
    type: string;
    domain: string;
    gradient: string;
    visibility: string;
    logo?: string;
    banner?: string;
    tags: string[];
    memberCount: number;
    members: { id: string; name: string; image: string; impactXP: number }[];
    impactXP: number;
    creatorId?: string;
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
    const { data: session } = useSession();
    const [view, setView] = useState<"explore" | "joined" | "managed">("explore");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeType, setActiveType] = useState("All");
    const [activeDomain, setActiveDomain] = useState("All");
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClub, setNewClub] = useState({ name: "", description: "", type: "invite", domain: "Tech", tags: "", visibility: "public", logo: "", banner: "" });
    const [creating, setCreating] = useState(false);
    
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            showToast("error", "Cloudinary is not configured.");
            return;
        }

        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            showToast("error", "Invalid file type.");
            return;
        }

        const maxSize = field === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast("error", `File too large.`);
            return;
        }

        const setUploading = field === 'logo' ? setIsUploadingLogo : setIsUploadingBanner;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setNewClub(prev => ({ ...prev, [field]: data.secure_url }));
            showToast("success", `${field.charAt(0).toUpperCase() + field.slice(1)} uploaded!`);
        } catch (error: any) {
            showToast("error", `Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleCreateClub = async () => {
        if (!newClub.name || !newClub.description) return;
        setCreating(true);
        try {
            const res = await fetch("/api/clubs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newClub,
                    tags: newClub.tags ? newClub.tags.split(",").map((t) => t.trim()) : [],
                    gradient: gradientOptions[Math.floor(Math.random() * gradientOptions.length)],
                }),
            });
            if (res.ok) {
                setNewClub({ name: "", description: "", type: "invite", domain: "Tech", tags: "", visibility: "public", logo: "", banner: "" });
                setShowCreateModal(false);
                showToast("success", "Club created!");
                fetchClubs();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed");
            }
        } catch (e) {
            showToast("error", "Network error");
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (clubId: string) => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                if (data.requested) showToast("info", "Request sent!");
                else if (data.joined) showToast("success", "Joined!");
                else showToast("info", "Left club");
                fetchClubs();
            }
        } catch (e) {
            showToast("error", "Network error");
        }
    };

    const filteredClubs = clubs.filter((club) => {
        const matchesSearch =
            !searchQuery ||
            club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            club.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesView = true;
        if (view === "joined") {
            matchesView = club.members.some(m => m.id === session?.user?.id);
        } else if (view === "managed") {
            matchesView = club.creatorId === session?.user?.id;
        }

        const matchesType =
            activeType === "All" ||
            (activeType === "Open" && club.type === "open") ||
            (activeType === "Invite Only" && club.type === "invite") ||
            (activeType === "Application" && club.type === "application");
        const matchesDomain = activeDomain === "All" || club.domain === activeDomain;

        return matchesSearch && matchesView && matchesType && matchesDomain;
    });

    const navItems = [
        { id: "explore", label: "Explore", icon: Compass, bg: "from-blue-500/10 to-transparent" },
        { id: "joined", label: "My Clubs", icon: Users, bg: "from-purple-500/10 to-transparent" },
        { id: "managed", label: "Managed", icon: LayoutDashboard, bg: "from-orange-500/10 to-transparent" },
    ] as const;

    return (
        <div className="min-h-screen bg-[#080809] text-white selection:bg-accent/30 selection:text-white font-inter">
            <Navbar />
            
            <div className="max-w-[1600px] mx-auto flex h-[calc(100vh-64px)] overflow-hidden">
                {/* ─── Sidebar Panel ─── */}
                <aside className="w-[300px] border-r border-white/5 flex flex-col bg-[#0b0b0c] relative z-20">
                    <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setView(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group relative overflow-hidden ${
                                        view === item.id 
                                        ? `bg-gradient-to-r ${item.bg} text-white` 
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <item.icon size={18} className={view === item.id ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"} />
                                        <span className="text-small font-semibold">{item.label}</span>
                                    </div>
                                    {view === item.id && <ChevronRight size={14} className="relative z-10" />}
                                    {view === item.id && (
                                        <motion.div 
                                            layoutId="activeNav" 
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-accent" 
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-3 flex items-center gap-2">
                                    <Filter size={10} /> Type Filter
                                </p>
                                <div className="space-y-1">
                                    {typeFilters.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setActiveType(type)}
                                            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                                                activeType === type ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                                            }`}
                                        >
                                            {type}
                                            {activeType === type && <div className="w-1 h-1 rounded-full bg-accent" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-3 flex items-center gap-2">
                                    <Compass size={10} /> Domain
                                </p>
                                <div className="space-y-1">
                                    {domainFilters.map((domain) => (
                                        <button
                                            key={domain}
                                            onClick={() => setActiveDomain(domain)}
                                            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                                                activeDomain === domain ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                                            }`}
                                        >
                                            {domain}
                                            {activeDomain === domain && <div className="w-1 h-1 rounded-full bg-accent" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6">
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-white text-black rounded-[20px] font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Plus size={18} /> Start a Club
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-[#080809] overflow-hidden relative">
                    <header className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-[#0b0b0c] to-transparent sticky top-0 z-10">
                        <div>
                            <h1 className="text-3xl font-black text-white capitalize leading-tight">
                                {view === 'explore' ? 'Marketplace' : view === 'joined' ? 'My Hub' : 'Management'}
                            </h1>
                            <p className="text-zinc-500 text-xs font-medium mt-1">
                                {view === 'explore' ? 'Discover and join elite communities' : view === 'joined' ? 'Jump back into your active clubs' : 'Oversee and grow your own tribes'}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search marketplace..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-6 py-3.5 bg-[#121214] border border-white/5 rounded-2xl text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent/50 w-[300px] transition-all"
                                />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="aspect-[4/3] bg-white/5 rounded-[32px] animate-pulse" />
                                    ))}
                                </motion.div>
                            ) : filteredClubs.length > 0 ? (
                                <motion.div 
                                    key={view + filteredClubs.length}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20"
                                >
                                    {filteredClubs.map((club, i) => (
                                        <motion.div
                                            key={club.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <ClubCard 
                                                club={{
                                                    ...club,
                                                    members: club.members || []
                                                }} 
                                                onJoin={() => handleJoin(club.id)} 
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-12"
                                >
                                    <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center text-zinc-700 mb-6">
                                        <SearchX size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No clubs found</h3>
                                    <p className="text-zinc-500 text-sm max-w-xs mb-8">
                                        We couldn't find any clubs matching these criteria.
                                    </p>
                                    <Button variant="ghost" onClick={() => {
                                        setSearchQuery("");
                                        setActiveType("All");
                                        setActiveDomain("All");
                                        setView("explore");
                                    }}>
                                        Reset All Filters
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
                </main>
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0c0c0e] border border-zinc-800 rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_400px]"
                        >
                            <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
                                <div className="mb-8 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">Create a Club</h2>
                                        <p className="text-zinc-500 text-sm">Design your space and build your tribe.</p>
                                    </div>
                                    <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px]">1</span>
                                            Visual Identity
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Club Banner</label>
                                                <div 
                                                    onClick={() => bannerInputRef.current?.click()}
                                                    className="relative aspect-[3/1] rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-accent/40 transition-all cursor-pointer overflow-hidden group"
                                                >
                                                    {newClub.banner ? (
                                                        <img src={newClub.banner} className="w-full h-full object-cover" alt="Banner" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 group-hover:text-zinc-400">
                                                            {isUploadingBanner ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
                                                            <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter">Upload Banner</span>
                                                        </div>
                                                    )}
                                                    <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Club Logo</label>
                                                <div 
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="relative aspect-square w-24 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-accent/40 transition-all cursor-pointer overflow-hidden group mx-auto md:mx-0"
                                                >
                                                    {newClub.logo ? (
                                                        <img src={newClub.logo} className="w-full h-full object-cover" alt="Logo" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 group-hover:text-zinc-400">
                                                            {isUploadingLogo ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
                                                            <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter">Logo</span>
                                                        </div>
                                                    )}
                                                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px]">2</span>
                                            Basic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Club Name</label>
                                                <input
                                                    type="text" value={newClub.name}
                                                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                                                    placeholder="e.g. AI Tinkerers"
                                                    className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Domain</label>
                                                <select
                                                    value={newClub.domain}
                                                    onChange={(e) => setNewClub({ ...newClub, domain: e.target.value })}
                                                    className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-accent appearance-none transition-all"
                                                >
                                                    {domainFilters.filter(d => d !== "All").map(d => (
                                                        <option key={d} value={d} className="bg-zinc-900">{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Description</label>
                                            <textarea
                                                value={newClub.description}
                                                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                                                placeholder="Mission statement" rows={3}
                                                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-accent resize-none transition-all"
                                            />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px]">3</span>
                                            Visibility & Access
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Visibility</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[{ v: "public", l: "Public" }, { v: "private", l: "Private" }].map(v => (
                                                        <button
                                                            key={v.v}
                                                            onClick={() => setNewClub(prev => ({ ...prev, visibility: v.v, type: "invite" }))}
                                                            className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${newClub.visibility === v.v ? "bg-white text-black border-white" : "bg-zinc-900/50 text-zinc-500 border-zinc-800"}`}
                                                        >
                                                            {v.l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Join Mode</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(newClub.visibility === "public" ? ["invite", "application"] : ["invite"]).map(mode => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => setNewClub({ ...newClub, type: mode })}
                                                            className={`px-4 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${newClub.type === mode ? "bg-accent text-white border-accent" : "bg-zinc-900/50 text-zinc-500 border-zinc-800"}`}
                                                        >
                                                            {mode === 'invite' ? (newClub.visibility === 'public' ? 'Invite Only' : 'Link Only') : 'Application'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="pt-8 flex items-center justify-end gap-6 border-t border-zinc-800/50">
                                        <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Cancel</button>
                                        <Button
                                            variant="primary" size="lg" onClick={handleCreateClub}
                                            disabled={creating || !newClub.name.trim() || !newClub.description.trim() || isUploadingLogo || isUploadingBanner}
                                            className="rounded-full px-12"
                                        >
                                            {creating ? "Launching..." : "Launch Club"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
}
