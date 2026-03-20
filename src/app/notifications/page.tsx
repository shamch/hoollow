"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    ChevronUp,
    Users,
    MessageCircle,
    Check,
    CheckCheck,
    Trash2,
    ArrowLeft,
    Sparkles,
    Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    relatedId?: string;
    createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    upvote: { icon: <ChevronUp size={14} />, color: "text-accent", bg: "bg-accent/10", label: "Upvote" },
    comment: { icon: <MessageCircle size={14} />, color: "text-blue-500", bg: "bg-blue-500/10", label: "Comment" },
    club_invite: { icon: <Users size={14} />, color: "text-purple-500", bg: "bg-purple-500/10", label: "Club Invite" },
    collab_request: { icon: <Users size={14} />, color: "text-green-500", bg: "bg-green-500/10", label: "Collab" },
    message_request: { icon: <MessageCircle size={14} />, color: "text-orange-500", bg: "bg-orange-500/10", label: "Message Req" },
    dm: { icon: <MessageCircle size={14} />, color: "text-accent", bg: "bg-accent/10", label: "Message" },
};

function getTimeAgo(date: string) {
    let ms = Date.now() - new Date(date).getTime();
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
}

export default function NotificationsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ readAll: true }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    const markRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] }),
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.read) markRead(notif.id);

        if (notif.type === "upvote" || notif.type === "comment") {
            if (notif.relatedId) router.push(`/feed/${notif.relatedId}`);
        } else if (notif.type === "club_invite") {
            if (notif.relatedId) router.push(`/clubs/${notif.relatedId}`);
            else router.push(`/clubs`);
        } else if (notif.type === "collab_request") {
            router.push("/collab");
        } else if (notif.type === "message_request" || notif.type === "dm") {
            router.push("/messages");
        }
    };

    const RightSidebarContent = (
        <aside className="p-6 space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest">
                    Quick Stats
                </h3>
                <div className="space-y-6">
                    <div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Unread Alerts</p>
                        <p className="text-2xl font-black text-white italic">{unreadCount}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Last Notification</p>
                        <p className="text-xs font-bold text-white uppercase italic">
                            {notifications[0] ? getTimeAgo(notifications[0].createdAt) + " ago" : "No updates"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest">
                    Preferences
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Alerts</span>
                        <div className="w-8 h-4 bg-accent/20 rounded-full relative">
                            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-accent rounded-full" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Push Alerts</span>
                        <div className="w-8 h-4 bg-accent/20 rounded-full relative">
                            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-accent rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <AppLayout rightSidebar={RightSidebarContent}>
            <div className="px-8 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                            <Bell size={24} className="text-accent" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                Activity
                            </h1>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                                Stay updated with your network
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] transition-all shadow-lg"
                        >
                            <CheckCheck size={14} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-32 bg-[#111114] border border-white/5 rounded-[40px]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Sparkles size={32} className="text-zinc-800" />
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase mb-2">Zero Alerts</h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-xs mx-auto opacity-60">
                            You're all caught up. New updates will land here silently.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((notif, i) => {
                                const cfg = TYPE_CONFIG[notif.type] || { icon: <Bell size={14} />, color: "text-zinc-500", bg: "bg-white/5", label: "System" };
                                return (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`group relative flex items-center gap-4 p-5 rounded-[28px] cursor-pointer transition-all border border-transparent ${
                                            notif.read ? "bg-transparent hover:bg-white/[0.02]" : "bg-[#111114] border-white/5 hover:border-white/10 shadow-xl"
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color} border border-current/10 group-hover:scale-110 transition-transform shadow-lg`}>
                                            {cfg.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold leading-relaxed ${notif.read ? "text-zinc-500" : "text-white"}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-current/10 ${cfg.color} ${cfg.bg}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                                    {getTimeAgo(notif.createdAt)} ago
                                                </span>
                                            </div>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                                        )}
                                        <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-zinc-700 hover:text-white transition-colors">
                                                <Trash2 size={16} />
                                            </button>
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
