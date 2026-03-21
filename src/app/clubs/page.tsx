"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
    Search, 
    Filter, 
    Compass, 
    Users, 
    LayoutDashboard, 
    X, 
    Camera, 
    Loader2, 
    SearchX 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import ClubCard from "@/components/ClubCard";
import Button from "@/components/Button";
import { showToast } from "@/store";

// Constants for filters
const typeFilters = ["All", "Open", "Invite Only", "Application"];
const domainFilters = ["All", "Tech", "Design", "Product", "Marketing", "Crypto", "Gaming", "Other"];
const gradientOptions = [
    "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
];

interface Club {
    id: string;
    name: string;
    description: string;
    type: string;
    domain: string;
    logo: string | null;
    banner: string | null;
    memberCount: number;
    creatorId: string;
    members: { id: string }[];
}

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
        { id: "explore", label: "Marketplace", icon: Compass },
        { id: "joined", label: "My Hub", icon: Users },
        { id: "managed", label: "Management", icon: LayoutDashboard },
    ] as const;

    const RightSidebarContent = (
        <div className="space-y-8">
            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">View Mode</p>
                <div className="space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${
                                view === item.id 
                                ? "bg-white text-black font-black" 
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 font-bold"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={16} />
                                <span className="text-xs">{item.label}</span>
                            </div>
                            {view === item.id && <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(255,255,255,0.5)]" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Filter size={10} /> Filters
                </p>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 pl-1">Type</p>
                        <div className="flex flex-wrap gap-2">
                            {typeFilters.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        activeType === type 
                                        ? "bg-accent border-accent text-white" 
                                        : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 pl-1">Domain</p>
                        <div className="grid grid-cols-2 gap-2">
                            {domainFilters.map((domain) => (
                                <button
                                    key={domain}
                                    onClick={() => setActiveDomain(domain)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border text-left ${
                                        activeDomain === domain 
                                        ? "bg-white text-black border-white" 
                                        : "bg-white/5 border-transparent text-zinc-500 hover:border-white/10"
                                    }`}
                                >
                                    {domain}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full py-4 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
            >
                Launch New Club
            </button>
        </div>
    );

    return (
        <AppLayout rightSidebar={RightSidebarContent}>
            <div className="px-8 py-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter leading-none italic uppercase">
                            {view === 'explore' ? 'Clubs' : view === 'joined' ? 'My Hub' : 'Admin'}
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-widest opacity-60">
                            Elite communities for builders
                        </p>
                    </div>
                    
                    <div className="relative group">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Find your tribe..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-[#111114] border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:border-white/20 w-full md:w-[320px] transition-all"
                        />
                    </div>
                </header>

                <div>
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="aspect-[1.5/1] bg-[#111114] border border-white/5 rounded-[40px] animate-pulse" />
                                ))}
                            </div>
                        ) : filteredClubs.length > 0 ? (
                            <motion.div 
                                key={view + filteredClubs.length}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 pb-32"
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
                            <div className="h-[50vh] flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-zinc-800 mb-8 border border-white/5">
                                    <SearchX size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 uppercase italic">Nothing found</h3>
                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest max-w-xs mb-10 opacity-60">
                                    Try adjusting your filters or search query
                                </p>
                                <Button variant="primary" onClick={() => {
                                    setSearchQuery("");
                                    setActiveType("All");
                                    setActiveDomain("All");
                                    setView("explore");
                                }}>
                                    Clear All
                                </Button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Create Club Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0b] border border-white/10 rounded-[48px] w-full max-w-5xl overflow-hidden shadow-2xl relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_400px]"
                        >
                            <div className="p-8 lg:p-14 overflow-y-auto max-h-[90vh] no-scrollbar">
                                <div className="mb-12 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Start Tribe</h2>
                                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] opacity-60">Design your exclusive community</p>
                                    </div>
                                    <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors border border-white/5">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-12">
                                    <section className="space-y-6">
                                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent border border-accent/20">01</span>
                                            IDENTITY
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Banner</label>
                                                <div 
                                                    onClick={() => bannerInputRef.current?.click()}
                                                    className="relative aspect-[21/9] rounded-3xl bg-black border border-white/5 hover:border-white/20 transition-all cursor-pointer overflow-hidden group"
                                                >
                                                    {newClub.banner ? (
                                                        <img src={newClub.banner} className="w-full h-full object-cover" alt="Banner" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 group-hover:text-zinc-500 transition-colors">
                                                            {isUploadingBanner ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
                                                        </div>
                                                    )}
                                                    <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Mark</label>
                                                <div 
                                                    onClick={() => logoInputRef.current?.click()}
                                                    className="relative aspect-square w-24 rounded-3xl bg-black border border-white/5 hover:border-white/20 transition-all cursor-pointer overflow-hidden group flex items-center justify-center"
                                                >
                                                    {newClub.logo ? (
                                                        <img src={newClub.logo} className="w-full h-full object-cover" alt="Logo" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-zinc-800 group-hover:text-zinc-500">
                                                            {isUploadingLogo ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
                                                        </div>
                                                    )}
                                                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent border border-accent/20">02</span>
                                            FOUNDATION
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Name</label>
                                                <input
                                                    type="text" value={newClub.name}
                                                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                                                    placeholder="AI Tinkerers"
                                                    className="w-full px-6 py-5 bg-black border border-white/5 rounded-3xl text-white font-bold placeholder:text-zinc-900 focus:outline-none focus:border-white/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Domain</label>
                                                <select
                                                    value={newClub.domain}
                                                    onChange={(e) => setNewClub({ ...newClub, domain: e.target.value })}
                                                    className="w-full px-6 py-5 bg-black border border-white/5 rounded-3xl text-white font-bold focus:outline-none focus:border-white/20 appearance-none transition-all"
                                                >
                                                    {domainFilters.filter(d => d !== "All").map(d => (
                                                        <option key={d} value={d} className="bg-black">{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Manifesto</label>
                                            <textarea
                                                value={newClub.description}
                                                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                                                placeholder="What is your tribe about?" rows={3}
                                                className="w-full px-6 py-5 bg-black border border-white/5 rounded-3xl text-white font-bold placeholder:text-zinc-900 focus:outline-none focus:border-white/20 resize-none transition-all"
                                            />
                                        </div>
                                    </section>

                                    <div className="pt-12 flex items-center justify-end gap-10 border-t border-white/5">
                                        <button onClick={() => setShowCreateModal(false)} className="text-zinc-700 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">Discard</button>
                                        <Button
                                            variant="primary" size="lg" onClick={handleCreateClub}
                                            disabled={creating || !newClub.name.trim() || !newClub.description.trim() || isUploadingLogo || isUploadingBanner}
                                            className="rounded-full px-16 py-5"
                                        >
                                            {creating ? "Launching..." : "Deploy Tribe"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#111114] border-l border-white/5 p-12 hidden lg:block overflow-y-auto no-scrollbar">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">Live Preview</h4>
                                <div className="scale-[0.85] origin-top">
                                    <ClubCard club={{ ...newClub, id: 'preview', gradient: gradientOptions[0], memberCount: 1, members: [], impactXP: 0, tags: newClub.tags ? newClub.tags.split(',') : [] } as any} />
                                </div>
                                <div className="mt-12 space-y-8">
                                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Privacy</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[{ v: "public", l: "Public" }, { v: "private", l: "Private" }].map(v => (
                                                <button
                                                    key={v.v}
                                                    onClick={() => setNewClub(prev => ({ ...prev, visibility: v.v, type: "invite" }))}
                                                    className={`py-3 rounded-2xl border text-[10px] font-black uppercase transition-all ${newClub.visibility === v.v ? "bg-white text-black border-white" : "bg-white/5 text-zinc-600 border-white/5"}`}
                                                >
                                                    {v.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
