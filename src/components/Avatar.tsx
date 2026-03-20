import React from "react";
import { getInitials } from "@/lib/mockData";

interface AvatarProps {
    name: string;
    image?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeMap = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-24 h-24 text-2xl",
};

const colors = [
    "bg-blue-500/10 text-blue-400",
    "bg-premium-soft text-premium",
    "bg-green-500/10 text-green-400",
    "bg-orange-500/10 text-orange-400",
    "bg-red-500/10 text-red-400",
    "bg-surface-alt text-text-primary",
];

function getColor(name: string = "User"): string {
    const safeName = name || "User";
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
        hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name, image, size = "md", className = "" }: AvatarProps) {
    const safeName = name || "User";
    if (image) {
        return (
            <img
                src={image}
                alt={safeName}
                className={`${sizeMap[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`${sizeMap[size]} ${getColor(safeName)} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
        >
            {getInitials(safeName)}
        </div>
    );
}

interface AvatarStackProps {
    names: string[];
    images?: string[];
    max?: number;
    size?: "sm" | "md";
}

export function AvatarStack({ names, images, max = 5, size = "sm" }: AvatarStackProps) {
    const displayed = names.slice(0, max);
    const remaining = names.length - max;

    return (
        <div className="flex items-center">
            {displayed.map((name, i) => (
                <div key={i} className={`${i > 0 ? "-ml-2" : ""} ring-2 ring-white rounded-full`}>
                    <Avatar name={name} image={images?.[i]} size={size} />
                </div>
            ))}
            {remaining > 0 && (
                <div
                    className={`-ml-2 ${sizeMap[size]} bg-surface-alt text-text-secondary rounded-full flex items-center justify-center font-semibold ring-2 ring-white text-[10px]`}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}
