import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint to check if a user has an active subscription
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`Checking subscription status for user: ${userId}`);

    // Check if the user has an active subscription in the database
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: userId,
      },
    });

    // Default to not subscribed if no record exists
    const isSubscribed = existingSubscription !== null;

    return NextResponse.json({
      isSubscribed: isSubscribed,
      subscriptionId: isSubscribed ? existingSubscription.id : null,
    });
  } catch (error) {
    console.error('Error checking user subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
