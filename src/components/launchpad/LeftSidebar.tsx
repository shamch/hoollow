"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    Home, 
    Rocket, 
    FileText, 
    Briefcase, 
    Inbox, 
    Search, 
    Megaphone,
    CheckCircle,
    ChevronRight,
    ArrowUpRight
} from "lucide-react";
import { useSession } from "next-auth/react";
import Avatar from "../Avatar";

const navItems = [
    { icon: Home, label: "Scroll", href: "/feed" },
    { icon: Rocket, label: "Launchpad", href: "/launchpad" },
    { icon: FileText, label: "Articles", href: "/articles" },
    { icon: Briefcase, label: "Jobs", href: "/jobs" },
    { icon: Inbox, label: "Inbox", href: "/inbox" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Megaphone, label: "Advertise", href: "/advertise", badge: "New" },
];

export default function LeftSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 h-screen sticky top-0 border-r border-white/5 flex flex-col bg-[#000000] z-50">
            {/* Logo */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-black text-black">
                        H
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter">Hoollow</span>
                </Link>
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
                                <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="text-[10px] font-black uppercase bg-white text-black px-1.5 py-0.5 rounded-md">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-4">
                {/* Verify Card */}
                <div className="bg-[#111114] rounded-2xl p-4 border border-white/5 relative overflow-hidden group transition-all hover:border-accent/30">
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                            <CheckCircle size={20} className="text-accent" />
                        </div>
                        <h4 className="text-sm font-black text-white mb-1">Verify Identity!</h4>
                        <p className="text-[11px] text-zinc-500 mb-3 font-medium">Get verified on Hoollow to boost your search ranking.</p>
                        <button className="w-full py-2 bg-white text-black text-xs font-black rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                            Get Verified <ArrowUpRight size={14} />
                        </button>
                    </div>
                    {/* Decorative abstract shape */}
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-accent/10 blur-2xl rounded-full" />
                </div>

                {/* Profile */}
                <Link href={`/u/${session?.user?.username || session?.user?.id || 'me'}`} className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                        <Avatar image={session?.user?.image} name={session?.user?.name} size="sm" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none mb-1">{session?.user?.name || "Guest"}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">
                                {session?.user?.followers || 0} followers • {session?.user?.following || 0} following
                            </span>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                </Link>
            </div>
        </aside>
    );
}
