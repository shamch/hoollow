import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        const visitorId = session?.user?.id;

        // Fetch visitor's club IDs for membership check
        let visitorClubIds: string[] = [];
        if (visitorId) {
            const visitorMemberships = await prisma.clubMember.findMany({
                where: { userId: visitorId },
                select: { clubId: true }
            });
            visitorClubIds = visitorMemberships.map(m => m.clubId);
        }

        // First try with clubMembers (if schema has been pushed)
        let user: any;
        try {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { id: params.id },
                        { username: params.id }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    image: true,
                    role: true,
                    impactXP: true,
                    bio: true,
                    skills: true,
                    openToCollab: true,
                    createdAt: true,
                    posts: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        include: {
                            _count: { select: { upvotes: true, comments: true } },
                            author: { select: { id: true, name: true, username: true, image: true, role: true, impactXP: true } },
                        },
                    },
                    projects: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        include: {
                            author: { select: { id: true, name: true, username: true, image: true, role: true, impactXP: true } },
                        },
                    },
                    clubMembers: {
                        include: {
                            club: {
                                include: { _count: { select: { members: true } } },
                            },
                        },
                    },
                },
            });
        } catch {
            // Fallback without clubMembers if table doesn't exist yet
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { id: params.id },
                        { username: params.id }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    image: true,
                    role: true,
                    impactXP: true,
                    bio: true,
                    skills: true,
                    openToCollab: true,
                    createdAt: true,
                    posts: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        include: {
                            _count: { select: { upvotes: true, comments: true } },
                            author: { select: { id: true, name: true, username: true, image: true, role: true, impactXP: true } },
                        },
                    },
                    projects: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                        include: {
                            author: { select: { id: true, name: true, username: true, image: true, role: true, impactXP: true } },
                        },
                    },
                },
            });
            if (user) {
                user.clubMembers = [];
            }
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Privacy Filtering: Only show public clubs OR clubs where the visitor is a member/owner
        if (user.clubMembers && user.clubMembers.length > 0) {
            const isOwner = visitorId === user.id;
            user.clubMembers = user.clubMembers.filter((cm: any) => {
                const isPublic = cm.club.visibility === "public";
                const isMemberOfThisClub = visitorClubIds.includes(cm.club.id);
                return isPublic || isOwner || isMemberOfThisClub;
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("User profile fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
