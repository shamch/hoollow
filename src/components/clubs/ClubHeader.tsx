"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Info, Users, Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

interface ClubHeaderProps {
    club: {
        name: string;
        description: string;
        banner: string | null;
        logo: string | null;
        gradient: string;
        visibility: string;
        domain: string;
        memberCount: number;
        themeColor: string;
    };
    isMember: boolean;
    hasPendingRequest: boolean;
    onJoinLeave: () => void;
}

export default function ClubHeader({ club, isMember, hasPendingRequest, onJoinLeave }: ClubHeaderProps) {
    const router = useRouter();

    return (
        <div className="relative w-full">
            {/* Banner Section */}
            <div 
                className="h-64 md:h-80 w-full relative overflow-hidden"
                style={club.banner ? { 
                    backgroundImage: `url(${club.banner})`, 
                    backgroundSize: "cover", 
                    backgroundPosition: "center" 
                } : { background: club.gradient }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
                
                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <button 
                        onClick={() => router.push("/clubs")} 
                        className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white transition-all group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-wider">Back to Explore</span>
                    </button>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10 pb-8">
                <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
                    {/* Logo */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-zinc-900 border-4 border-background overflow-hidden shadow-2xl relative group flex-shrink-0"
                    >
                        {club.logo ? (
                            <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ background: club.gradient }}>
                                {club.name.charAt(0)}
                            </div>
                        )}
                    </motion.div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 pb-2">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col gap-2"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{club.name}</h1>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        {club.domain}
                                    </span>
                                    <span className="px-3 py-1 bg-white/5 backdrop-blur-md border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                        {club.visibility === "private" ? <Lock size={10} className="text-orange-400" /> : <Globe size={10} className="text-blue-400" />}
                                        {club.visibility}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-zinc-500 text-sm font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Users size={16} />
                                    <span>{club.memberCount} members</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                <div className="flex items-center gap-1.5">
                                    <Info size={16} />
                                    <span className="capitalize">{club.domain} Focus</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Action Button */}
                    {!isMember && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="pb-2"
                        >
                            {hasPendingRequest ? (
                                <div className="px-8 py-3 bg-zinc-800/50 backdrop-blur-md border border-zinc-700 rounded-full text-zinc-400 text-sm font-bold uppercase tracking-widest">
                                    Pending Approval
                                </div>
                            ) : (
                                <Button 
                                    variant="primary" 
                                    onClick={onJoinLeave}
                                    className="px-10 py-4 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all"
                                >
                                    {club.type === "open" ? "Join Community" : "Request Invitation"}
                                </Button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
