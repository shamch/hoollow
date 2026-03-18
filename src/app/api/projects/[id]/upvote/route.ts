import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addXP } from "@/lib/xp";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;

        const existing = await prisma.projectUpvote.findUnique({
            where: { projectId_userId: { projectId, userId: session.user.id } },
        });

        if (existing) {
            // Remove upvote
            await (prisma as any).projectUpvote.delete({
                where: { id: existing.id },
            });
            const project = await prisma.project.update({
                where: { id: projectId },
                data: { upvotes: { decrement: 1 } },
            });
            // Remove XP
            if (project.authorId !== session.user.id) {
                await addXP(project.authorId, -2, `Removed upvote on project "${project.name?.substring(0, 20)}..."`);
            }
            return NextResponse.json({ upvotes: project.upvotes, upvoted: false });
        } else {
            // Add upvote
            await (prisma as any).projectUpvote.create({
                data: { projectId, userId: session.user.id },
            });
            const project = await prisma.project.update({
                where: { id: projectId },
                data: { upvotes: { increment: 1 } },
            });
            // Award XP
            if (project.authorId !== session.user.id) {
                await addXP(project.authorId, 2, `Received upvote on project "${project.name?.substring(0, 20)}..."`);
            }
            
            // Create notification
            const voter = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
            await (prisma as any).notification.create({
                data: {
                    type: "upvote",
                    message: `${voter?.name || "Someone"} upvoted your project "${project.name}"`,
                    userId: project.authorId,
                    relatedId: project.id,
                },
            });

            return NextResponse.json({ upvotes: project.upvotes, upvoted: true });
        }
    } catch (error) {
        console.error("Project upvote error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
