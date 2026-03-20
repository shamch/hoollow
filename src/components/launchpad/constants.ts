export const categories = ["All", "SaaS", "Hardware", "Social", "EdTech", "AI/ML"];
export const sortOptions = ["Most Voted", "Newest", "ImpactXP Threshold"];

export interface ProjectAuthor {
    id: string;
    name: string;
    image: string;
    role: string;
    impactXP: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    tags: string[] | string;
    upvotes: number;
    xpThreshold: number;
    authorId: string;
    author: ProjectAuthor;
    expiresAt: string;
    createdAt: string;
    logo?: string;
    banner?: string;
    thumbnail?: string;
    imageUrl?: string;
    media?: { url: string; type: "image" | "video" }[];
    demoUrl?: string;
    githubUrl?: string;
    isOpenSource?: boolean;
    openToCollab?: boolean;
    rank?: number;
    rating?: number;
    reviewCount?: number;
    commentCount?: number;
}
