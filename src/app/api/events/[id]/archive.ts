import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[ARCHIVE API] Starting archive operation for event ID:', params.id);
    
    const body = await request.json();
    const { isArchived } = body;
    console.log('[ARCHIVE API] Received request body:', { isArchived, type: typeof isArchived });
    
    // Make sure we have a valid ID
    const eventId = Number(params.id);
    if (isNaN(eventId)) {
      console.error('[ARCHIVE API] Invalid event ID:', params.id);
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }
    
    // Make sure isArchived is properly converted to a boolean
    // IMPORTANT FIX: The original conversion logic was flawed
    // Using strict equality with true/false to ensure proper boolean conversion
    let isArchivedBoolean;
    if (typeof isArchived === 'boolean') {
      isArchivedBoolean = isArchived;
    } else if (typeof isArchived === 'string') {
      isArchivedBoolean = isArchived === 'true';
    } else {
      // Default to false for null, undefined, or any other type
      isArchivedBoolean = false;
    }
    
    console.log('[ARCHIVE API] Converted isArchived to boolean:', { 
      isArchivedBoolean, 
      originalValue: isArchived, 
      originalType: typeof isArchived 
    });
    
    // First check if the event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    console.log('[ARCHIVE API] Found existing event:', { 
      found: !!existingEvent,
      currentArchivedStatus: existingEvent?.isArchived
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Check if the current status already matches what we want to set
    if (existingEvent.isArchived === isArchivedBoolean) {
      console.log('[ARCHIVE API] Event already has the requested archive status, no update needed');
      return NextResponse.json({
        success: true,
        message: `Event already has archive status: ${isArchivedBoolean}`,
        event: existingEvent
      });
    }
    
    console.log('[ARCHIVE API] Updating event record in database with new archive status:', isArchivedBoolean);
    
    // Use a transaction to ensure atomicity
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: First try with explicit raw query which bypasses Prisma's abstraction
        await tx.$executeRaw(Prisma.sql`UPDATE "Event" SET "isArchived" = ${isArchivedBoolean} WHERE id = ${eventId}`);
        console.log('[ARCHIVE API] Raw SQL update executed within transaction');
        
        // Step 2: Also do a Prisma update as backup to ensure it's updated in both ways
        const prismaUpdate = await tx.event.update({
          where: { id: eventId },
          data: { isArchived: isArchivedBoolean },
        });
        console.log('[ARCHIVE API] Prisma update executed within transaction:', prismaUpdate);
        
        // Step 3: Verify the update was successful within the transaction
        const verifyUpdate = await tx.event.findUnique({
          where: { id: eventId }
        });
        
        if (!verifyUpdate || verifyUpdate.isArchived !== isArchivedBoolean) {
          console.error('[ARCHIVE API] Update verification failed:', {
            expected: isArchivedBoolean,
            actual: verifyUpdate?.isArchived
          });
          throw new Error('Failed to update archive status - verification failed');
        }
        
        console.log('[ARCHIVE API] Update verified within transaction:', verifyUpdate);
      }, {
        maxWait: 5000, // 5s max wait time
        timeout: 10000, // 10s timeout
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Strongest isolation level
      });
      
      console.log('[ARCHIVE API] Transaction completed successfully');
    } catch (updateError) {
      console.error('[ARCHIVE API] Database transaction error:', updateError);
      throw updateError; // Re-throw to be caught by the outer catch
    }
    
    // Then get the updated record to confirm
    const confirmEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    console.log('[ARCHIVE API] Confirmed updated event:', confirmEvent);
    
    if (!confirmEvent) {
      throw new Error(`Event with ID ${eventId} not found after update`);
    }
    
    console.log('[ARCHIVE API] Database update completed successfully. New state:', { 
      id: confirmEvent.id,
      isArchived: confirmEvent.isArchived,
      eventName: confirmEvent.eventName
    });
    
    return NextResponse.json({
      success: true,
      message: `Event archive status updated to ${isArchivedBoolean}`,
      event: {
        id: confirmEvent.id,
        isArchived: confirmEvent.isArchived
      }
    });
  } catch (error) {
    console.error('[ARCHIVE API] Error updating event archive status:', error);
    return NextResponse.json({ error: "Failed to update archive status", details: String(error) }, { status: 500 });
  }
}
