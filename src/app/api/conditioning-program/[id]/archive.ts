import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[ARCHIVE API] Starting archive operation for conditioning program ID:', params.id);
    
    const body = await request.json();
    const { isArchived } = body;
    console.log('[ARCHIVE API] Received request body:', { isArchived, type: typeof isArchived });
    
    // Make sure we have a valid ID
    const programId = Number(params.id);
    if (isNaN(programId)) {
      console.error('[ARCHIVE API] Invalid program ID:', params.id);
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }
    
    // Make sure isArchived is properly converted to a boolean
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
    
    // First check if the program exists
    const existingProgram = await prisma.conditioningProgram.findUnique({
      where: { id: programId },
    });
    
    console.log('[ARCHIVE API] Found existing program:', { 
      found: !!existingProgram,
      currentArchivedStatus: existingProgram?.isArchived
    });
    
    if (!existingProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    
    // Check if the current status already matches what we want to set
    if (existingProgram.isArchived === isArchivedBoolean) {
      console.log('[ARCHIVE API] Program already has the requested archive status, no update needed');
      return NextResponse.json({
        success: true,
        message: `Program already has archive status: ${isArchivedBoolean}`,
        program: existingProgram
      });
    }
    
    // Update the program with explicit boolean
    console.log('[ARCHIVE API] Updating program in database with new archive status:', isArchivedBoolean);
    // Use a transaction to ensure atomicity
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: First try with explicit raw query which bypasses Prisma's abstraction
        await tx.$executeRaw(Prisma.sql`UPDATE "ConditioningProgram" SET "isArchived" = ${isArchivedBoolean} WHERE id = ${programId}`);
        console.log('[ARCHIVE API] Raw SQL update executed within transaction');
        
        // Step 2: Also do a Prisma update as backup to ensure it's updated in both ways
        const prismaUpdate = await tx.conditioningProgram.update({
          where: { id: programId },
          data: { isArchived: isArchivedBoolean },
        });
        console.log('[ARCHIVE API] Prisma update executed within transaction:', prismaUpdate);
        
        // Step 3: Verify the update was successful within the transaction
        const verifyUpdate = await tx.conditioningProgram.findUnique({
          where: { id: programId }
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
    const updatedProgram = await prisma.conditioningProgram.findUnique({
      where: { id: programId },
    });
    
    // Check if we got the updated program
    if (!updatedProgram) {
      console.error('[ARCHIVE API] Failed to find program after update');
      return NextResponse.json({ error: "Failed to confirm update" }, { status: 500 });
    }
    
    console.log('[ARCHIVE API] Database update completed successfully. New state:', { 
      id: updatedProgram.id,
      isArchived: updatedProgram.isArchived,
      programName: updatedProgram.programName
    });
    
    return NextResponse.json({
      success: true,
      message: `Program archive status updated to ${isArchivedBoolean}`,
      program: {
        id: updatedProgram.id,
        isArchived: updatedProgram.isArchived
      }
    });
  } catch (error) {
    console.error('[ARCHIVE API] Error updating program archive status:', error);
    return NextResponse.json({ error: "Failed to update archive status", details: String(error) }, { status: 500 });
  }
}
