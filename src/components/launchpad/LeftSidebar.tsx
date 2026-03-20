"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    Rocket, 
    Users, 
    Zap, 
    Sparkles,
    Search, 
    MessageCircle,
    Bell,
    CheckCircle,
    ChevronRight,
    ArrowUpRight,
    SearchIcon
} from "lucide-react";
import { useSession } from "next-auth/react";
import Avatar from "../Avatar";
import ImpactXPBadge from "../ImpactXPBadge";

const navItems = [
    { icon: Home, label: "Feed", href: "/feed" },
    { icon: Rocket, label: "Launchpad", href: "/launchpad" },
    { icon: Users, label: "Clubs", href: "/clubs" },
    { icon: Zap, label: "Collab", href: "/collab" },
    { icon: Sparkles, label: "Super PRO", href: "/super", premium: true },
];

export default function LeftSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex flex-col min-h-full z-50 border-white/5">
            {/* Logo & Search */}
            <div className="p-6 space-y-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-black text-white tracking-tighter">Hoollow</span>
                </Link>

                <div className="relative group">
                    <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search build, builders..." 
                        className="w-full bg-[#111114] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.label} 
                            href={item.href}
                            className={`
                                flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group
                                ${isActive ? "bg-white/5 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} className={isActive ? "text-accent" : "text-zinc-500 group-hover:text-white"} />
                                <span className={`text-sm tracking-tight ${isActive ? "font-black" : "font-semibold"}`}>{item.label}</span>
                            </div>
                            {item.premium && (
                                <span className="text-[9px] font-black uppercase bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-md">
                                    PRO
                                </span>
                            )}
                        </Link>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
                    <Link href="/messages" className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <MessageCircle size={20} />
                        <span className="text-sm font-semibold tracking-tight">Messages</span>
                    </Link>
                    <Link href="/notifications" className="flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <div className="relative">
                            <Bell size={20} />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Notifications</span>
                    </Link>
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-4">
                {/* XP & Profile */}
                <div className="flex flex-col gap-4">
                    <div className="px-3">
                        <ImpactXPBadge score={session?.user?.impactXP || 0} size="sm" />
                    </div>
                    
                    <Link href={`/u/${session?.user?.username || session?.user?.id || 'me'}`} className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Avatar image={session?.user?.image} name={session?.user?.name} size="sm" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white leading-none mb-1">{session?.user?.name || "Guest"}</span>
                                <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">
                                    {session?.user?.username ? `@${session.user.username}` : "View Profile"}
                                </span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
