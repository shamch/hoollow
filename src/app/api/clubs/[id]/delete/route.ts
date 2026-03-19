import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Request OTP for club deletion
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || member.role !== "owner") {
            return NextResponse.json({ error: "Only the owner can delete this club" }, { status: 403 });
        }

        const club = await prisma.club.findUnique({ where: { id: params.id } });
        if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
        if (club.scheduledDeletion) {
            return NextResponse.json({ error: "Club is already scheduled for deletion" }, { status: 400 });
        }

        const otp = generateOTP();
        await prisma.club.update({
            where: { id: params.id },
            data: {
                deleteOTP: otp,
                deleteOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
            },
        });

        try {
            await resend.emails.send({
                from: "no-reply@hoollow.com",
                to: session.user.email,
                subject: `Club Deletion OTP - ${club.name}`,
                html: `
                    <div style="font-family: Inter, sans-serif; padding: 32px; max-width: 480px; margin: 0 auto;">
                        <h2 style="color: #ef4444;">Club Deletion Verification</h2>
                        <p>You are requesting to delete the club <strong>${club.name}</strong>.</p>
                        <p>After verification, the club will be scheduled for deletion in <strong>30 days</strong>. You can cancel anytime during this period.</p>
                        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc2626;">${otp}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Email send error:", emailError);
        }

        return NextResponse.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Club delete request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Verify OTP and schedule deletion (30 days)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || member.role !== "owner") {
            return NextResponse.json({ error: "Only the owner can delete this club" }, { status: 403 });
        }

        const { otp } = await req.json();
        const club = await prisma.club.findUnique({ where: { id: params.id } });
        if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

        if (!club.deleteOTP || club.deleteOTP !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }
        if (club.deleteOTPExpires && club.deleteOTPExpires < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
        }

        const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await prisma.club.update({
            where: { id: params.id },
            data: {
                scheduledDeletion: scheduledDate,
                deleteOTP: null,
                deleteOTPExpires: null,
            },
        });

        // Notify all members
        const allMembers = await prisma.clubMember.findMany({
            where: { clubId: params.id },
            select: { userId: true },
        });

        for (const m of allMembers) {
            await (prisma as any).notification.create({
                data: {
                    type: "club_deletion",
                    message: `"${club.name}" is scheduled for deletion on ${scheduledDate.toLocaleDateString()}. The owner has 30 days to cancel.`,
                    userId: m.userId,
                    relatedId: params.id,
                },
            });
        }

        return NextResponse.json({ scheduledDeletion: scheduledDate });
    } catch (error) {
        console.error("Club delete verify error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Cancel scheduled deletion
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member || member.role !== "owner") {
            return NextResponse.json({ error: "Only the owner can manage deletion" }, { status: 403 });
        }

        await prisma.club.update({
            where: { id: params.id },
            data: { scheduledDeletion: null, deleteOTP: null, deleteOTPExpires: null },
        });

        // Notify members that deletion is cancelled
        const club = await prisma.club.findUnique({ where: { id: params.id } });
        const allMembers = await prisma.clubMember.findMany({
            where: { clubId: params.id },
            select: { userId: true },
        });
        for (const m of allMembers) {
            await (prisma as any).notification.create({
                data: {
                    type: "club_deletion_cancelled",
                    message: `Deletion of "${club?.name}" has been cancelled by the owner.`,
                    userId: m.userId,
                    relatedId: params.id,
                },
            });
        }

        return NextResponse.json({ cancelled: true });
    } catch (error) {
        console.error("Club delete cancel error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
