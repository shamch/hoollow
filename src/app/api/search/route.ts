import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";

        if (q.length < 2) {
            return NextResponse.json({ posts: [], users: [] });
        }

        const [posts, users] = await Promise.all([
            prisma.post.findMany({
                where: {
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { body: { contains: q, mode: 'insensitive' } }
                    ]
                },
                include: {
                    author: {
                        select: { id: true, name: true, username: true, image: true, role: true, impactXP: true }
                    },
                    _count: { select: { upvotes: true, comments: true } }
                },
                take: 5
            }),
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { username: { contains: q, mode: 'insensitive' } }
                    ]
                },
                select: { id: true, name: true, username: true, image: true, role: true, impactXP: true },
                take: 5
            })
        ]);

        return NextResponse.json({
            posts: posts.map((p: any) => ({
                id: p.id,
                title: p.title,
                author: p.author,
                upvotes: p._count.upvotes,
                createdAt: p.createdAt
            })),
            users
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
