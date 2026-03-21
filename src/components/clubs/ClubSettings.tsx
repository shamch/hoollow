"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
    Settings, 
    User, 
    Palette, 
    Key, 
    Shield, 
    Camera, 
    Image as ImageIcon, 
    Loader2, 
    Trash2, 
    Copy, 
    RefreshCw, 
    X, 
    Check 
} from "lucide-react";
import Button from "@/components/Button";
import { ROLE_ICON, ROLE_LABEL, ROLE_COLORS } from "./constants";

interface ClubSettingsProps {
    club: any;
    editState: any;
    setEditState: (state: any) => void;
    saving: boolean;
    onSave: () => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => void;
    onRegenerateCode: () => void;
    onGenerateNewCode: () => void;
    onRevokeCode: (id: string) => void;
    onPermissionChange: (role: string, perm: string, value: boolean) => void;
    isOwner: boolean;
    uploadingLogo: boolean;
    uploadingBanner: boolean;
    logoInputRef: React.RefObject<HTMLInputElement>;
    bannerInputRef: React.RefObject<HTMLInputElement>;
}

export default function ClubSettings({
    club,
    editState,
    setEditState,
    saving,
    onSave,
    onImageUpload,
    onRegenerateCode,
    onGenerateNewCode,
    onRevokeCode,
    onPermissionChange,
    isOwner,
    uploadingLogo,
    uploadingBanner,
    logoInputRef,
    bannerInputRef
}: ClubSettingsProps) {
    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0e]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-zinc-800/50 px-8 py-6 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Community Engine</h2>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Control center for {club.name}</p>
                    </div>
                </div>
                <Button 
                    variant="primary" 
                    onClick={onSave} 
                    disabled={saving}
                    className="px-8 py-3 rounded-full shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]"
                >
                    {saving ? "Deploying Changes..." : "Save Configuration"}
                </Button>
            </div>

            <div className="max-w-6xl mx-auto p-8 space-y-12 pb-32">
                {/* Visual Identity Section */}
                <motion.section 
                    variants={sectionVariants} initial="hidden" animate="visible"
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 border-l-4 border-accent pl-4">
                        <Palette size={20} className="text-accent" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Visual Identity</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[32px] p-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Community Mark</label>
                            <div className="space-y-4">
                                <div 
                                    onClick={() => logoInputRef.current?.click()}
                                    className="relative w-32 h-32 rounded-[32px] bg-zinc-950 border border-white/5 overflow-hidden group cursor-pointer shadow-2xl"
                                >
                                    {editState.logo ? (
                                        <img src={editState.logo} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Logo" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {uploadingLogo ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                                    </div>
                                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => onImageUpload(e, 'logo')} />
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed pr-8">
                                    High resolution mark for community recognition. Min 512x512.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Banner Landscape</label>
                                <div 
                                    onClick={() => bannerInputRef.current?.click()}
                                    className="relative aspect-[3/1] rounded-3xl bg-zinc-950 border border-white/5 overflow-hidden group cursor-pointer shadow-inner"
                                >
                                    {editState.banner ? (
                                        <img src={editState.banner} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Banner" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        {uploadingBanner ? <Loader2 className="animate-spin text-white" /> : <Camera size={32} className="text-white" />}
                                    </div>
                                    <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => onImageUpload(e, 'banner')} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Accent DNA</label>
                                    <div className="flex gap-3">
                                        <input 
                                            type="color" value={editState.themeColor} 
                                            onChange={(e) => setEditState({...editState, themeColor: e.target.value})}
                                            className="w-12 h-12 rounded-xl bg-zinc-950 border border-white/5 cursor-pointer p-1" 
                                        />
                                        <input 
                                            type="text" value={editState.themeColor} 
                                            onChange={(e) => setEditState({...editState, themeColor: e.target.value})}
                                            className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 text-xs font-mono text-white uppercase tracking-widest focus:border-accent/40 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Community Vibe</label>
                                    <select 
                                        value={editState.vibe} 
                                        onChange={(e) => setEditState({...editState, vibe: e.target.value})}
                                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 h-12 text-xs font-bold text-white focus:border-accent/40 outline-none"
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="casual">Casual</option>
                                        <option value="gaming">Gaming</option>
                                        <option value="creative">Creative</option>
                                        <option value="academic">Academic</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Core Configuration Section */}
                <motion.section 
                    variants={sectionVariants} initial="hidden" animate="visible"
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 border-l-4 border-accent pl-4">
                        <User size={20} className="text-accent" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Core Configuration</h3>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[32px] p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Community Name</label>
                                <input 
                                    type="text" value={editState.name} 
                                    onChange={(e) => setEditState({...editState, name: e.target.value})}
                                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-accent/40 outline-none placeholder:text-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Industry Domain</label>
                                <select 
                                    value={editState.domain} 
                                    onChange={(e) => setEditState({...editState, domain: e.target.value})}
                                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-accent/40 outline-none"
                                >
                                    <option value="Tech">Technology</option>
                                    <option value="Design">Design</option>
                                    <option value="Business">Business</option>
                                    <option value="Research">Research</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Mission Statement</label>
                            <textarea 
                                value={editState.description} 
                                onChange={(e) => setEditState({...editState, description: e.target.value})}
                                rows={4}
                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-300 focus:border-accent/40 outline-none placeholder:text-zinc-800 resize-none leading-relaxed"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Permissions & Security Section */}
                {isOwner && (
                    <motion.section 
                        variants={sectionVariants} initial="hidden" animate="visible"
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 border-l-4 border-accent pl-4">
                            <Shield size={20} className="text-accent" />
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Roles & Permissions</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {["coowner", "moderator", "member"].map((role) => {
                                const rolePerms = editState.permissions?.[role] || {};
                                return (
                                    <div key={role} className="bg-zinc-900/30 border border-zinc-800/50 rounded-[32px] overflow-hidden">
                                        <div className={`p-5 flex items-center justify-between border-b border-zinc-800/50 ${ROLE_COLORS[role]} !border-b-0`}>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                {ROLE_ICON[role]} {ROLE_LABEL[role]}
                                            </span>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {["kick", "ban", "timeout", "manageInvites", "editSettings", "postAnnouncements"].map((perm) => (
                                                <label key={perm} className="flex items-center justify-between group cursor-pointer">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase group-hover:text-zinc-300 transition-colors">
                                                        {perm.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <div 
                                                        onClick={() => onPermissionChange(role, perm, !rolePerms[perm])}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${rolePerms[perm] ? 'bg-accent' : 'bg-zinc-800'}`}
                                                    >
                                                        <motion.div 
                                                            animate={{ x: rolePerms[perm] ? 20 : 2 }}
                                                            className="absolute top-1 left-0 w-3 h-3 rounded-full bg-white shadow-sm" 
                                                        />
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* Access Codes Section */}
                {isOwner && club.visibility === "private" && (
                    <motion.section 
                        variants={sectionVariants} initial="hidden" animate="visible"
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3 border-l-4 border-accent pl-4">
                            <Key size={20} className="text-accent" />
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Secure Access</h3>
                        </div>

                        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[32px] p-8 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block pl-1">Master Invite Code</label>
                                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 relative overflow-hidden group">
                                        <code className="text-2xl font-mono font-black text-white tracking-[0.3em] block text-center mb-4">
                                            {club.inviteCode}
                                        </code>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(club.inviteCode)}
                                                className="flex-1 bg-white/5 border border-white/5 rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <Copy size={16} /> Copy
                                            </button>
                                            <button 
                                                onClick={onRegenerateCode}
                                                className="w-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Disposable Session Codes</label>
                                    <button 
                                        onClick={onGenerateNewCode}
                                        className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                                    >
                                        + Generate One-Time Code
                                    </button>
                                </div>
                                <div className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden divide-y divide-zinc-900">
                                    {club.inviteCodes?.length > 0 ? club.inviteCodes.map((code: any) => (
                                        <div key={code.id} className="p-4 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <code className="font-mono text-white font-bold">{code.code}</code>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                                    {code.uses}/{code.maxUses || "∞"} Uses
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => onRevokeCode(code.id)}
                                                className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="p-12 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                                            No active session codes
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Danger Zone */}
                {isOwner && (
                    <motion.section 
                        variants={sectionVariants} initial="hidden" animate="visible"
                        transition={{ delay: 0.4 }}
                        className="space-y-6 pt-12 border-t border-zinc-800/50"
                    >
                        <div className="flex items-center gap-3 border-l-4 border-red-500 pl-4">
                            <Trash2 size={20} className="text-red-500" />
                            <h3 className="text-lg font-black text-red-500 uppercase tracking-tighter">Danger Zone</h3>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h4 className="text-white font-bold mb-1">Dissolve this Community</h4>
                                <p className="text-zinc-500 text-xs font-medium">Permanently delete everything. This process takes 30 days to complete.</p>
                            </div>
                            <Button 
                                variant="primary" 
                                onClick={() => (window as any).triggerDeleteModal()} 
                                className="!bg-red-600 hover:!bg-red-700 !text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest"
                            >
                                Schedule Deletion
                            </Button>
                        </div>
                    </motion.section>
                )}
            </div>
        </div>
    );
}
