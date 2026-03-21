import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.project.update({
            where: { id: params.id },
            data: { views: { increment: 1 } }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("View increment error:", error);
        return NextResponse.json({ error: "Failed to increment view" }, { status: 500 });
    }
}
