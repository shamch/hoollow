"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import {
    User,
    Award,
    Settings,
    Shield,
    Trash2,
    AlertTriangle,
    Loader2,
    Check,
    Plus,
    X,
    ChevronRight,
    Camera,
    TrendingUp,
    History,
    Lock,
    LogOut,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { signOut } from "next-auth/react";

const skillOptions = [
    "React", "Next.js", "TypeScript", "Python", "Node.js", "Flutter",
    "Figma", "UI/UX", "Product Design", "Go-to-Market", "Machine Learning",
    "Data Science", "DevOps", "Blockchain", "IoT", "3D Printing",
    "Content Writing", "Marketing", "Fundraising", "Leadership",
];

export default function AccountPage() {
    const { data: session, update } = useSession();
    const [activeSection, setActiveSection] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile State
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [openToCollab, setOpenToCollab] = useState(true);

    // Security State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [realXPHistory, setRealXPHistory] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setImage(session.user.image || "");
            const fetchProfile = async () => {
                try {
                    const res = await fetch(`/api/users/${session.user.username || session.user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBio(data.bio || "");
                        setSkills(Array.isArray(data.skills) ? data.skills : []);
                        setOpenToCollab(data.openToCollab ?? true);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();

            const fetchXPHistory = async () => {
                try {
                    const res = await fetch("/api/profile/xp-history");
                    if (res.ok) {
                        const data = await res.json();
                        setRealXPHistory(data);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            fetchXPHistory();
        } else if (session === null) {
            setLoading(false);
        }
    }, [session]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setImage(data.secure_url);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: name,
                    username: session?.user?.username,
                    bio,
                    skills,
                    role: session?.user?.role || "builder",
                    openToCollab,
                    image,
                }),
            });
            if (res.ok) {
                await update();
                alert("Settings synced with neural network.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleSendOTP = async () => {
        setSendingOtp(true);
        try {
            const res = await fetch("/api/profile/otp", { method: "POST" });
            if (res.ok) setOtpSent(true);
        } catch (error) {
            console.error(error);
        } finally {
            setSendingOtp(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
        if (!otpSent) { await handleSendOTP(); return; }
        if (!otp || otp.length !== 6) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/profile", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp })
            });
            if (res.ok) { await update(); signOut(); }
        } catch (e) { console.error(e); }
        finally { setDeleting(false); }
    };

    const toggleSkill = (skill: string) => {
        setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
    };

    const menuItems = [
        { id: "profile", label: "Identity", icon: <User size={18} /> },
        { id: "skills", label: "Skill-Tree", icon: <Award size={18} /> },
        { id: "preferences", label: "Protocols", icon: <Settings size={18} /> },
        { id: "impactxp", label: "Ledger", icon: <TrendingUp size={18} /> },
        { id: "security", label: "encryption", icon: <Shield size={18} /> },
        { id: "danger", label: "Purge", icon: <Trash2 size={18} /> },
    ];

    const SidebarContent = (
        <aside className="p-8">
            <h2 className="text-[10px] font-black text-zinc-600 mb-8 uppercase tracking-widest">
                Account Hub
            </h2>
            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                            activeSection === item.id
                                ? "bg-white text-black shadow-xl scale-[1.02]"
                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            {item.icon}
                            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        {activeSection === item.id && <ChevronRight size={14} />}
                    </button>
                ))}
            </nav>

            <div className="mt-20 pt-8 border-t border-white/5">
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                >
                    <LogOut size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </aside>
    );

    return (
        <AppLayout rightSidebar={SidebarContent}>
            <div className="px-8 py-12 max-w-2xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        Nexus Settings
                    </h1>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                        Configure your presence in the hollow
                    </p>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#0A0A0B] border border-white/5 rounded-[40px] p-10"
                    >
                        {activeSection === "profile" && (
                            <div className="space-y-10">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-accent/20 rounded-full blur group-hover:opacity-100 transition-opacity opacity-0" />
                                        <Avatar name={name} image={image} size="xl" />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 p-3 bg-white text-black rounded-2xl shadow-2xl hover:scale-110 transition-transform"
                                        >
                                            <Camera size={16} />
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    </div>
                                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Biological Uplink</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Callsign</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-accent transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between px-1">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Metadata</label>
                                            <span className="text-[9px] text-zinc-700 font-bold">{bio.length}/140</span>
                                        </div>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value.slice(0, 140))}
                                            rows={4}
                                            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-accent transition-all font-medium resize-none"
                                            placeholder="Broadcast your purpose..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "skills" && (
                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Specialize</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skillOptions.map((skill) => (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                skills.includes(skill)
                                                    ? "bg-white text-black border-white"
                                                    : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20"
                                            } border`}
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === "preferences" && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between p-8 bg-black border border-white/5 rounded-3xl group">
                                    <div>
                                        <p className="text-[11px] font-black text-white uppercase italic mb-1 group-hover:text-accent transition-colors">Neural Collaboration</p>
                                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Allow other builders to interface with you</p>
                                    </div>
                                    <button
                                        onClick={() => setOpenToCollab(!openToCollab)}
                                        className={`w-12 h-6 rounded-full relative transition-all ${openToCollab ? "bg-accent" : "bg-zinc-800"}`}
                                    >
                                        <motion.div
                                            animate={{ x: openToCollab ? 26 : 2 }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                        />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "impactxp" && (
                            <div className="space-y-6">
                                {realXPHistory.length > 0 ? (
                                    realXPHistory.map((entry, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 bg-black border border-white/5 rounded-3xl hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                                    <History size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white uppercase italic">{entry.reason}</p>
                                                    <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                                                        {new Date(entry.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white">+{entry.amount} XP</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 opacity-20">
                                        <History size={48} className="mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No entries recorded</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === "danger" && (
                            <div className="space-y-8">
                                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[32px]">
                                    <div className="flex items-start gap-4 mb-8">
                                        <AlertTriangle size={24} className="text-red-500 mt-1" />
                                        <div>
                                            <h3 className="text-[11px] font-black text-red-500 uppercase italic mb-1">Total Deletion</h3>
                                            <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest leading-loose">
                                                This will initiate a 30-day purge cycle. All neural data will be wiped from the nexus. This action is absolute.
                                            </p>
                                        </div>
                                    </div>

                                    {showDeleteConfirm && otpSent && (
                                        <div className="mb-8 space-y-4">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block text-center">Verify Purge Authorization</label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                className="w-full bg-black border border-red-500/20 rounded-2xl px-6 py-5 text-center text-2xl font-black tracking-[12px] text-white focus:outline-none focus:border-red-500 transition-all font-mono"
                                                placeholder="000000"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting || sendingOtp}
                                            className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                showDeleteConfirm ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-red-500 hover:bg-red-500/10 border border-red-500/20"
                                            }`}
                                        >
                                            {deleting ? "Purging..." : showDeleteConfirm ? (otpSent ? "Confirm Purge" : "Authorize with OTP") : "Initiate Purge"}
                                        </button>
                                        {showDeleteConfirm && (
                                            <button onClick={() => setShowDeleteConfirm(false)} className="py-2 text-[9px] font-black text-zinc-700 uppercase hover:text-white transition-colors">
                                                Abort Protocol
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-10 border-t border-white/5 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-12 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Sync Settings
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </AppLayout>
    );
}
