import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        const uniqueId = nanoid();
        const extension = file.name.split(".").pop();
        const filename = `${uniqueId}.${extension}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);
        console.log(`File uploaded to ${path}`);

        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
