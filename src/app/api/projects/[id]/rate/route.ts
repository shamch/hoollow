import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { idea, execution, design } = await req.json();
        
        const rating = await prisma.projectRating.upsert({
            where: {
                projectId_userId: {
                    projectId: params.id,
                    userId: session.user.id,
                },
            },
            update: { 
                idea: idea || 0, 
                execution: execution || 0, 
                design: design || 0 
            },
            create: {
                idea: idea || 0,
                execution: execution || 0,
                design: design || 0,
                projectId: params.id,
                userId: session.user.id,
            },
        });

        return NextResponse.json(rating);
    } catch (error) {
        console.error("Rating error:", error);
        return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const ratings = await prisma.projectRating.findMany({
            where: { projectId: params.id },
        });

        if (ratings.length === 0) {
            return NextResponse.json({ 
                average: 0, 
                count: 0,
                idea: 0,
                execution: 0,
                design: 0
            });
        }

        const count = ratings.length;
        const sums = ratings.reduce((acc, curr) => ({
            idea: acc.idea + curr.idea,
            execution: acc.execution + curr.execution,
            design: acc.design + curr.design,
        }), { idea: 0, execution: 0, design: 0 });

        const averages = {
            idea: sums.idea / count,
            execution: sums.execution / count,
            design: sums.design / count,
        };

        const totalAverage = (averages.idea + averages.execution + averages.design) / 3;

        return NextResponse.json({ 
            average: totalAverage, 
            count,
            ...averages
        });
    } catch (error) {
        console.error("Fetch ratings error:", error);
        return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
    }
}
