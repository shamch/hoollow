"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, Volume2, Info, Star } from "lucide-react";
import Avatar from "@/components/Avatar";

interface Message {
    id: string;
    text: string;
    createdAt: string;
    author: {
        id: string;
        name: string;
        image: string;
    };
}

interface ClubChatProps {
    messages: Message[];
    messageText: string;
    onMessageChange: (text: string) => void;
    onSendMessage: () => void;
    sending: boolean;
    channel: string;
    currentUserId?: string;
}

export default function ClubChat({ 
    messages = [], 
    messageText, 
    onMessageChange, 
    onSendMessage, 
    sending, 
    channel,
    currentUserId
}: ClubChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative">
            {/* Chat Header / TopBar */}
            <div className="h-16 flex-shrink-0 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                        {channel === "general" ? <Hash size={18} /> : <Volume2 size={18} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm capitalize">{channel}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest leading-none mt-0.5">
                            {channel === "general" ? "Community Discussion" : "Official Announcements"}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <Info size={18} />
                    </button>
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <Star size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
            >
                <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                                {channel === "general" ? <Hash size={32} /> : <Volume2 size={32} />}
                            </div>
                            <h4 className="text-white font-bold mb-1">Welcome to #{channel}</h4>
                            <p className="text-zinc-500 text-xs">Start the conversation by sending the first message.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.author.id === currentUserId;
                            const showAvatar = i === 0 || messages[i-1].author.id !== msg.author.id;
                            
                            return (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-start gap-4 ${!showAvatar ? "pt-0 -mt-4 pl-12" : "mt-2"}`}
                                >
                                    {showAvatar && (
                                        <div className="flex-shrink-0">
                                            <Avatar name={msg.author.name} image={msg.author.image} size="sm" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        {showAvatar && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                                                    {msg.author.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 font-medium tabular-nums">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`text-sm text-zinc-300 leading-relaxed break-words px-3 py-2 rounded-2xl ${isMe ? "bg-accent/5" : "hover:bg-white/[0.02]"}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-6 pt-2">
                <div className="relative group">
                    <input 
                        type="text"
                        value={messageText}
                        onChange={(e) => onMessageChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                        placeholder={`Message #${channel}`}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-5 pr-14 py-4 text-sm text-white focus:outline-none focus:border-accent/40 focus:bg-zinc-900 transition-all font-medium placeholder-zinc-700"
                    />
                    <div className="absolute right-2 top-2 flex items-center">
                        <button 
                            onClick={onSendMessage}
                            disabled={!messageText.trim() || sending}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${messageText.trim() ? "bg-accent text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] scale-100" : "bg-zinc-800 text-zinc-600 scale-90"}`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-4 px-2">
                    <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Typing status enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
