import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDeletionEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { role, displayName, username, bio, skills, openToCollab, image } = body;

        // Validate required fields
        const errors: Record<string, string> = {};
        if (!displayName || displayName.trim().length === 0) {
            errors.displayName = "Display name is required";
        }
        if (!username || username.trim().length < 3) {
            errors.username = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.username = "Only letters, numbers, and underscores allowed";
        } else if (username.length > 20) {
            errors.username = "Username must be 20 characters or less";
        } else {
            // Check uniqueness (case-insensitive), excluding current user
            const existing = await prisma.user.findFirst({
                where: {
                    username: { equals: username, mode: "insensitive" },
                    NOT: { email: session.user.email },
                },
            });
            if (existing) {
                errors.username = "Username is already taken";
            }
        }

        if (Object.keys(errors).length > 0) {
            return NextResponse.json({ errors }, { status: 400 });
        }

        const updateData: any = {
            name: displayName,
            username: username.toLowerCase(),
            role: role,
            bio: bio,
            skills: skills,
        };
        if (typeof openToCollab === "boolean") {
            updateData.openToCollab = openToCollab;
        }
        if (image) {
            updateData.image = image;
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
        });

        // Save initial projects from onboarding if any
        if (body.projects && Array.isArray(body.projects)) {
            const validProjects = body.projects.filter((p: any) => p.title?.trim() && p.description?.trim());
            for (const p of validProjects) {
                await (prisma as any).project.create({
                    data: {
                        name: p.title,
                        description: p.description,
                        githubUrl: p.link || null,
                        authorId: user.id
                    }
                });
            }
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                posts: { orderBy: { createdAt: "desc" }, take: 10 },
                projects: { orderBy: { createdAt: "desc" }, take: 10 },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Cancel deletion
        await prisma.user.update({
            where: { id: session.user.id },
            data: { scheduledDeletionDate: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cancel deletion error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { otp } = await req.json();
        if (!otp) {
            return NextResponse.json({ error: "OTP is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { deleteOTP: true, deleteOTPExpires: true },
        });

        if (!user || user.deleteOTP !== otp || !user.deleteOTPExpires || user.deleteOTPExpires < new Date()) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // Set deletion date to 30 days from now
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 30);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { 
                scheduledDeletionDate: deletionDate,
                deleteOTP: null,
                deleteOTPExpires: null,
            },
        });

        // Send confirmation email
        await sendDeletionEmail(session.user.email, deletionDate);

        return NextResponse.json({ 
            success: true, 
            message: "Account deletion scheduled for 30 days from now.",
            scheduledDeletionDate: deletionDate.toISOString()
        });
    } catch (error) {
        console.error("Profile deletion scheduling error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
