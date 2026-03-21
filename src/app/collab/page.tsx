"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Inbox,
    Send,
    Check,
    X,
    MessageCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { showToast } from "@/store";
import AppLayout from "@/components/AppLayout";

interface CollabUser {
    id: string;
    name: string;
    image: string;
    role: string;
}

interface CollabRequest {
    id: string;
    message: string | null;
    status: string;
    post: { id: string; title: string } | null;
    project: { id: string; name: string } | null;
    fromUser?: CollabUser;
    toUser?: CollabUser;
    createdAt: string;
}

const tabs = ["Incoming", "Outgoing", "Active"] as const;
type TabType = (typeof tabs)[number];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    pending: { icon: <Clock size={14} />, color: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
    accepted: { icon: <CheckCircle2 size={14} />, color: "text-green-600", bg: "bg-green-50", label: "Accepted" },
    rejected: { icon: <XCircle size={14} />, color: "text-red-500", bg: "bg-red-50", label: "Rejected" },
};

function getTimeAgo(date: string) {
    let ms = Date.now() - new Date(date).getTime();
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function CollabPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>("Incoming");
    const [sent, setSent] = useState<CollabRequest[]>([]);
    const [received, setReceived] = useState<CollabRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchCollabs = useCallback(async () => {
        try {
            const res = await fetch("/api/collab");
            if (res.ok) {
                const data = await res.json();
                setSent(data.sent || []);
                setReceived(data.received || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCollabs();
    }, [fetchCollabs]);

    const handleAction = async (id: string, status: "accepted" | "rejected") => {
        setProcessingId(id);
        try {
            const res = await fetch("/api/collab", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                showToast("success", status === "accepted" ? "Collaboration accepted! You can now DM each other." : "Request declined.");
                fetchCollabs();
            } else {
                showToast("error", "Failed to update request");
            }
        } catch (e) {
            showToast("error", "Network error");
        } finally {
            setProcessingId(null);
        }
    };

    const incoming = received.filter((r) => r.status === "pending");
    const outgoing = sent;
    const active = [
        ...received.filter((r) => r.status === "accepted"),
        ...sent.filter((r) => r.status === "accepted"),
    ];

    const currentItems = activeTab === "Incoming" ? incoming : activeTab === "Outgoing" ? outgoing : active;

    return (
        <AppLayout>
            <div className="px-8 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                        <Users size={24} className="text-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                            Collaborations
                        </h1>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                            Assemble your dream team
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-white/5 mb-8">
                    {tabs.map((tab) => {
                        const count = tab === "Incoming" ? incoming.length : tab === "Outgoing" ? outgoing.length : active.length;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative pb-4 text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {tab}
                                    {count > 0 && (
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                            activeTab === tab ? "bg-accent text-white" : "bg-white/5 text-zinc-600"
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </span>
                                {activeTab === tab && (
                                    <motion.span
                                        layoutId="collabTabLine"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : currentItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-[#111114] border border-white/5 rounded-[40px]"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                            {activeTab === "Incoming" ? <Inbox size={32} className="text-zinc-800" /> :
                             activeTab === "Outgoing" ? <Send size={32} className="text-zinc-800" /> :
                             <Sparkles size={32} className="text-zinc-800" />}
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase mb-2">
                            {activeTab === "Incoming" ? "Quiet here" :
                             activeTab === "Outgoing" ? "Nothing sent" :
                             "No active crews"}
                        </h3>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto opacity-60">
                            {activeTab === "Incoming" ? "When someone wants to collaborate, you'll see requests here." :
                             activeTab === "Outgoing" ? "Send collab requests from posts on the feed." :
                             "Accepted collaborations will appear here."}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {currentItems.map((item, i) => {
                                const user = activeTab === "Incoming" ? item.fromUser : activeTab === "Outgoing" ? item.toUser : (item.fromUser?.id === session?.user?.id ? item.toUser : item.fromUser);
                                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                                const contextTitle = item.post?.title || item.project?.name || "Unknown";

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="bg-[#111114] border border-white/5 rounded-[32px] p-6 hover:border-white/10 transition-all group"
                                    >
                                        <div className="flex items-start gap-5">
                                            <Avatar name={user?.name || "User"} image={user?.image} size="lg" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className="text-sm font-black text-white group-hover:text-accent transition-colors">
                                                        {user?.name || "User"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{user?.role}</span>
                                                    <div className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${statusCfg.color} ${statusCfg.bg} border-current/10 uppercase tracking-tighter`}>
                                                        {statusCfg.icon} {statusCfg.label}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                                    {activeTab === "Incoming" ? "Requesting to collaborate on" : activeTab === "Outgoing" ? "You requested to join" : "Working together on"}{" "}
                                                    <strong className="text-white">&ldquo;{contextTitle}&rdquo;</strong>
                                                </p>
                                                {item.message && (
                                                    <div className="bg-black/40 rounded-2xl p-4 mt-4 relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-accent/20" />
                                                        <p className="text-xs text-zinc-400 font-medium italic">
                                                            &ldquo;{item.message}&rdquo;
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-4 mt-4">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                                        <Clock size={10} /> {getTimeAgo(item.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {activeTab === "Incoming" && item.status === "pending" && (
                                                    <>
                                                        <button
                                                            disabled={processingId === item.id}
                                                            onClick={() => handleAction(item.id, "accepted")}
                                                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all disabled:opacity-50"
                                                        >
                                                            <Check size={14} /> Accept
                                                        </button>
                                                        <button
                                                            disabled={processingId === item.id}
                                                            onClick={() => handleAction(item.id, "rejected")}
                                                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
                                                        >
                                                            <X size={14} /> Skip
                                                        </button>
                                                    </>
                                                )}
                                                {activeTab === "Active" && (
                                                    <Link
                                                        href="/messages"
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-lg shadow-accent/20"
                                                    >
                                                        <MessageCircle size={14} /> DM
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
