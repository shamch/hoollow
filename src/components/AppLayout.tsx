"use client";

import React from "react";
import LeftSidebar from "./launchpad/LeftSidebar";

interface AppLayoutProps {
    children: React.ReactNode;
    rightSidebar?: React.ReactNode;
    className?: string;
}

export default function AppLayout({ children, rightSidebar, className }: AppLayoutProps) {
    return (
        <div className={`flex justify-center min-h-screen text-white font-ui selection:bg-accent selection:text-black ${className || "bg-black"}`}>
            <div className="w-full max-w-[1440px] flex relative">
                {/* Left Column - Fixed Navigation */}
                <div className="hidden md:block w-[280px] flex-shrink-0 border-r border-white/5 bg-[#000000]">
                    <div className="sticky top-0 h-screen overflow-y-auto custom-scrollbar">
                        <LeftSidebar />
                    </div>
                </div>

                {/* Center Column - Main Content */}
                <main className="flex-1 min-w-0 min-h-screen pb-20 md:pb-0 bg-[#080809]">
                    {children}
                </main>

                {/* Right Column - Contextual Sidebar */}
                <aside className="w-[380px] hidden xl:block flex-shrink-0 border-l border-white/5 bg-[#000000] sticky top-0 h-screen overflow-y-auto custom-scrollbar">
                    {rightSidebar || (
                        <div className="p-6">
                            <div className="space-y-6">
                                <div className="h-32 rounded-2xl bg-zinc-900 animate-pulse" />
                                <div className="h-64 rounded-2xl bg-zinc-900 animate-pulse" />
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Mobile Bottom Navigation (Optional fallback for small screens) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/5 z-[100] px-6 py-2 flex items-center justify-between">
                {/* Minimal mobile nav items could go here if needed */}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
