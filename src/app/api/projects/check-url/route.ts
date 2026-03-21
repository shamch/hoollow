import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { url, isGithub } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            return NextResponse.json({ ok: false, message: "Invalid URL format" });
        }

        if (isGithub && !url.includes("github.com")) {
            return NextResponse.json({ ok: false, message: "Must be a valid GitHub URL" });
        }

        // Perform the check
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const res = await fetch(url, { 
                method: "GET", // Some sites block HEAD
                signal: controller.signal,
                headers: {
                    "User-Agent": "Hoollow-Validator/1.0"
                }
            });
            
            clearTimeout(timeoutId);

            if (res.ok) {
                return NextResponse.json({ ok: true, message: "URL is reachable" });
            } else {
                return NextResponse.json({ ok: false, message: `Status: ${res.status}` });
            }
        } catch (e) {
            return NextResponse.json({ ok: false, message: "URL is unreachable or blocking validation" });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
