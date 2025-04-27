import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextRequest } from "next/server";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const gamefowlId = formData.get("gamefowlId") as string;

    if (!image || !gamefowlId) {
      return NextResponse.json(
        { error: "Image and gamefowl ID are required" },
        { status: 400 }
      );
    }

    // Check if gamefowl exists
    const gamefowl = await prisma.gamefowl.findUnique({
      where: { id: parseInt(gamefowlId) },
    });

    if (!gamefowl) {
      return NextResponse.json(
        { error: "Gamefowl not found" },
        { status: 404 }
      );
    }

    // Create unique filename
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `gamefowl-${gamefowlId}-${uniqueSuffix}.${image.name
      .split(".")
      .pop()}`;

    // Ensure the uploads/gamefowls directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "gamefowls");
    if (!existsSync(uploadDir)) {
      console.log(`Creating directory: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    }

    // Save image to public/uploads/gamefowls directory
    const filePath = join(uploadDir, filename);
    console.log(`Saving file to: ${filePath}`);
    await writeFile(filePath, buffer);

    // Update gamefowl record with new image path
    const imagePath = `/uploads/gamefowls/${filename}`;

    await prisma.gamefowl.update({
      where: { id: parseInt(gamefowlId) },
      data: { img: imagePath },
    });

    return NextResponse.json({ imagePath });
  } catch (error) {
    console.error("Error uploading gamefowl picture:", error);
    return NextResponse.json(
      { error: "Failed to upload gamefowl picture" },
      { status: 500 }
    );
  }
}
