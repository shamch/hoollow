import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const comments = await prisma.projectComment.findMany({
            where: { projectId: params.id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        impactXP: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Fetch comments error:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text } = await req.json();
        if (!text) {
            return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
        }

        const comment = await prisma.projectComment.create({
            data: {
                text,
                projectId: params.id,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        impactXP: true,
                    },
                },
            },
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Create comment error:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
