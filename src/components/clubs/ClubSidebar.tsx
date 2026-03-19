"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
    MessageCircle, 
    Users, 
    Mail, 
    Settings, 
    Hash, 
    Volume2, 
    ChevronRight,
    Crown,
    Shield,
    Star,
    User
} from "lucide-react";

interface ClubSidebarProps {
    club: {
        name: string;
        logo: string | null;
        gradient: string;
        memberCount: number;
        messageCount: number;
        tabs: { key: string; label: string; icon: React.ReactNode; count?: number }[];
    };
    activeTab: string;
    onTabChange: (key: any) => void;
    activeChannel: string;
    onChannelChange: (channel: any) => void;
    myRole: string | null;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
    owner: <Crown size={12} className="text-yellow-500" />,
    coowner: <Shield size={12} className="text-purple-500" />,
    moderator: <Star size={12} className="text-blue-500" />,
    member: <User size={12} className="text-zinc-500" />,
};

export default function ClubSidebar({ 
    club, 
    activeTab, 
    onTabChange, 
    activeChannel, 
    onChannelChange,
    myRole
}: ClubSidebarProps) {
    return (
        <aside className="w-72 flex-shrink-0 bg-[#0c0c0e] border-r border-zinc-800/50 flex flex-col overflow-hidden relative z-20">
            {/* Sidebar Branding */}
            <div className="p-6 border-b border-zinc-800/50 bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/5 flex-shrink-0">
                        {club.logo ? (
                            <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm" style={{ background: club.gradient }}>
                                {club.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-white text-sm truncate">{club.name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {myRole && ROLE_ICON[myRole]}
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">{myRole || "Guest"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
                {/* Channels Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Communication</span>
                        <ChevronRight size={10} className="text-zinc-700" />
                    </div>
                    
                    <div className="space-y-1">
                        <button
                            onClick={() => { onTabChange("chat"); onChannelChange("general"); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${activeTab === "chat" && activeChannel === "general" ? "bg-white/5 text-white border border-white/10 shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent"}`}
                        >
                            <Hash size={16} className={activeTab === "chat" && activeChannel === "general" ? "text-accent" : "text-zinc-600 group-hover:text-zinc-400"} />
                            <span className="flex-1 text-left">General</span>
                        </button>
                        
                        <button
                            onClick={() => { onTabChange("chat"); onChannelChange("announcements"); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${activeTab === "chat" && activeChannel === "announcements" ? "bg-white/5 text-white border border-white/10 shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent"}`}
                        >
                            <Volume2 size={16} className={activeTab === "chat" && activeChannel === "announcements" ? "text-yellow-500" : "text-zinc-600 group-hover:text-zinc-400"} />
                            <span className="flex-1 text-left">Announcements</span>
                        </button>
                    </div>
                </div>

                {/* Pages Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Management</span>
                        <ChevronRight size={10} className="text-zinc-700" />
                    </div>
                    
                    <div className="space-y-1">
                        {club.tabs.filter(t => t.key !== "chat").map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => onTabChange(tab.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${activeTab === tab.key ? "bg-white/5 text-white border border-white/10 shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent"}`}
                            >
                                <span className={activeTab === tab.key ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"}>
                                    {tab.icon}
                                </span>
                                <span className="flex-1 text-left">{tab.label}</span>
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent/20">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer / User Info */}
            <div className="p-4 bg-black/40 border-t border-zinc-800/50">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Hub Connected</span>
                </div>
            </div>
            
            <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent" />
        </aside>
    );
}
