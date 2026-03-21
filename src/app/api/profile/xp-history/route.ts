import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const history = await (prisma as any).xPHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        if (history.length === 0) {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (user && user.impactXP >= 50) {
                const initialRecord = await (prisma as any).xPHistory.create({
                    data: {
                        userId: user.id,
                        amount: 50,
                        reason: "Account Creation",
                        createdAt: user.createdAt,
                    },
                });
                return NextResponse.json([initialRecord]);
            }
        }

        return NextResponse.json(history);
    } catch (error) {
        console.error("Fetch XP history error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
