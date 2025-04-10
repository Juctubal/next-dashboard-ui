import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's metadata from Clerk
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { firstName, lastName, username, password, role } =
      await request.json();
    console.log("Received request data:", {
      firstName,
      lastName,
      username,
      role,
    });

    // Create a new user in Clerk
    const clerkResponse = await fetch("https://api.clerk.dev/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        public_metadata: { role },
      }),
    });

    if (!clerkResponse.ok) {
      const clerkError = await clerkResponse.json();
      console.error("Clerk API error:", clerkError);
      return NextResponse.json(
        { error: "Failed to create Clerk user: " + JSON.stringify(clerkError) },
        { status: clerkResponse.status }
      );
    }

    const clerkUserData = await clerkResponse.json();
    console.log("Clerk user created:", clerkUserData);

    // Create a new staff member in the database
    const staffMember = await (
      (role === "HANDLER" ? prisma.handler : prisma.breeder) as any
    ).create({
      data: {
        id: clerkUserData.id,
        first_name: firstName,
        last_name: lastName,
        username,
        password,
        email: "",
        phone: "",
        img: "",
        role: role as UserRole,
        status: "ACTIVE",
      },
    });

    console.log("Database record created:", staffMember);

    return NextResponse.json(staffMember);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
