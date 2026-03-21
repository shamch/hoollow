import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendClubTransferOTPEmail } from "@/lib/mail";

// POST: Request OTP for ownership transfer
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const club = await prisma.club.findUnique({
            where: { id: params.id },
            include: { members: true },
        });

        if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

        const isOwner = club.members.some(m => m.userId === session.user.id && m.role === "owner");
        if (!isOwner) {
            return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                clubTransferOTP: otp,
                clubTransferOTPExpires: expiresAt,
            },
        });

        await sendClubTransferOTPEmail(session.user.email, otp, club.name);

        return NextResponse.json({ message: "OTP sent to your email" });
    } catch (error) {
        console.error("Transfer ownership OTP request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Verify OTP and execute transfer
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { otp, targetMemberId } = await req.json();

        if (!otp || !targetMemberId) {
            return NextResponse.json({ error: "OTP and target member ID are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { clubTransferOTP: true, clubTransferOTPExpires: true },
        });

        if (!user?.clubTransferOTP || !user.clubTransferOTPExpires) {
            return NextResponse.json({ error: "No transfer requested" }, { status: 400 });
        }

        if (user.clubTransferOTP !== otp || new Date() > user.clubTransferOTPExpires) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        const club = await prisma.club.findUnique({
            where: { id: params.id },
            include: { members: true },
        });

        if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

        const currentOwner = club.members.find(m => m.userId === session.user.id && m.role === "owner");
        if (!currentOwner) {
            return NextResponse.json({ error: "Only the owner can execute transfer" }, { status: 403 });
        }

        const targetMember = club.members.find(m => m.id === targetMemberId);
        if (!targetMember) {
            return NextResponse.json({ error: "Target member not found in club" }, { status: 404 });
        }

        // Transaction to swap roles safely and clear OTP
        await prisma.$transaction([
            prisma.clubMember.update({
                where: { id: currentOwner.id },
                data: { role: "coowner" }, // Demote current owner to coowner
            }),
            prisma.clubMember.update({
                where: { id: targetMember.id },
                data: { role: "owner" }, // Promote target to owner
            }),
            prisma.user.update({
                where: { id: session.user.id },
                data: { clubTransferOTP: null, clubTransferOTPExpires: null }, // Clear OTP
            }),
        ]);

        return NextResponse.json({ message: "Ownership transferred successfully" });
    } catch (error) {
        console.error("Transfer ownership error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
