import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface EventRecord {
  id: number;
  eventName: string;
  isArchived: boolean;
}

interface ConditioningRecord {
  id: number;
  isArchived: boolean;
}

interface ProgramRecord {
  id: number;
  programName: string;
  isArchived: boolean;
}

type RecordType = EventRecord | ConditioningRecord | ProgramRecord;

// Mark this route as not requiring authentication
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This route directly checks and updates the database, bypassing Prisma's abstractions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "event";
    const id = searchParams.get("id");
    const action = searchParams.get("action") || "check";
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    console.log(`[DIRECTDB] ${action} ${type} with ID ${numericId}`);
    
    // Check current database state with raw query
    let currentState: RecordType[] = [];
    let tableName: string;
    
    switch (type) {
      case "event":
        tableName = "Event";
        currentState = await prisma.$queryRaw`
          SELECT id, "eventName", "isArchived" FROM "Event" WHERE id = ${numericId}
        `;
        break;
      case "conditioning":
        tableName = "Conditioning";
        currentState = await prisma.$queryRaw`
          SELECT id, "isArchived" FROM "Conditioning" WHERE id = ${numericId}
        `;
        break;
      case "program":
        tableName = "ConditioningProgram";
        currentState = await prisma.$queryRaw`
          SELECT id, "programName", "isArchived" FROM "ConditioningProgram" WHERE id = ${numericId}
        `;
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    
    console.log(`[DIRECTDB] Current state:`, currentState);
    
    // If action is 'toggle', directly update the database with raw SQL
    if (action === "toggle" && currentState && currentState.length > 0) {
      const currentArchiveState = currentState[0].isArchived;
      const newArchiveState = !currentArchiveState;
      
      console.log(`[DIRECTDB] Toggling archive state from ${currentArchiveState} to ${newArchiveState}`);
      
      // Perform direct update with raw SQL
      await prisma.$executeRaw`
        UPDATE "${tableName}" SET "isArchived" = ${newArchiveState} WHERE id = ${numericId}
      `;
      
      // Verify the update
      let verifyUpdate: RecordType[] = [];
      switch (type) {
        case "event":
          verifyUpdate = await prisma.$queryRaw`
            SELECT id, "eventName", "isArchived" FROM "Event" WHERE id = ${numericId}
          `;
          break;
        case "conditioning":
          verifyUpdate = await prisma.$queryRaw`
            SELECT id, "isArchived" FROM "Conditioning" WHERE id = ${numericId}
          `;
          break;
        case "program":
          verifyUpdate = await prisma.$queryRaw`
            SELECT id, "programName", "isArchived" FROM "ConditioningProgram" WHERE id = ${numericId}
          `;
          break;
      }
      
      console.log(`[DIRECTDB] After update:`, verifyUpdate);
      
      return NextResponse.json({
        before: currentState[0],
        after: verifyUpdate?.[0],
        success: verifyUpdate?.[0]?.isArchived === newArchiveState
      });
    }
    
    // If just checking, return the current state
    return NextResponse.json({ 
      record: currentState?.[0] || null,
      message: currentState?.length === 0 ? "Record not found" : "Record found" 
    });
    
  } catch (error) {
    console.error("[DIRECTDB] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
