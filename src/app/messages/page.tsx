"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ArrowLeft, Check, X, UserPlus, Inbox, Search, Plus, User, Info, MoreVertical } from "lucide-react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { showToast } from "@/store";
import AppLayout from "@/components/AppLayout";

interface Conversation {
    requestId: string;
    user: { id: string; name: string; username?: string; image: string; role: string; impactXP?: number };
    lastMessage: { text: string; createdAt: string } | null;
}

interface MessageRequest {
    id: string;
    status: string;
    fromUser: { id: string; name: string; username?: string; image: string };
    createdAt: string;
}

interface DM {
    id: string;
    text: string;
    createdAt: string;
    fromUser: { id: string; name: string; image: string };
}

interface SearchUser {
    id: string;
    name: string;
    username?: string;
    image: string;
    role: string;
    impactXP: number;
}

export default function MessagesPage() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [pendingRequests, setPendingRequests] = useState<MessageRequest[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [activeChatUser, setActiveChatUser] = useState<Conversation["user"] | null>(null);
    const [messages, setMessages] = useState<DM[]>([]);
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<SearchUser[]>([]);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/dm");
            if (res.ok) setConversations(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const fetchPendingRequests = useCallback(async () => {
        try {
            const res = await fetch("/api/dm/requests");
            if (res.ok) setPendingRequests(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    const fetchMessages = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`/api/dm/${userId}`);
            if (res.ok) setMessages(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        fetchConversations();
        fetchPendingRequests();
    }, [fetchConversations, fetchPendingRequests]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat);
            pollRef.current = setInterval(() => fetchMessages(activeChat), 3000);
            return () => { if (pollRef.current) clearInterval(pollRef.current); };
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeChat, fetchMessages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!messageText.trim() || !activeChat) return;
        setSending(true);
        try {
            const res = await fetch("/api/dm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send", toUserId: activeChat, text: messageText }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages((prev) => [...prev, msg]);
                setMessageText("");
                // Optionally refresh conversations to update last message
                fetchConversations();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to send message");
            }
        } catch (e) {
            showToast("error", "Network error");
        }
        finally { setSending(false); }
    };

    const handleAcceptRequest = async (requestId: string) => {
        setProcessingRequestId(requestId);
        try {
            await fetch("/api/dm", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status: "accepted" }),
            });
            showToast("success", "Request accepted!");
            fetchConversations();
            fetchPendingRequests();
        } catch (e) {
            showToast("error", "Failed to accept request");
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        setProcessingRequestId(requestId);
        try {
            await fetch("/api/dm", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status: "rejected" }),
            });
            showToast("info", "Request declined");
            fetchPendingRequests();
        } catch (e) {
            showToast("error", "Failed to decline request");
        } finally {
            setProcessingRequestId(null);
        }
    };

    const openChat = (userId: string, user: Conversation["user"]) => {
        setActiveChat(userId);
        setActiveChatUser(user);
    };

    const handleSearchUsers = async (query: string) => {
        setUserSearchQuery(query);
        if (query.length < 2) { setUserSearchResults([]); return; }
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const results = await res.json();
                const existingUserIds = new Set(conversations.map((c) => c.user.id));
                setUserSearchResults(
                    results.filter((u: SearchUser) => u.id !== session?.user?.id && !existingUserIds.has(u.id))
                );
            }
        } catch (e) { console.error(e); }
    };

    const handleSendMessageRequest = async (toUserId: string) => {
        setSendingRequest(true);
        try {
            const res = await fetch("/api/dm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "request", toUserId }),
            });
            if (res.ok) {
                showToast("success", "Message request sent!");
                setShowNewChatModal(false);
                setUserSearchQuery("");
                setUserSearchResults([]);
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to send request");
            }
        } catch (e) {
            showToast("error", "Network error");
        }
        finally { setSendingRequest(false); }
    };

    const filteredConversations = conversations.filter(
        (conv) =>
            !searchQuery ||
            conv.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const SidebarContent = (
        <aside className="h-screen flex flex-col pt-6">
            <div className="px-6 mb-6">
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center justify-between">
                    Chat Info
                    <Info size={18} className="text-zinc-600" />
                </h2>
            </div>

            {activeChatUser ? (
                <div className="flex-1 px-6 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="text-center">
                        <div className="relative inline-block mb-4">
                            <Avatar name={activeChatUser.name} image={activeChatUser.image} size="xl" />
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{activeChatUser.name}</h3>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">
                            {activeChatUser.username ? `@${activeChatUser.username}` : activeChatUser.role}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Member Since</p>
                            <p className="text-xs font-bold text-white">Joined Feb 2024</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Impact Score</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-black text-white italic">{activeChatUser.impactXP || 0}</p>
                                <span className="text-[8px] font-black text-accent uppercase px-1.5 py-0.5 bg-accent/10 rounded-full border border-accent/20">XP</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 space-y-2">
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest rounded-xl border border-white/5 transition-all">
                            View Profile
                        </button>
                        <button className="w-full py-3 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-black text-red-500 uppercase tracking-widest rounded-xl border border-red-500/10 transition-all">
                            Block User
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center px-8 text-center opacity-30">
                    <div>
                        <MessageCircle size={48} className="mx-auto mb-4 text-zinc-800" />
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Select a chat to view user metrics</p>
                    </div>
                </div>
            )}
        </aside>
    );

    return (
        <AppLayout rightSidebar={SidebarContent}>
            <div className="flex h-screen overflow-hidden">
                {/* Conversations List (Fixed Width Column) */}
                <div className={`w-[350px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#080808] ${activeChat ? "hidden md:flex" : "flex w-full"}`}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                Inbox
                            </h1>
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-[1.05] transition-all shadow-lg"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="mb-4">
                                <div className="px-6 py-2 bg-white/5 border-y border-white/5">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Message Requests ({pendingRequests.length})</span>
                                </div>
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="p-4 border-b border-white/5 bg-accent/5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar name={req.fromUser.name} image={req.fromUser.image} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">{req.fromUser.name}</p>
                                                <p className="text-[10px] text-zinc-600">Requesting access</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptRequest(req.id)}
                                                className="flex-1 py-1.5 bg-white text-black text-[9px] font-black uppercase rounded-lg hover:scale-[1.02] transition-all"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req.id)}
                                                className="flex-1 py-1.5 bg-white/5 text-zinc-500 text-[9px] font-black uppercase rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Conversations */}
                        {filteredConversations.length === 0 ? (
                            <div className="px-6 py-20 text-center opacity-20">
                                <Inbox size={48} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No conversations</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.requestId}
                                    onClick={() => openChat(conv.user.id, conv.user)}
                                    className={`w-full p-4 flex items-center gap-4 hover:bg-white/[0.02] border-b border-white/[0.02] transition-all ${activeChat === conv.user.id ? "bg-white/5 border-l-2 border-l-accent" : ""}`}
                                >
                                    <Avatar name={conv.user.name} image={conv.user.image} size="md" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-black text-white uppercase italic truncate">{conv.user.name}</p>
                                            <span className="text-[8px] font-bold text-zinc-700 uppercase">2m</span>
                                        </div>
                                        {conv.lastMessage && (
                                            <p className="text-[11px] text-zinc-600 truncate font-medium">
                                                {conv.lastMessage.text}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area (Main Column) */}
                <div className={`flex-1 flex flex-col bg-black ${!activeChat ? "hidden md:flex" : "flex"}`}>
                    {!activeChat ? (
                        <div className="flex-1 flex items-center justify-center p-12 text-center">
                            <div className="max-w-xs">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                    <MessageCircle size={32} className="text-zinc-800" />
                                </div>
                                <h3 className="text-xl font-black text-white italic uppercase mb-2">Your Workspace</h3>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                                    Select a builder to start collaborating, share ideas, and build the future together.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden text-zinc-600 hover:text-white">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <Avatar name={activeChatUser?.name || ""} image={activeChatUser?.image} size="sm" />
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic">{activeChatUser?.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="text-zinc-600 hover:text-white transition-colors">
                                        <Search size={18} />
                                    </button>
                                    <button className="text-zinc-600 hover:text-white transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {messages.map((msg, i) => {
                                    const isMe = msg.fromUser.id === session?.user?.id;
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[70%] group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                <div className={`px-5 py-3 rounded-2xl text-[13px] font-medium leading-relaxed ${
                                                    isMe ? "bg-white text-black rounded-tr-none" : "bg-white/5 text-white border border-white/5 rounded-tl-none"
                                                }`}>
                                                    {msg.text}
                                                </div>
                                                <span className="text-[8px] font-bold text-zinc-700 uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-8 border-t border-white/5">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-purple-600 rounded-[24px] blur opacity-10 group-focus-within:opacity-20 transition-all" />
                                    <div className="relative flex items-center bg-[#111] border border-white/5 rounded-[22px] p-2 pr-4">
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                            placeholder="Write your message..."
                                            className="flex-1 bg-transparent px-6 py-3 text-sm text-white focus:outline-none placeholder-zinc-700 font-medium"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!messageText.trim() || sending}
                                            className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setShowNewChatModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0D0D0F] border border-white/5 rounded-[40px] p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                    <UserPlus size={20} className="text-accent" /> New Message
                                </h2>
                                <button onClick={() => setShowNewChatModal(false)} className="text-zinc-600 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="relative mb-6">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input
                                    type="text"
                                    value={userSearchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    placeholder="Builder name or @username..."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-white/10 transition-all font-medium"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {userSearchResults.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => handleSendMessageRequest(u.id)}
                                        disabled={sendingRequest}
                                        className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/5"
                                    >
                                        <Avatar name={u.name} image={u.image} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-white uppercase italic group-hover:text-accent transition-colors">{u.name}</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{u.username ? `@${u.username}` : u.role} · {u.impactXP} XP</p>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white/5 text-[8px] font-black text-white uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-all">Connect</div>
                                    </button>
                                ))}
                                {userSearchResults.length === 0 && userSearchQuery.length >= 2 && (
                                    <p className="text-center py-8 text-[10px] font-bold text-zinc-700 uppercase tracking-widest italic">No builders found</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
