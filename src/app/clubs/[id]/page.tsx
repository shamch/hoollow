"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Users, Mail, Settings, Loader2, Hash, Volume2, Info, ChevronRight } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubChat from "@/components/clubs/ClubChat";
import ClubMembers from "@/components/clubs/ClubMembers";
import ClubSettings from "@/components/clubs/ClubSettings";
import { 
    InviteModal, 
    TransferModal, 
    BanModal, 
    DeleteModal 
} from "@/components/clubs/ClubModals";
import { ROLE_LEVEL } from "@/components/clubs/constants";
import Avatar from "@/components/Avatar";

export default function ClubDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const clubId = params.id as string;

    const [club, setClub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"chat" | "members" | "invitations" | "settings">("chat");

    // Chat state
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [activeChannel, setActiveChannel] = useState<"general" | "announcements">("general");
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Modals state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Transfer/Moderation state
    const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
    const [transferOtp, setTransferOtp] = useState("");
    const [transferring, setTransferring] = useState(false);
    const [banTargetId, setBanTargetId] = useState<string | null>(null);
    const [banAction, setBanAction] = useState<"ban" | "timeout">("ban");
    const [banReason, setBanReason] = useState("");
    const [timeoutHours, setTimeoutHours] = useState(1);
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

    // Settings / Edit state
    const [editState, setEditState] = useState({
        name: "",
        description: "",
        type: "open",
        domain: "Tech",
        banner: "",
        logo: "",
        themeColor: "#6366f1",
        vibe: "professional",
        permissions: null
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Invitations / Requests state
    const [inviteSearch, setInviteSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [inviting, setInviting] = useState(false);
    const [sentInvites, setSentInvites] = useState<any[]>([]);
    const [receivedInvites, setReceivedInvites] = useState<any[]>([]);
    const [joinRequests, setJoinRequests] = useState<any[]>([]);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [inviteCodes, setInviteCodes] = useState<any[]>([]);

    // Delete state
    const [deleteOtp, setDeleteOtp] = useState("");
    const [deleteOtpSent, setDeleteOtpSent] = useState(false);
    const [deletingClub, setDeletingClub] = useState(false);

    // ─── Data Fetching ───

    const fetchClub = useCallback(async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}`);
            if (res.ok) {
                const data = await res.json();
                setClub(data);
                setEditState({
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    domain: data.domain,
                    banner: data.banner || "",
                    logo: data.logo || "",
                    themeColor: data.themeColor || "#6366f1",
                    vibe: data.vibe || "professional",
                    permissions: data.permissions
                });
                
                const reqRes = await fetch(`/api/clubs/${clubId}/join-requests`);
                if (reqRes.ok) {
                    const requests = await reqRes.json();
                    setJoinRequests(requests);
                    setHasPendingRequest(requests.some((r: any) => r.userId === session?.user?.id && r.status === "pending"));
                }
            } else {
                router.push("/clubs");
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [clubId, router, session?.user?.id]);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/messages?channel=${activeChannel}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (e) { console.error(e); }
    }, [clubId, activeChannel]);

    const fetchInvitations = useCallback(async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/invitations`);
            if (res.ok) {
                const data = await res.json();
                setSentInvites(data.sent || []);
                setReceivedInvites(data.received || []);
            }
        } catch (e) { console.error(e); }
    }, [clubId]);

    const fetchInviteCodes = useCallback(async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/invite-codes`);
            if (res.ok) {
                const data = await res.json();
                setInviteCodes(data.codes || []);
            }
        } catch (e) { console.error(e); }
    }, [clubId]);

    useEffect(() => {
        fetchClub();
        fetchInvitations();
        fetchInviteCodes();
    }, [fetchClub, fetchInvitations, fetchInviteCodes]);

    useEffect(() => {
        if (club?.isMember) {
            fetchMessages();
            pollRef.current = setInterval(fetchMessages, 3000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [club?.isMember, fetchMessages]);

    // ─── Handlers ───

    const handleSendMessage = async () => {
        if (!messageText.trim() || sendingMessage) return;
        setSendingMessage(true);
        try {
            const res = await fetch(`/api/clubs/${clubId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: messageText, channel: activeChannel }),
            });
            if (res.ok) {
                setMessageText("");
                fetchMessages();
            }
        } catch (e) { console.error(e); }
        finally { setSendingMessage(false); }
    };

    const handleJoinLeave = async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/join`, { method: "POST" });
            if (res.ok) fetchClub();
        } catch (e) { console.error(e); }
    };

    const handleSearchUsers = async (query: string) => {
        setInviteSearch(query);
        if (query.length < 2) { setSearchResults([]); return; }
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            if (res.ok) setSearchResults(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleInviteUser = async (toUserId: string) => {
        setInviting(true);
        try {
            const res = await fetch(`/api/clubs/${clubId}/invitations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toUserId }),
            });
            if (res.ok) {
                fetchInvitations();
                setShowInviteModal(false);
                setInviteSearch("");
            }
        } catch (e) { console.error(e); }
        finally { setInviting(false); }
    };

    const handleMemberAction = async (action: string, memberId: string, data?: any) => {
        setActiveMemberId(null);
        try {
            if (action === "changeRole") {
                await fetch(`/api/clubs/${clubId}/members/${memberId}/role`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: data.newRole }),
                });
                fetchClub();
            } else if (action === "kick") {
                await fetch(`/api/clubs/${clubId}/members/${memberId}`, { method: "DELETE" });
                fetchClub();
            } else if (action === "transfer") {
                setTransferTargetId(memberId);
                setShowTransferModal(true);
            } else if (action === "ban") {
                setBanTargetId(memberId);
                setBanAction("ban");
                setShowBanModal(true);
            }
        } catch (e) { console.error(e); }
    };

    const handleConfirmTransfer = async () => {
        if (!transferTargetId || !transferOtp) return;
        setTransferring(true);
        try {
            const res = await fetch(`/api/clubs/${clubId}/transfer-ownership`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toMemberId: transferTargetId, otp: transferOtp }),
            });
            if (res.ok) {
                setShowTransferModal(false);
                setTransferOtp("");
                fetchClub();
            }
        } catch (e) { console.error(e); }
        finally { setTransferring(false); }
    };

    const handleConfirmBan = async () => {
        if (!banTargetId) return;
        try {
            await fetch(`/api/clubs/${clubId}/moderation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    targetMemberId: banTargetId, 
                    action: banAction, 
                    reason: banReason, 
                    hours: timeoutHours 
                }),
            });
            setShowBanModal(false);
            setBanReason("");
            fetchClub();
        } catch (e) { console.error(e); }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch(`/api/clubs/${clubId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editState.name,
                    description: editState.description,
                    type: editState.type,
                    domain: editState.domain,
                    themeColor: editState.themeColor,
                    vibe: editState.vibe,
                    banner: editState.banner,
                    logo: editState.logo,
                    permissions: editState.permissions
                }),
            });
            if (res.ok) fetchClub();
        } catch (e) { console.error(e); }
        finally { setSavingSettings(false); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
        const file = e.target.files?.[0];
        if (!file) return;
        const setUploading = type === "logo" ? setUploadingLogo : setUploadingBanner;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);
            const res = await fetch(`/api/clubs/${clubId}/upload`, { method: "POST", body: formData });
            if (res.ok) {
                const { url } = await res.json();
                setEditState(prev => ({ ...prev, [type]: url }));
            }
        } catch (e) { console.error(e); }
        finally { setUploading(false); }
    };

    const handlePermissionChange = (role: string, perm: string, value: boolean) => {
        const newPerms = JSON.parse(JSON.stringify(editState.permissions || club.permissions || {}));
        if (!newPerms[role]) newPerms[role] = {};
        newPerms[role][perm] = value;
        setEditState(prev => ({ ...prev, permissions: newPerms }));
    };

    const handleRegenerateMainCode = async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/invite-codes`, { method: "PATCH" });
            if (res.ok) fetchClub();
        } catch (e) { console.error(e); }
    };

    const handleGenerateInviteCode = async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/invite-codes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: "Special Invite", maxUses: 0 }),
            });
            if (res.ok) fetchInviteCodes();
        } catch (e) { console.error(e); }
    };

    const handleRevokeCode = async (id: string) => {
        try {
            await fetch(`/api/clubs/${clubId}/invite-codes?codeId=${id}`, { method: "DELETE" });
            fetchInviteCodes();
        } catch (e) { console.error(e); }
    };

    const handleSendDeleteOtp = async () => {
        try {
            const res = await fetch(`/api/clubs/${clubId}/delete`, { method: "POST" });
            if (res.ok) setDeleteOtpSent(true);
        } catch (e) { console.error(e); }
    };

    const handleConfirmDelete = async () => {
        if (!deleteOtp) return;
        setDeletingClub(true);
        try {
            const res = await fetch(`/api/clubs/${clubId}/delete`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp: deleteOtp }),
            });
            if (res.ok) {
                setShowDeleteModal(false);
                fetchClub();
            }
        } catch (e) { console.error(e); }
        finally { setDeletingClub(false); }
    };

    useEffect(() => {
        (window as any).triggerDeleteModal = () => setShowDeleteModal(true);
        return () => { delete (window as any).triggerDeleteModal; };
    }, []);

    // ─── Render Components for Sidebar ───

    if (loading) {
        return (
            <div className="h-screen bg-[#0c0c0e] flex items-center justify-center">
                <Loader2 size={40} className="text-accent animate-spin" />
            </div>
        );
    }

    if (!club) return null;

    const myRole = club.currentUserRole;
    const myLevel = myRole ? ROLE_LEVEL[myRole] || 0 : 0;
    const isOwner = myRole === "owner";
    const canManageMembers = myLevel >= 2;
    const canEditSettings = myLevel >= 3;

    const ClubSidebarContent = (
        <aside className="p-8 space-y-10">
            {/* Club Context / Channels */}
            {club.isMember && (
                <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                    <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                        <MessageCircle size={14} className="text-accent" /> Control Center
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => { setActiveTab("chat"); setActiveChannel("general"); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === "chat" && activeChannel === "general"
                                    ? "bg-white text-black shadow-xl"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Hash size={14} /> General
                        </button>
                        <button
                            onClick={() => { setActiveTab("chat"); setActiveChannel("announcements"); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === "chat" && activeChannel === "announcements"
                                    ? "bg-white text-black shadow-xl"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Volume2 size={14} /> Announcements
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 space-y-2">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeTab === "members"
                                    ? "bg-white text-black shadow-xl"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Users size={14} /> Members ({club.memberCount})
                        </button>
                        {canEditSettings && (
                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === "settings"
                                        ? "bg-white text-black shadow-xl"
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Settings size={14} /> Settings
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* About / Stats */}
            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} className="text-accent" /> Intelligence
                </h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Domain</p>
                        <p className="text-xs font-black text-white italic uppercase">{club.domain}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Vibe</p>
                        <p className="text-xs font-black text-white italic uppercase">{club.vibe}</p>
                    </div>
                    {club.impactXP !== undefined && (
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">ImpactXP</p>
                            <p className="text-2xl font-black text-accent italic">{club.impactXP}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Members Preview */}
            <div className="bg-[#0A0A0B] border border-white/5 rounded-[32px] p-6">
                <h3 className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-accent" /> Tribe
                </h3>
                <div className="flex -space-x-2">
                    {club.members?.slice(0, 5).map((m: any) => (
                        <Avatar key={m.id} name={m.user.name} image={m.user.image} size="sm" className="ring-2 ring-[#0A0A0B]" />
                    ))}
                    {club.memberCount > 5 && (
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-500">
                            +{club.memberCount - 5}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    return (
        <AppLayout rightSidebar={ClubSidebarContent}>
            <div className="flex flex-col h-full bg-[#0c0c0e]">
                <ClubHeader 
                    club={club}
                    isMember={club.isMember}
                    hasPendingRequest={hasPendingRequest}
                    onJoinLeave={handleJoinLeave}
                />
                
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab + activeChannel}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            {club.isMember ? (
                                <>
                                    {activeTab === "chat" && (
                                        <ClubChat 
                                            messages={messages}
                                            messageText={messageText}
                                            onMessageChange={setMessageText}
                                            onSendMessage={handleSendMessage}
                                            sending={sendingMessage}
                                            channel={activeChannel}
                                            currentUserId={session?.user?.id}
                                        />
                                    )}

                                    {activeTab === "members" && (
                                        <div className="p-8 overflow-y-auto custom-scrollbar">
                                            <ClubMembers 
                                                members={club.members}
                                                myRole={myRole}
                                                myLevel={myLevel}
                                                canManageMembers={canManageMembers}
                                                activeMemberId={activeMemberId}
                                                setActiveMemberId={setActiveMemberId}
                                                currentUserId={session?.user?.id}
                                                onAction={handleMemberAction}
                                            />
                                        </div>
                                    )}

                                    {activeTab === "settings" && (
                                        <div className="p-8 overflow-y-auto custom-scrollbar">
                                            <ClubSettings 
                                                club={{ ...club, inviteCodes }}
                                                editState={editState}
                                                setEditState={setEditState}
                                                saving={savingSettings}
                                                onSave={handleSaveSettings}
                                                onImageUpload={handleImageUpload}
                                                onRegenerateCode={handleRegenerateMainCode}
                                                onGenerateNewCode={handleGenerateInviteCode}
                                                onRevokeCode={handleRevokeCode}
                                                onPermissionChange={handlePermissionChange}
                                                isOwner={isOwner}
                                                uploadingLogo={uploadingLogo}
                                                uploadingBanner={uploadingBanner}
                                                logoInputRef={logoInputRef}
                                                bannerInputRef={bannerInputRef}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="max-w-xl mx-auto px-6 py-32 text-center space-y-10">
                                    <div className="w-24 h-24 mx-auto rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center text-zinc-800 shadow-2xl">
                                        <Users size={48} />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Transmission Blocked</h2>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-sm mx-auto leading-loose">
                                            You must interface with this community to access the secure communication hub and biological data streams.
                                        </p>
                                    </div>
                                    <div className="pt-8">
                                        <button 
                                            onClick={handleJoinLeave}
                                            className="px-12 py-5 bg-white text-black text-[12px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl"
                                        >
                                            {club.type === "open" ? "Authorize Entry" : "Request Authorization"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Modals */}
            <InviteModal 
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                search={inviteSearch}
                onSearch={handleSearchUsers}
                results={searchResults}
                onInvite={handleInviteUser}
                inviting={inviting}
            />
            
            <TransferModal 
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                targetMember={club?.members.find((m: any) => m.id === transferTargetId)}
                otp={transferOtp}
                onOtpChange={setTransferOtp}
                onTransfer={handleConfirmTransfer}
                transferring={transferring}
            />

            <BanModal 
                isOpen={showBanModal}
                onClose={() => setShowBanModal(false)}
                action={banAction}
                reason={banReason}
                onReasonChange={setBanReason}
                timeoutHours={timeoutHours}
                onTimeoutChange={setTimeoutHours}
                onConfirm={handleConfirmBan}
            />

            <DeleteModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                otp={deleteOtp}
                onOtpChange={setDeleteOtp}
                onConfirm={handleConfirmDelete}
                deleting={deletingClub}
                otpSent={deleteOtpSent}
                onSendOtp={handleSendDeleteOtp}
            />
        </AppLayout>
    );
}
