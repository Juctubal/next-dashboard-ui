import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { Handler, Breeder, UserRole } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

// Add GET method to fetch staff data by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find the staff member in the Handler table
    const handler = await prisma.handler.findUnique({
      where: { id: params.id },
    });

    // If found in Handler table, return it
    if (handler) {
      return NextResponse.json(handler);
    }

    // If not found in Handler table, try the Breeder table
    const breeder = await prisma.breeder.findUnique({
      where: { id: params.id },
    });

    // If found in Breeder table, return it
    if (breeder) {
      return NextResponse.json(breeder);
    }

    // If not found in either table, return 404
    return NextResponse.json(
      { error: "Staff member not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's metadata from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = user.publicMetadata.role as string;
    const isAdmin = userRole === "admin";
    const isOwnProfile = userId === params.id;

    // Only allow admins to update any profile, or users to update their own profile
    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: "Unauthorized - You can only update your own profile" },
        { status: 401 }
      );
    }

    const { firstName, lastName, username, password, role, email, phone } =
      await request.json();

    // If not admin, ensure they can't change their role
    if (!isAdmin && role && role.toLowerCase() !== userRole.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized - You cannot change your role" },
        { status: 401 }
      );
    }

    // Check if username is already taken by another staff member
    const existingStaff = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Handler" WHERE username = ${username} AND id != ${params.id}
      UNION
      SELECT id FROM "Breeder" WHERE username = ${username} AND id != ${params.id}
    `;

    if (existingStaff.length > 0) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email is already taken by another staff member
      const existingEmail = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Handler" WHERE email = ${email} AND id != ${params.id}
        UNION
        SELECT id FROM "Breeder" WHERE email = ${email} AND id != ${params.id}
      `;

      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "Email is already taken by another staff member" },
          { status: 400 }
        );
      }
    }

    // Update the user in Clerk
    const clerkUpdateData: any = {
      username,
      first_name: firstName,
      last_name: lastName,
      public_metadata: { role: isAdmin ? role : userRole },
    };

    // Only include password if it's provided
    if (password) {
      clerkUpdateData.password = password;
    }

    const clerkResponse = await fetch(
      `https://api.clerk.dev/v1/users/${params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        body: JSON.stringify(clerkUpdateData),
      }
    );

    if (!clerkResponse.ok) {
      const clerkError = await clerkResponse.json();
      console.error("Clerk API error:", clerkError);
      return NextResponse.json(
        { error: "Failed to update Clerk user: " + JSON.stringify(clerkError) },
        { status: clerkResponse.status }
      );
    }

    console.log("Clerk user updated successfully");

    // Determine which table to update based on the role
    const updateData = {
      first_name: firstName,
      last_name: lastName,
      username,
      role: isAdmin ? role : userRole,
      email,
      phone,
      ...(password && { password: await hash(password, 10) }),
    };

    // Update the staff member based on their role
    let updatedStaff: Handler | Breeder;
    if (role.toLowerCase() === "handler") {
      updatedStaff = await prisma.handler.update({
        where: { id: params.id },
        data: {
          ...updateData,
          role: role.toLowerCase() as UserRole,
        },
      });
    } else {
      updatedStaff = await prisma.breeder.update({
        where: { id: params.id },
        data: {
          ...updateData,
          role: role.toLowerCase() as UserRole,
        },
      });
    }

    return NextResponse.json(updatedStaff);
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
