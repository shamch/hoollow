import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/mail";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                deleteOTP: otp,
                deleteOTPExpires: expiry,
            },
        });

        await sendOTPEmail(session.user.email, otp);

        return NextResponse.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("OTP generation error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
