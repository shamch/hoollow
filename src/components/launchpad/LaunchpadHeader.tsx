"use client";

import React from "react";
import { motion } from "framer-motion";
import { Rocket, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import Button from "@/components/Button";

interface LaunchpadHeaderProps {
    countdown: { days: number; hours: number; minutes: number; seconds: number };
    onOpenSubmit: () => void;
}

const weeks = [
    { label: "Week 9", current: false },
    { label: "Week 10", current: false },
    { label: "Week 11", current: false },
    { label: "Week 12", current: true },
    { label: "Week 13", current: false },
    { label: "Week 14", current: false },
    { label: "Week 15", current: false },
];

export default function LaunchpadHeader({ countdown, onOpenSubmit }: LaunchpadHeaderProps) {
    return (
        <header className="pt-6 pb-2 px-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black text-white tracking-tight">Launchpad</h1>
                    <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                        Categories
                        <ChevronLeft size={12} className="-rotate-90" />
                    </button>
                    <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
                        <HelpCircle size={18} />
                    </button>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center gap-2 mb-6 select-none">
                <button className="p-1.5 text-zinc-600 hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div className="flex-1 flex items-center justify-between px-4">
                    {weeks.map((week) => (
                        <button 
                            key={week.label}
                            className={`
                                text-[11px] font-black uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg
                                ${week.current 
                                    ? "bg-accent/10 border border-accent/20 text-accent" 
                                    : "text-zinc-600 hover:text-zinc-400"}
                            `}
                        >
                            {week.label}
                        </button>
                    ))}
                </div>
                <button className="p-1.5 text-zinc-600 hover:text-white transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Status Bar */}
            <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Voting will close in</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-white tabular-nums tracking-tighter">
                            {countdown.days}d : {countdown.hours}h : {countdown.minutes}m : {countdown.seconds}s
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-accent transition-colors cursor-pointer">
                        🏆 Peerlist Top Builders <ChevronRight size={14} />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">↑↓ Trending</span>
                    </div>
                    <Button 
                        variant="primary" 
                        size="md" 
                        onClick={onOpenSubmit}
                        className="rounded-full font-black uppercase tracking-widest text-[10px] px-6 flex items-center gap-2 group/btn"
                    >
                        Launch <Rocket size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
