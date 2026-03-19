"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Users, Mail, Settings, Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubSidebar from "@/components/clubs/ClubSidebar";
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
                
                // Check for pending join request
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
                fetchClub(); // Will show scheduled deletion status
            }
        } catch (e) { console.error(e); }
        finally { setDeletingClub(false); }
    };

    // Expose delete modal trigger to window for the settings component
    useEffect(() => {
        (window as any).triggerDeleteModal = () => setShowDeleteModal(true);
        return () => { delete (window as any).triggerDeleteModal; };
    }, []);

    // ─── Render ───

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 size={40} className="text-accent" />
                </motion.div>
            </div>
        );
    }

    if (!club) return null;

    const myRole = club.currentUserRole;
    const myLevel = myRole ? ROLE_LEVEL[myRole] || 0 : 0;
    const isOwner = myRole === "owner";
    const canManageMembers = myLevel >= 2; // Moderator+
    const canEditSettings = myLevel >= 3; // Co-owner+

    const tabs = [
        { key: "chat", label: "Hub", icon: <MessageCircle size={16} />, count: club.messageCount },
        { key: "members", label: "Tribe", icon: <Users size={16} />, count: club.memberCount },
        ...(canManageMembers ? [{ key: "invitations", label: "Recruits", icon: <Mail size={16} />, count: receivedInvites.length }] : []),
        ...(canEditSettings ? [{ key: "settings", label: "Engine", icon: <Settings size={16} /> }] : []),
    ];

    return (
        <div className="h-screen bg-[#0c0c0e] flex flex-col overflow-hidden">
            <Navbar />
            
            <div className="flex-1 flex overflow-hidden">
                {club.isMember ? (
                    <>
                        <ClubSidebar 
                            club={{ ...club, tabs }}
                            activeTab={activeTab}
                            onTabChange={(t) => setActiveTab(t)}
                            activeChannel={activeChannel}
                            onChannelChange={(c) => setActiveChannel(c)}
                            myRole={myRole}
                        />

                        <main className="flex-1 flex flex-col overflow-hidden relative">
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
                            )}

                            {activeTab === "settings" && (
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
                            )}
                            
                            {/* Visual background element */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        </main>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <ClubHeader 
                            club={club}
                            isMember={false}
                            hasPendingRequest={hasPendingRequest}
                            onJoinLeave={handleJoinLeave}
                        />
                        
                        <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
                            <div className="w-24 h-24 mx-auto rounded-[40px] bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700 shadow-2xl">
                                <Users size={48} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white tracking-tight">Access Restricted</h2>
                                <p className="text-zinc-500 max-w-lg mx-auto font-medium leading-relaxed">
                                    Join this community to access the secure communication hub, collaborate with builders, and participate in exclusive events.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Button 
                                    variant="primary" 
                                    onClick={handleJoinLeave}
                                    className="px-12 py-5 rounded-full text-lg shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]"
                                >
                                    {club.type === "open" ? "Entry Granted - Join Now" : "Request Community Access"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
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
        </div>
    );
}
