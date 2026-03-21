"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Github,
    ExternalLink,
    Edit3,
    Trash2,
    MoreHorizontal,
    Users,
    X,
    Check,
    Image as ImageIcon,
} from "lucide-react";
import Avatar from "./Avatar";
import ImpactXPBadge from "./ImpactXPBadge";
import UpvoteButton from "./UpvoteButton";
import Button from "./Button";
import { Project as ProjectData } from "./launchpad/constants";
import { useSession } from "next-auth/react";
import ProjectDetailModal from "./launchpad/ProjectDetailModal";

interface ProjectCardProps {
    project: ProjectData;
    onUpvote?: () => void;
    onUpdated?: () => void;
}

export default function ProjectCard({ project, onUpvote, onUpdated }: ProjectCardProps) {
    const { data: session } = useSession();
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const isOwner = session?.user?.id === project.authorId;

    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [collabMessage, setCollabMessage] = useState("");
    const [collabSent, setCollabSent] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    // Edit state
    const [editName, setEditName] = useState(project.name);
    const [editDesc, setEditDesc] = useState(project.description);
    const [editTags, setEditTags] = useState(tags.join(", "));
    const [editGithub, setEditGithub] = useState(project.githubUrl || "");
    const [editImage, setEditImage] = useState(project.imageUrl || "");
    const [editCollab, setEditCollab] = useState(project.openToCollab || false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleEdit = () => {
        setEditName(project.name);
        setEditDesc(project.description);
        setEditTags(tags.join(", "));
        setEditGithub(project.githubUrl || "");
        setEditImage(project.imageUrl || "");
        setEditCollab(project.openToCollab || false);
        setShowEditModal(true);
        setShowMenu(false);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/projects", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: project.id,
                    name: editName,
                    description: editDesc,
                    tags: editTags ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
                    githubUrl: editGithub || null,
                    imageUrl: editImage || null,
                    openToCollab: editCollab,
                }),
            });
            if (res.ok) { setShowEditModal(false); onUpdated?.(); }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects?id=${project.id}`, { method: "DELETE" });
            if (res.ok) { setShowDeleteConfirm(false); onUpdated?.(); }
        } catch (e) { console.error(e); }
        finally { setDeleting(false); }
    };

    const handleCollabRequest = async () => {
        try {
            const res = await fetch("/api/collab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project.id,
                    toUserId: project.authorId,
                    message: collabMessage,
                }),
            });
            if (res.ok) {
                setCollabSent(true);
                setTimeout(() => { setShowCollabModal(false); setCollabSent(false); setCollabMessage(""); }, 1500);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <motion.div
                layout
                whileHover={{ y: -4 }}
                onClick={() => setShowDetail(true)}
                className="group relative bg-[#111114]/50 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden hover:border-accent/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] cursor-pointer"
            >
                {/* Image Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-0 pointer-events-none" />

                {/* Main Content */}
                <div className="relative z-10 p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <Avatar name={project.author?.name || "User"} image={project.author?.image} size="md" />
                            {project.openToCollab && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111114] shadow-sm" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-white tracking-tight truncate group-hover:text-accent transition-colors">
                                {project.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                                    {project.author?.name || "User"}
                                </span>
                                {project.openToCollab && (
                                    <span className="text-[9px] font-black uppercase tracking-tighter bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                                        Open to Collab
                                    </span>
                                )}
                            </div>
                        </div>
                        {isOwner && (
                            <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
                                    className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                                <AnimatePresence>
                                    {showMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }} 
                                            className="absolute right-0 top-12 w-44 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl py-2 z-20 backdrop-blur-xl"
                                        >
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                                                <Edit3 size={14} /> Edit Project
                                            </button>
                                            <div className="h-px bg-white/5 my-1" />
                                            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Image */}
                    {(project.imageUrl || project.thumbnail) && (
                        <div className="mb-5 rounded-[24px] overflow-hidden aspect-[16/10] relative border border-white/5 shadow-inner">
                            <img 
                                src={project.imageUrl || project.thumbnail || ""} 
                                alt="" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                onError={(e) => { (e.target as HTMLImageElement).parentElement?.remove(); }} 
                            />
                        </div>
                    )}

                    <p className="text-sm text-zinc-400 leading-relaxed mb-6 line-clamp-3">
                        {project.description}
                    </p>

                    {/* GitHub Link */}
                    {project.githubUrl && (
                        <a 
                            href={project.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-3 mb-6 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/20 transition-all group/gh"
                        >
                            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white">
                                <Github size={16} />
                            </div>
                            <span className="font-bold text-xs text-zinc-300 flex-1 truncate">{project.githubUrl.split("/").slice(-2).join("/")}</span>
                            <ExternalLink size={14} className="text-zinc-600 group-hover/gh:text-white transition-colors" />
                        </a>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between mt-auto">
                        <div onClick={(e) => e.stopPropagation()}>
                            <UpvoteButton 
                                count={project.upvotes} 
                                voted={false} 
                                onUpvote={onUpvote} 
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {tags.length > 0 && (
                                <div className="hidden sm:flex gap-1.5">
                                    {tags.slice(0, 1).map((tag: string) => (
                                        <span key={tag} className="text-[10px] font-black uppercase tracking-tighter text-zinc-500 px-2 py-0.5 rounded-full border border-white/5">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {project.xpThreshold > 0 && (
                                <div className="opacity-80 scale-90">
                                    <ImpactXPBadge score={project.xpThreshold} size="sm" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-surface rounded-card p-6 max-w-lg w-full shadow-modal relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary"><X size={20} /></button>
                            <h2 className="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-2"><Edit3 size={18} /> Edit Project</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-small font-medium text-text-primary block mb-1.5">Name</label>
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-input text-body text-text-primary focus:outline-none focus:border-accent transition-all" />
                                </div>
                                <div>
                                    <label className="text-small font-medium text-text-primary block mb-1.5">Description</label>
                                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="w-full px-4 py-3 bg-surface border border-border rounded-input text-body text-text-primary focus:outline-none focus:border-accent transition-all resize-none" />
                                </div>
                                <div>
                                    <label className="text-small font-medium text-text-primary block mb-1.5">Tags <span className="text-text-muted">(comma separated)</span></label>
                                    <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-input text-body text-text-primary focus:outline-none focus:border-accent transition-all" />
                                </div>
                                <div>
                                    <label className="text-small font-medium text-text-primary block mb-1.5 flex items-center gap-2"><Github size={14} /> GitHub URL</label>
                                    <input type="url" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="https://github.com/..." className="w-full px-4 py-3 bg-surface border border-border rounded-input text-body text-text-primary focus:outline-none focus:border-accent transition-all" />
                                </div>
                                <div>
                                    <label className="text-small font-medium text-text-primary block mb-1.5 flex items-center gap-2"><ImageIcon size={14} /> Image URL</label>
                                    <input type="url" value={editImage} onChange={(e) => setEditImage(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-surface border border-border rounded-input text-body text-text-primary focus:outline-none focus:border-accent transition-all" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-surface-alt rounded-card">
                                    <div>
                                        <p className="text-small font-medium text-text-primary">Open to Collaborate</p>
                                        <p className="text-label text-text-muted">Let others request to join</p>
                                    </div>
                                    <button type="button" onClick={() => setEditCollab(!editCollab)} className={`w-12 h-6 rounded-full relative transition-colors ${editCollab ? "bg-accent" : "bg-surface-alt"}`}>
                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-text-primary shadow transition-transform ${editCollab ? "translate-x-6" : "translate-x-0.5"}`} />
                                    </button>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleSaveEdit} disabled={saving || !editName || !editDesc}>{saving ? "Saving..." : "Save"}</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-surface rounded-card p-6 max-w-sm w-full shadow-modal text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={24} className="text-red-500" /></div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete this project?</h3>
                            <p className="text-small text-text-muted mb-6">This cannot be undone.</p>
                            <div className="flex justify-center gap-3">
                                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                <button onClick={handleDelete} disabled={deleting} className={`px-4 py-2 bg-red-500 text-white rounded-btn font-medium text-small hover:bg-red-600 transition-colors ${deleting ? "opacity-50" : ""}`}>{deleting ? "Deleting..." : "Delete"}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collab Modal */}
            <AnimatePresence>
                {showCollabModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCollabModal(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-surface rounded-card p-6 max-w-md w-full shadow-modal" onClick={(e) => e.stopPropagation()}>
                            {collabSent ? (
                                <div className="text-center py-8">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"><Check size={32} className="text-green-600" /></div>
                                    </motion.div>
                                    <h3 className="text-lg font-semibold text-text-primary">Request Sent!</h3>
                                </div>
                            ) : (
                                <>
                                    <h2 className="font-display text-xl font-semibold text-text-primary mb-2 flex items-center gap-2"><Users size={18} /> Collaborate</h2>
                                    <p className="text-small text-text-muted mb-4">Request to collaborate on &quot;{project.name}&quot;</p>
                                    <textarea value={collabMessage} onChange={(e) => setCollabMessage(e.target.value)} placeholder="I'd love to work on this..." rows={3} className="w-full px-4 py-3 bg-surface border border-border rounded-input text-body text-text-primary focus:outline-none focus:border-accent transition-all resize-none mb-4" />
                                    <div className="flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setShowCollabModal(false)}>Cancel</Button>
                                        <Button variant="primary" onClick={handleCollabRequest}>Send Request</Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Project Detail Modal */}
            <ProjectDetailModal 
                project={project}
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                onUpdate={onUpdated}
            />
        </>
    );
}
