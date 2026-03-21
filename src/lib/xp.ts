import { prisma } from "./prisma";

/**
 * Adds ImpactXP to a user and records it in history.
 */
export async function addXP(userId: string, amount: number, reason: string) {
    try {
        return await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { impactXP: amount >= 0 ? { increment: amount } : { decrement: Math.abs(amount) } },
            }),
            (prisma as any).xPHistory.create({
                data: {
                    userId,
                    amount,
                    reason,
                },
            }),
        ]);
    } catch (error) {
        console.error("Error adding XP:", error);
        throw error;
    }
}
