import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[ARCHIVE API] Starting archive operation for conditioning ID:', params.id);
    
    const body = await request.json();
    const { isArchived } = body;
    console.log('[ARCHIVE API] Received request body:', { isArchived, type: typeof isArchived });
    
    // Make sure we have a valid ID
    const conditioningId = Number(params.id);
    if (isNaN(conditioningId)) {
      console.error('[ARCHIVE API] Invalid conditioning ID:', params.id);
      return NextResponse.json({ error: "Invalid conditioning ID" }, { status: 400 });
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
    
    // First check if the conditioning record exists
    const existingConditioning = await prisma.conditioning.findUnique({
      where: { id: conditioningId },
    });
    
    console.log('[ARCHIVE API] Found existing conditioning record:', { 
      found: !!existingConditioning,
      currentArchivedStatus: existingConditioning?.isArchived
    });
    
    if (!existingConditioning) {
      return NextResponse.json({ error: "Conditioning record not found" }, { status: 404 });
    }
    
    // Check if the current status already matches what we want to set
    if (existingConditioning.isArchived === isArchivedBoolean) {
      console.log('[ARCHIVE API] Conditioning record already has the requested archive status, no update needed');
      return NextResponse.json({
        success: true,
        message: `Conditioning record already has archive status: ${isArchivedBoolean}`,
        conditioning: existingConditioning
      });
    }
    
    // Update the conditioning record with explicit boolean
    console.log('[ARCHIVE API] Updating conditioning record in database with new archive status:', isArchivedBoolean);
    
    // Use a raw query first to ensure the update happens correctly
    // Use a transaction to ensure atomicity
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: First try with explicit raw query which bypasses Prisma's abstraction
        await tx.$executeRaw(Prisma.sql`UPDATE "Conditioning" SET "isArchived" = ${isArchivedBoolean} WHERE id = ${conditioningId}`);
        console.log('[ARCHIVE API] Raw SQL update executed within transaction');
        
        // Step 2: Also do a Prisma update as backup to ensure it's updated in both ways
        const prismaUpdate = await tx.conditioning.update({
          where: { id: conditioningId },
          data: { isArchived: isArchivedBoolean },
        });
        console.log('[ARCHIVE API] Prisma update executed within transaction:', prismaUpdate);
        
        // Step 3: Verify the update was successful within the transaction
        const verifyUpdate = await tx.conditioning.findUnique({
          where: { id: conditioningId }
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
    const updatedConditioning = await prisma.conditioning.findUnique({
      where: { id: conditioningId },
    });
    
    // Check if we got the updated conditioning record
    if (!updatedConditioning) {
      console.error('[ARCHIVE API] Failed to find conditioning record after update');
      return NextResponse.json({ error: "Failed to confirm update" }, { status: 500 });
    }
    
    console.log('[ARCHIVE API] Database update completed successfully. New state:', { 
      id: updatedConditioning.id,
      isArchived: updatedConditioning.isArchived
    });
    
    return NextResponse.json({
      success: true,
      message: `Conditioning record archive status updated to ${isArchivedBoolean}`,
      conditioning: {
        id: updatedConditioning.id,
        isArchived: updatedConditioning.isArchived
      }
    });
  } catch (error) {
    console.error('[ARCHIVE API] Error updating conditioning archive status:', error);
    return NextResponse.json({ error: "Failed to update archive status", details: String(error) }, { status: 500 });
  }
}
