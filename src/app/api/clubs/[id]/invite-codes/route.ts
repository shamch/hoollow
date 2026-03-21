import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateCode(length = 8): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

const ROLE_LEVEL: Record<string, number> = { owner: 4, coowner: 3, moderator: 2, member: 1 };

// GET: List all invite codes for this club
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || member.role === "member") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const club = await prisma.club.findUnique({
            where: { id: params.id },
            select: { inviteCode: true, visibility: true },
        });

        const codes = await prisma.clubInviteCode.findMany({
            where: { clubId: params.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ mainCode: club?.inviteCode, visibility: club?.visibility, codes });
    } catch (error) {
        console.error("Invite codes fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Generate a new special invite code
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || (ROLE_LEVEL[member.role] || 0) < ROLE_LEVEL.coowner) {
            return NextResponse.json({ error: "Need co-owner or higher" }, { status: 403 });
        }

        const { label, maxUses, expiresInHours } = await req.json();

        let code = generateCode();
        // Ensure uniqueness
        while (await prisma.clubInviteCode.findUnique({ where: { code } })) {
            code = generateCode();
        }

        const invite = await prisma.clubInviteCode.create({
            data: {
                code,
                label: label || null,
                maxUses: maxUses || 0,
                clubId: params.id,
                expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 3600000) : null,
            },
        });

        return NextResponse.json(invite, { status: 201 });
    } catch (error) {
        console.error("Invite code create error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Revoke a specific invite code
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || (ROLE_LEVEL[member.role] || 0) < ROLE_LEVEL.coowner) {
            return NextResponse.json({ error: "Need co-owner or higher" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const codeId = searchParams.get("codeId");
        if (!codeId) return NextResponse.json({ error: "codeId required" }, { status: 400 });

        await prisma.clubInviteCode.delete({ where: { id: codeId } });
        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Invite code delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Regenerate the main club invite code
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || member.role !== "owner") {
            return NextResponse.json({ error: "Only owner can regenerate the main code" }, { status: 403 });
        }

        let newCode = generateCode();
        while (await prisma.club.findUnique({ where: { inviteCode: newCode } })) {
            newCode = generateCode();
        }

        const club = await prisma.club.update({
            where: { id: params.id },
            data: { inviteCode: newCode },
        });

        return NextResponse.json({ inviteCode: club.inviteCode });
    } catch (error) {
        console.error("Regenerate invite code error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
