import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { Handler, Breeder, UserRole } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { firstName, lastName, username, password, role } =
      await request.json();

    // Check if username is already taken by another staff member
    const existingStaff = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Handler" WHERE username = ${username} AND id != ${params.id}
      UNION
      SELECT id FROM "Breeder" WHERE username = ${username} AND id != ${params.id}
    `;

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: "username is taken" }, { status: 400 });
    }

    // Determine which table to update based on the role
    const updateData = {
      first_name: firstName,
      last_name: lastName,
      username,
      role,
      ...(password && { password: await hash(password, 10) }),
    };

    // Update the staff member based on their role
    let updatedStaff: Handler | Breeder;
    if (role.toLowerCase() === "handler") {
      updatedStaff = await prisma.handler.update({
        where: { id: params.id },
        data: {
          ...updateData,
          role: role.toUpperCase() as UserRole,
        },
      });
    } else {
      updatedStaff = await prisma.breeder.update({
        where: { id: params.id },
        data: {
          ...updateData,
          role: role.toUpperCase() as UserRole,
        },
      });
    }

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}
