import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// This API endpoint serves as a more reliable replacement for the existing archive endpoints

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Add cache control headers to prevent caching
function addNoCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "event";
    
    console.log(`[ARCHIVE-TEST] GET request for ${type} records`);
    
    let records = [];
    
    switch (type) {
      case "event":
        records = await prisma.event.findMany({
          select: {
            id: true,
            eventName: true,
            isArchived: true,
          },
          orderBy: {
            id: 'asc',
          },
          take: 50,
        });
        break;
      case "conditioning":
        records = await prisma.conditioning.findMany({
          select: {
            id: true,
            isArchived: true,
            // Get something descriptive from each conditioning record
            status: true,
            startDate: true
          },
          orderBy: {
            id: 'asc',
          },
          take: 50,
        });
        break;
      case "program":
        records = await prisma.conditioningProgram.findMany({
          select: {
            id: true,
            programName: true,
            isArchived: true,
          },
          orderBy: {
            id: 'asc',
          },
          take: 50,
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    
    console.log(`[ARCHIVE-TEST] Found ${records.length} ${type} records`);
    
    const response = NextResponse.json({ records });
    return addNoCacheHeaders(response);
  } catch (error) {
    console.error("[ARCHIVE-TEST] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, id, isArchived } = body;
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: "Valid ID is required" }, { status: 400 });
    }
    
    if (typeof isArchived !== 'boolean') {
      return NextResponse.json({ error: "isArchived must be a boolean" }, { status: 400 });
    }
    
    console.log(`[ARCHIVE-TEST] POST request to update ${type} ID ${id} with isArchived=${isArchived}`);
    
    // Use raw SQL to ensure we're bypassing any middleware or ORM issues
    let tableName = '';
    switch (type) {
      case "event":
        tableName = "Event";
        break;
      case "conditioning":
        tableName = "Conditioning";
        break;
      case "program":
        tableName = "ConditioningProgram";
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    
    // First, check if the record exists
    // Need to use Prisma.sql to properly escape the table name
    const exists = await prisma.$queryRaw(Prisma.sql`
      SELECT id FROM "${Prisma.raw(tableName)}" WHERE id = ${id}
    `);
    
    if (!exists || (exists as any[]).length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    
    // Update with transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Use raw SQL to update
      await tx.$executeRaw(Prisma.sql`
        UPDATE "${Prisma.raw(tableName)}" SET "isArchived" = ${isArchived} WHERE id = ${id}
      `);
      
      // 2. Verify the update worked
      let verifyRecord;
      switch (type) {
        case "event":
          verifyRecord = await tx.event.findUnique({
            where: { id },
            select: { id: true, eventName: true, isArchived: true }
          });
          break;
        case "conditioning":
          verifyRecord = await tx.conditioning.findUnique({
            where: { id },
            select: { id: true, status: true, startDate: true, isArchived: true }
          });
          break;
        case "program":
          verifyRecord = await tx.conditioningProgram.findUnique({
            where: { id },
            select: { id: true, programName: true, isArchived: true }
          });
          break;
      }
      
      return verifyRecord;
    }, {
      isolationLevel: 'Serializable' // Highest isolation level for consistency
    });
    
    console.log(`[ARCHIVE-TEST] Update result:`, result);
    
    if (!result) {
      return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
    }
    
    if (result.isArchived !== isArchived) {
      return NextResponse.json({ 
        error: `Update inconsistency: expected isArchived=${isArchived}, but got isArchived=${result.isArchived}`,
        record: result
      }, { status: 500 });
    }
    
    const response = NextResponse.json({ 
      success: true, 
      record: result,
      message: `Successfully ${isArchived ? 'archived' : 'unarchived'} record`
    });
    
    return addNoCacheHeaders(response);
  } catch (error) {
    console.error("[ARCHIVE-TEST] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
