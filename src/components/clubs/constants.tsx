import React from "react";
import { Crown, Shield, Star, User } from "lucide-react";

export const ROLE_ICON: Record<string, React.ReactNode> = {
    owner: <Crown size={12} className="text-yellow-500" />,
    coowner: <Shield size={12} className="text-purple-500" />,
    moderator: <Star size={12} className="text-blue-500" />,
    member: <User size={12} className="text-zinc-500" />,
};

export const ROLE_LABEL: Record<string, string> = {
    owner: "Owner",
    coowner: "Co-Owner",
    moderator: "Moderator",
    member: "Member",
};

export const ROLE_LEVEL: Record<string, number> = { 
    owner: 4, 
    coowner: 3, 
    moderator: 2, 
    member: 1 
};

export const ROLE_COLORS: Record<string, string> = {
    owner: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    coowner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    moderator: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    member: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};
