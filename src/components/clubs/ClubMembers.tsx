"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Crown, Trash2, Ban, Clock, Shield, Star, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import { ROLE_ICON, ROLE_LABEL, ROLE_LEVEL, ROLE_COLORS } from "./constants";

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
        image: string;
        impactXP: number;
    };
}

interface ClubMembersProps {
    members: Member[];
    myRole: string | null;
    myLevel: number;
    canManageMembers: boolean;
    activeMemberId: string | null;
    setActiveMemberId: (id: string | null) => void;
    currentUserId?: string;
    onAction: (action: string, memberId: string, data?: any) => void;
}

export default function ClubMembers({ 
    members = [], 
    myRole, 
    myLevel, 
    canManageMembers, 
    activeMemberId, 
    setActiveMemberId,
    currentUserId,
    onAction
}: ClubMembersProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#0c0c0e]">
            <header className="mb-8">
                <h2 className="text-2xl font-black text-white tracking-tight">Community Members</h2>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">
                    {members.length} Builders in this tribe
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m) => {
                    const memberLevel = ROLE_LEVEL[m.role] || 0;
                    const canActOn = canManageMembers && memberLevel < myLevel && m.user.id !== currentUserId;
                    const isOwner = myRole === "owner";

                    return (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between group hover:border-white/10 transition-all hover:bg-zinc-900/50"
                        >
                            <div className="flex items-center gap-4">
                                <Avatar name={m.user.name} image={m.user.image} size="md" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate group-hover:text-accent transition-colors">{m.user.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${ROLE_COLORS[m.role]}`}>
                                            {ROLE_ICON[m.role]} {ROLE_LABEL[m.role]}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                            {m.user.impactXP} XP
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {canActOn && (
                                <div className="relative">
                                    <button 
                                        onClick={() => setActiveMemberId(activeMemberId === m.id ? null : m.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {activeMemberId === m.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute right-0 top-10 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-30"
                                            >
                                                <div className="px-3 py-1.5 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-zinc-800 mb-1">
                                                    Member Actions
                                                </div>
                                                
                                                {/* Change Role */}
                                                {Object.entries(ROLE_LABEL)
                                                    .filter(([role]) => ROLE_LEVEL[role] < myLevel && role !== m.role && role !== "owner")
                                                    .map(([role, label]) => (
                                                        <button 
                                                            key={role}
                                                            onClick={() => onAction("changeRole", m.id, { newRole: role })}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-all"
                                                        >
                                                            {ROLE_ICON[role]} Promote to {label}
                                                        </button>
                                                    ))
                                                }

                                                {isOwner && (
                                                    <button 
                                                        onClick={() => onAction("transfer", m.id)}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-yellow-500/80 hover:text-yellow-500 hover:bg-yellow-500/5 flex items-center gap-2 transition-all border-t border-zinc-800 mt-1 pt-3"
                                                    >
                                                        <Crown size={14} /> Transfer Ownership
                                                    </button>
                                                )}

                                                <div className="border-t border-zinc-800 my-1 mt-2 pt-2" />
                                                
                                                <button 
                                                    onClick={() => onAction("kick", m.id)}
                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-500/80 hover:text-red-500 hover:bg-red-500/5 flex items-center gap-2 transition-all"
                                                >
                                                    <Trash2 size={14} /> Kick from Club
                                                </button>
                                                
                                                <button 
                                                    onClick={() => onAction("ban", m.id)}
                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600/80 hover:text-red-600 hover:bg-red-600/5 flex items-center gap-2 transition-all"
                                                >
                                                    <Ban size={14} /> Ban Forever
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
