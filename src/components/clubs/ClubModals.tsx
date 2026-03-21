"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, AlertTriangle, Shield, Crown, Key, Loader2, Check } from "lucide-react";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

const BaseModal = ({ isOpen, onClose, title, description, children }: ModalProps) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
                            {description && <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{description}</p>}
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export const InviteModal = ({ 
    isOpen, onClose, search, onSearch, results = [], onInvite, inviting 
}: any) => (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Invite Builders" description="Expand your tribe">
        <div className="space-y-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent transition-colors" size={18} />
                <input 
                    type="text" value={search} onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search by name or @username..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-accent/40 transition-all font-medium"
                />
            </div>
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {results.length > 0 ? results.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                            <Avatar name={user.name} image={user.image} size="sm" />
                            <div>
                                <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">@{user.username || user.id}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onInvite(user.id)}
                            disabled={inviting}
                            className="text-accent text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-accent/10 rounded-lg hover:bg-accent hover:text-white transition-all"
                        >
                            {inviting ? "Sending..." : "Invite"}
                        </button>
                    </div>
                )) : search.length >= 2 ? (
                    <p className="text-center py-8 text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No builders found</p>
                ) : (
                    <p className="text-center py-8 text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Type to search builders</p>
                )}
            </div>
        </div>
    </BaseModal>
);

export const TransferModal = ({
    isOpen, onClose, targetMember, otp, onOtpChange, onTransfer, transferring
}: any) => (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Transfer Ownership" description="Passing the crown">
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0" />
                <p className="text-xs font-bold text-yellow-500/80 leading-relaxed uppercase tracking-widest">
                    This action is final. You will lose all ownership privileges.
                </p>
            </div>
            
            {targetMember && (
                <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <Avatar name={targetMember.user.name} image={targetMember.user.image} size="md" />
                    <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">New Owner Designate</p>
                        <p className="text-sm font-bold text-white">{targetMember.user.name}</p>
                    </div>
                    <Crown size={24} className="ml-auto text-yellow-500 opacity-20" />
                </div>
            )}

            <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                    <Key size={12} /> Verification Code (6-Digits)
                </label>
                <input 
                    type="text" value={otp} onChange={(e) => onOtpChange(e.target.value)}
                    maxLength={6} placeholder="000000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-5 text-center text-2xl font-black font-mono tracking-[0.5em] text-white focus:outline-none focus:border-yellow-500/40 transition-all font-medium"
                />
                <Button 
                    variant="primary" onClick={onTransfer} disabled={transferring || otp.length !== 6}
                    className="w-full py-4 text-sm !bg-yellow-500 !text-black shadow-[0_0_40px_rgba(234,179,8,0.1)]"
                >
                    {transferring ? "Transferring Authority..." : "Confirm Final Transfer"}
                </Button>
            </div>
        </div>
    </BaseModal>
);

export const BanModal = ({
    isOpen, onClose, action, reason, onReasonChange, timeoutHours, onTimeoutChange, onConfirm
}: any) => (
    <BaseModal isOpen={isOpen} onClose={onClose} title={action === "ban" ? "Execute Ban" : "Set Timeout"} description="Moderation Authority">
        <div className="space-y-6">
            <div className={`p-4 rounded-2xl flex items-center gap-4 ${action === "ban" ? "bg-red-500/5 border border-red-500/10" : "bg-orange-500/5 border border-orange-500/10"}`}>
                <Shield size={24} className={action === "ban" ? "text-red-500" : "text-orange-500"} />
                <p className={`text-[10px] font-black uppercase tracking-widest leading-relaxed ${action === "ban" ? "text-red-500/80" : "text-orange-500/80"}`}>
                    Maintaining community standards is vital for our growth.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Reason for Action</label>
                    <textarea 
                        value={reason} onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="Why is this action being taken?" rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none font-medium"
                    />
                </div>
                
                {action === "timeout" && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Duration (Hours)</label>
                        <input 
                            type="number" value={timeoutHours} onChange={(e) => onTimeoutChange(parseInt(e.target.value))}
                            min={1} max={168}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-zinc-700"
                        />
                    </div>
                )}

                <Button 
                    variant="primary" onClick={onConfirm}
                    className={`w-full py-4 text-sm font-black uppercase tracking-widest ${action === "ban" ? "!bg-red-600" : "!bg-orange-600"}`}
                >
                    {action === "ban" ? "Confirm Ban" : "Confirm Timeout"}
                </Button>
            </div>
        </div>
    </BaseModal>
);

export const DeleteModal = ({
    isOpen, onClose, otp, onOtpChange, onConfirm, deleting, otpSent, onSendOtp
}: any) => (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Dissolve Community" description="End of the journey">
        <div className="space-y-6">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4">
                <AlertTriangle size={32} className="text-red-500 flex-shrink-0" />
                <p className="text-[10px] font-black text-red-500/80 uppercase tracking-widest leading-relaxed">
                    This will schedule the club for permanent deletion. All data, messages, and membership will be lost.
                </p>
            </div>

            {!otpSent ? (
                <div className="space-y-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-center">Are you absolutely certain?</p>
                    <Button 
                        variant="primary" onClick={onSendOtp} 
                        className="w-full py-4 !bg-red-600 text-[10px] font-black uppercase tracking-widest"
                    >
                        Send Verification Code
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <Key size={12} /> Verification Code (6-Digits)
                    </label>
                    <input 
                        type="text" value={otp} onChange={(e) => onOtpChange(e.target.value)}
                        maxLength={6} placeholder="000000"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-5 text-center text-2xl font-black font-mono tracking-[0.5em] text-white focus:outline-none focus:border-red-500/40 transition-all"
                    />
                    <Button 
                        variant="primary" onClick={onConfirm} disabled={deleting || otp.length !== 6}
                        className="w-full py-4 !bg-red-600 !text-white text-sm font-black uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.2)]"
                    >
                        {deleting ? "Dissolving Tribe..." : "Confirm Permanent Deletion"}
                    </Button>
                </div>
            )}
        </div>
    </BaseModal>
);
