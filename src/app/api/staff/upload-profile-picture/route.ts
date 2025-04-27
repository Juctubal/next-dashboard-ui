import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextRequest } from "next/server";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const staffId = formData.get("staffId") as string;

    if (!image || !staffId) {
      return NextResponse.json(
        { error: "Image and staff ID are required" },
        { status: 400 }
      );
    }

    // Check if staff exists
    const staff =
      (await prisma.handler.findUnique({
        where: { id: staffId },
      })) ||
      (await prisma.breeder.findUnique({
        where: { id: staffId },
      }));

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Create unique filename
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${staffId}-${uniqueSuffix}.${image.name
      .split(".")
      .pop()}`;

    // Ensure the uploads/profiles directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
    if (!existsSync(uploadDir)) {
      console.log(`Creating directory: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    }

    // Save image to public/uploads/profiles directory
    const filePath = join(uploadDir, filename);
    console.log(`Saving file to: ${filePath}`);
    await writeFile(filePath, buffer);

    // Update staff record with new image path
    const imagePath = `/uploads/profiles/${filename}`;

    if (staff.role === "handler") {
      await prisma.handler.update({
        where: { id: staffId },
        data: { img: imagePath },
      });
    } else {
      await prisma.breeder.update({
        where: { id: staffId },
        data: { img: imagePath },
      });
    }

    return NextResponse.json({ imagePath });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    );
  }
}
