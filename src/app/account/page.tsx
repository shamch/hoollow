"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Link from "next/link";
import {
    User,
    Award,
    Settings,
    Shield,
    Trash2,
    AlertTriangle,
    Loader2,
    Check,
    Plus,
    X,
    ChevronRight,
    Camera,
    TrendingUp,
    History,
    Lock,
} from "lucide-react";
import { xpHistory } from "@/lib/mockData";

const skillOptions = [
    "React", "Next.js", "TypeScript", "Python", "Node.js", "Flutter",
    "Figma", "UI/UX", "Product Design", "Go-to-Market", "Machine Learning",
    "Data Science", "DevOps", "Blockchain", "IoT", "3D Printing",
    "Content Writing", "Marketing", "Fundraising", "Leadership",
];

export default function AccountPage() {
    const { data: session, update } = useSession();
    const [activeSection, setActiveSection] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile State
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [openToCollab, setOpenToCollab] = useState(true);

    // Security State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [realXPHistory, setRealXPHistory] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setImage(session.user.image || "");
            // Bio and skills might need to be fetched from the profile API if they're not in the session
            const fetchProfile = async () => {
                try {
                    const res = await fetch(`/api/users/${session.user.username || session.user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBio(data.bio || "");
                        setSkills(Array.isArray(data.skills) ? data.skills : []);
                        setOpenToCollab(data.openToCollab ?? true);
                    }
                } catch (e) {
                    console.error("Failed to fetch profile info", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();

            const fetchXPHistory = async () => {
                try {
                    const res = await fetch("/api/profile/xp-history");
                    if (res.ok) {
                        const data = await res.json();
                        setRealXPHistory(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch XP history", e);
                }
            };
            fetchXPHistory();
        } else if (session === null) {
            setLoading(false);
        }
    }, [session]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
            alert("Please upload only PNG, JPEG or JPG images.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setImage(data.secure_url);
            } else {
                alert("Photo upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during upload. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: name,
                    username: session?.user?.username,
                    bio,
                    skills,
                    role: session?.user?.role || "builder",
                    openToCollab,
                    image,
                }),
            });
            if (res.ok) {
                await update();
                alert("Settings saved successfully!");
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Save failed.");
            }
        } catch (e) {
            console.error("Failed to save settings", e);
            alert("An error occurred. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            const res = await fetch("/api/profile/otp", { method: "POST" });
            if (res.ok) {
                alert("A password reset link has been sent to your email.");
            } else {
                alert("Failed to send reset link.");
            }
        } catch (error) {
            console.error("Change password error:", error);
        }
    };

    const handleSendOTP = async () => {
        setSendingOtp(true);
        try {
            const res = await fetch("/api/profile/otp", { method: "POST" });
            if (res.ok) {
                setOtpSent(true);
                alert("Verification code sent to your email.");
            } else {
                alert("Failed to send verification code.");
            }
        } catch (error) {
            console.error("OTP error:", error);
        } finally {
            setSendingOtp(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        if (!otpSent) {
            await handleSendOTP();
            return;
        }

        if (!otp || otp.length !== 6) {
            alert("Please enter the 6-digit code.");
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch("/api/profile", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp })
            });
            if (res.ok) {
                await update();
                alert("Account deletion scheduled for 30 days.");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to schedule deletion");
            }
        } catch (e) {
            console.error("Deletion error:", e);
        } finally {
            setDeleting(false);
        }
    };

    const toggleSkill = (skill: string) => {
        setSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const menuItems = [
        { id: "profile", label: "Profile", icon: <User size={18} /> },
        { id: "skills", label: "Skills", icon: <Award size={18} /> },
        { id: "preferences", label: "Preferences", icon: <Settings size={18} /> },
        { id: "impactxp", label: "ImpactXP", icon: <TrendingUp size={18} /> },
        { id: "security", label: "Security & Privacy", icon: <Shield size={18} /> },
        { id: "danger", label: "Danger Zone", icon: <Trash2 size={18} /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-accent" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-zinc-400 mb-6">Please sign in to view your account center.</p>
                    <Link href="/">
                        <Button variant="primary">Go Home</Button>
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <Navbar />
            
            <main className="flex-1 max-w-content mx-auto w-full px-6 py-12 md:py-20">
                <div className="flex flex-col md:flex-row gap-12">
                    {/* Navigation Sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <h1 className="text-2xl font-display font-bold text-white mb-8">Account Center</h1>
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-card transition-all duration-200 ${
                                        activeSection === item.id
                                            ? "bg-zinc-800 text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="font-medium text-small">{item.label}</span>
                                    </span>
                                    {activeSection === item.id && (
                                        <motion.div layoutId="active-nav">
                                            <ChevronRight size={16} />
                                        </motion.div>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 max-w-2xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-10"
                            >
                                {activeSection === "profile" && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Profile Information</h2>
                                            <p className="text-zinc-400 text-small">Update your public profile details</p>
                                        </div>

                                        <div className="flex flex-col items-center gap-6 py-4">
                                            <div className="relative group">
                                                <Avatar name={name} image={image} size="xl" className="ring-4 ring-zinc-800" />
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-0 right-0 p-2 bg-accent text-accent-inverse rounded-full shadow-lg hover:scale-110 transition-transform"
                                                    disabled={uploading}
                                                >
                                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    accept="image/png, image/jpeg, image/jpg"
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="text-[10px] text-zinc-500">Only PNG, JPEG or JPG (max 5MB)</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-small font-medium text-white block mb-2">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600"
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-small font-medium text-white">Bio</label>
                                                    <span className="text-[10px] text-zinc-500">{bio.length}/140</span>
                                                </div>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value.slice(0, 140))}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600 resize-none overflow-hidden"
                                                    placeholder="Tell the world what you're building..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === "skills" && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Your Skills</h2>
                                            <p className="text-zinc-400 text-small">Select the technologies and domains you specialize in</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {skillOptions.map((skill) => (
                                                <button
                                                    key={skill}
                                                    onClick={() => toggleSkill(skill)}
                                                    className={`px-4 py-2 rounded-full text-small font-medium transition-all ${
                                                        skills.includes(skill)
                                                            ? "bg-white text-black"
                                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                                    }`}
                                                >
                                                    {skills.includes(skill) && <Check size={14} className="inline mr-1.5" />}
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "preferences" && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Preferences</h2>
                                            <p className="text-zinc-400 text-small">Manage how you interact with others on the platform</p>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-black border border-zinc-800 rounded-2xl">
                                            <div>
                                                <p className="font-semibold text-white">Open to Collaborate</p>
                                                <p className="text-small text-zinc-400">Let other builders send you collaboration requests</p>
                                            </div>
                                            <button
                                                onClick={() => setOpenToCollab(!openToCollab)}
                                                className={`w-12 h-7 rounded-full relative transition-colors ${openToCollab ? "bg-success" : "bg-zinc-700"}`}
                                            >
                                                <motion.div
                                                    animate={{ x: openToCollab ? 22 : 2 }}
                                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSection === "impactxp" && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">ImpactXP History</h2>
                                            <p className="text-zinc-400 text-small">Track your growth and contributions</p>
                                        </div>

                                        <div className="space-y-4">
                                            {realXPHistory.length > 0 ? (
                                                realXPHistory.map((entry, index) => (
                                                    <div key={index} className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                                                <History size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">{entry.reason}</p>
                                                                <p className="text-[10px] text-zinc-500">
                                                                    {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-accent">+{entry.amount} XP</p>
                                                            <p className="text-[10px] text-zinc-500">Recorded</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <History size={24} className="text-zinc-600" />
                                                    </div>
                                                    <p className="text-zinc-500 text-small">No XP history found yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "security" && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Security & Privacy</h2>
                                            <p className="text-zinc-400 text-small">Manage your account security and data</p>
                                        </div>

                                        <div className="p-6 bg-black border border-zinc-800 rounded-2xl">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400">
                                                        <Lock size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">Change Password</p>
                                                        <p className="text-small text-zinc-400">Request a password reset link via email</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={handleChangePassword}>
                                                    Send Email
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === "danger" && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-1">Danger Zone</h2>
                                            <p className="text-zinc-400 text-small">High-impact actions that cannot be undone</p>
                                        </div>

                                        <div className="p-6 bg-red-900/10 border border-red-900/20 rounded-2xl">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                                                    <AlertTriangle size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-red-500">Delete Account</h3>
                                                    <p className="text-small text-red-400/80">Deleting your account is permanent. It will be scheduled for 30 days during which you can cancel it.</p>
                                                </div>
                                            </div>

                                            {showDeleteConfirm && otpSent && (
                                                <div className="mb-6 space-y-3">
                                                    <p className="text-label font-medium text-zinc-300">Enter Verification Code:</p>
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-black border border-red-900/30 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[10px] text-white focus:outline-none focus:border-red-500 transition-all"
                                                        placeholder="000000"
                                                    />
                                                    <button 
                                                        onClick={handleSendOTP}
                                                        className="text-[10px] text-red-500 hover:text-red-400 font-medium"
                                                    >
                                                        Resend Code
                                                    </button>
                                                </div>
                                            )}

                                            <Button
                                                variant={showDeleteConfirm ? "primary" : "ghost"}
                                                onClick={handleDelete}
                                                className={`w-full justify-center py-4 ${showDeleteConfirm ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-500 hover:bg-red-500/10 border-red-500/20"}`}
                                                disabled={deleting || sendingOtp}
                                            >
                                                {deleting ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : showDeleteConfirm ? (
                                                    otpSent ? "Schedule Deletion" : "Send Verification Code"
                                                ) : (
                                                    <>
                                                        <Trash2 size={18} className="mr-2" /> Delete Account
                                                    </>
                                                )}
                                            </Button>

                                            {showDeleteConfirm && (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="w-full text-center text-label text-zinc-500 mt-4 hover:text-white"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-10 border-t border-zinc-800 mt-10">
                                    <Button
                                        variant="primary"
                                        onClick={handleSave}
                                        className="h-12 px-10 rounded-full font-bold"
                                        disabled={saving || uploading || !name}
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Saving...</span>
                                        ) : "Save Changes"}
                                    </Button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
