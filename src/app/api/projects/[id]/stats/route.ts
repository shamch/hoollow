import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;

        // Fetch project basic stats
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, upvotes: true, views: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Count comments separately to avoid type issues
        const commentsCount = await (prisma as any).projectComment.count({
            where: { projectId }
        });

        // Fetch supporters (users who upvoted)
        const supporters = await (prisma as any).projectUpvote.findMany({
            where: { projectId },
            take: 12,
            orderBy: { createdAt: "desc" },
            select: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    }
                }
            }
        });

        return NextResponse.json({
            id: project.id,
            upvotes: project.upvotes,
            views: project.views,
            commentsCount,
            supporters: supporters.map((s: any) => s.user)
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
