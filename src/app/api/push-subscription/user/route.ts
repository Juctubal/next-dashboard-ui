import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint to delete all subscriptions for a specific user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`Deleting subscriptions for user: ${userId}`);

    // Delete all subscriptions for this user
    const deleteResult = await prisma.pushSubscription.deleteMany({
      where: {
        userId: userId,
      },
    });

    console.log(`Deleted ${deleteResult.count} subscriptions for user ${userId}`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error('Error deleting user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to delete user subscriptions' },
      { status: 500 }
    );
  }
}
