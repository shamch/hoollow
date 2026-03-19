import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        const clubs = await prisma.club.findMany({
            where: {
                OR: [
                    { visibility: { not: "private" } },
                    ...(userId ? [{ members: { some: { userId } } }] : [])
                ]
            },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { members: true } },
                members: {
                    take: 5,
                    include: {
                        user: { select: { id: true, name: true, image: true, impactXP: true } },
                    },
                },
            },
        });

        const formatted = clubs.map((club) => {
            const currentMember = userId
                ? club.members.find((m) => m.userId === userId)
                : null;

            return {
                id: club.id,
                name: club.name,
                description: club.description,
                type: club.type,
                domain: club.domain,
                gradient: club.gradient,
                banner: club.banner,
                logo: club.logo,
                themeColor: club.themeColor,
                vibe: club.vibe,
                tags: club.tags,
                memberCount: club._count.members,
                members: club.members.map((m) => m.user),
                impactXP: club.members.reduce((sum, m) => sum + (m.user.impactXP || 0), 0),
                isMember: !!currentMember,
                currentUserRole: currentMember?.role || null,
                creatorId: club.creatorId,
                visibility: club.visibility,
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Clubs fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function generateCode(length = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, type, domain, tags, gradient, banner, logo, themeColor, vibe, visibility } = await req.json();

        if (!name || !description) {
            return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
        }

        const existingClub = await prisma.club.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
        });

        if (existingClub) {
            return NextResponse.json({ error: "A club with this name already exists" }, { status: 400 });
        }

        const isPrivate = visibility === "private";
        let inviteCode: string | null = null;
        if (isPrivate) {
            // Generate unique invite code
            let unique = false;
            while (!unique) {
                inviteCode = generateCode();
                const existing = await prisma.club.findUnique({ where: { inviteCode } });
                if (!existing) unique = true;
            }
        }

        const defaultPermissions = {
            coowner: { kick: true, ban: true, timeout: true, manageInvites: true, editSettings: true, postAnnouncements: true },
            moderator: { kick: false, ban: false, timeout: true, manageInvites: false, editSettings: false, postAnnouncements: false },
            member: { kick: false, ban: false, timeout: false, manageInvites: false, editSettings: false, postAnnouncements: false },
        };

        const club = await prisma.club.create({
            data: {
                name,
                description,
                type: type || "open",
                visibility: isPrivate ? "private" : "public",
                inviteCode,
                domain: domain || "Tech",
                tags: tags || [],
                gradient: gradient || "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
                banner: banner || null,
                logo: logo || null,
                themeColor: themeColor || "#6366f1",
                vibe: vibe || "professional",
                permissions: defaultPermissions,
                creatorId: session.user.id,
                members: {
                    create: { userId: session.user.id, role: "owner" },
                },
            },
        });

        return NextResponse.json(club, { status: 201 });
    } catch (error) {
        console.error("Club creation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
