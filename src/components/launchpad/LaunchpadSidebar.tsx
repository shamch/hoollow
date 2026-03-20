"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, Bell, User } from "lucide-react";
import Avatar from "@/components/Avatar";

interface LaunchpadSidebarProps {
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    activeSort: string;
    setActiveSort: (sort: string) => void;
    stats: { totalProjects: number; totalUpvotes: number; activeBuilders: number };
    topBuilders: any[];
}

export default function LaunchpadSidebar({ 
    stats, topBuilders 
}: LaunchpadSidebarProps) {
    return (
        <aside className="w-[320px] h-screen sticky top-0 p-6 space-y-8 flex flex-col bg-[#000000]">
            {/* Top Toolbar */}
            <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search Hoollow" 
                        className="w-full bg-[#111114] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all"
                    />
                </div>
                <button className="relative p-2 rounded-xl border border-white/5 bg-[#111114] text-zinc-500 hover:text-white transition-colors">
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent border-2 border-[#111114]" />
                    <Bell size={18} />
                </button>
                <button className="p-2 rounded-xl border border-white/5 bg-[#111114] text-zinc-500 hover:text-white transition-colors">
                    <User size={18} />
                </button>
            </div>

            {/* Top Builders section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white tracking-widest uppercase">Top Builders — Last 30 Days</h3>
                    <ChevronRight size={16} className="text-zinc-600 hover:text-white cursor-pointer transition-colors" />
                </div>

                <div className="space-y-5">
                    {topBuilders.slice(0, 5).map((builder) => (
                        <div key={builder.id} className="flex items-start gap-3 group">
                            <div className="relative flex-shrink-0">
                                <Avatar image={builder.image} name={builder.name} size="md" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#000000] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-black text-white truncate">{builder.name}</span>
                                    <button className="text-[10px] font-black text-blue-500 hover:underline">Follow</button>
                                </div>
                                <p className="text-[10px] text-zinc-500 line-clamp-2 font-medium leading-relaxed">
                                    {builder.role || "Builder & Innovator"} | {builder.totalUpvotes} Upvotes this month
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Alpha Stats (Cleaned up) */}
            <div className="pt-8 border-t border-white/5">
                 <div className="grid grid-cols-1 gap-3">
                    <div className="p-5 rounded-2xl bg-[#111114] border border-white/5 space-y-1">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Launches</p>
                        <p className="text-xl font-black text-white tabular-nums tracking-tighter">{stats.totalProjects}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#111114] border border-white/5 space-y-1">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Hive</p>
                        <p className="text-xl font-black text-white tabular-nums tracking-tighter">{stats.activeBuilders}</p>
                    </div>
                </div>
            </div>

            {/* Advertise / Footer link hint */}
            <div className="mt-auto pb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 group hover:border-white/10 transition-all cursor-pointer">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                        Want to showcase your product? <span className="text-white group-hover:text-accent transition-colors">Start here →</span>
                    </p>
                </div>
            </div>
        </aside>
    );
}
