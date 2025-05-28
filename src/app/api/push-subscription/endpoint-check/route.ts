import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint to check if a subscription endpoint belongs to the current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const endpoint = searchParams.get('endpoint');

    if (!userId || !endpoint) {
      return NextResponse.json({ error: 'User ID and endpoint are required' }, { status: 400 });
    }
    
    console.log(`Checking if endpoint ${endpoint} belongs to user: ${userId}`);

    // Find a subscription with the given endpoint
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: endpoint,
      },
    });

    // Check if the subscription exists and belongs to the current user
    const isCurrentUser = subscription !== null && subscription.userId === userId;

    return NextResponse.json({
      found: subscription !== null,
      isCurrentUser: isCurrentUser,
      subscriptionId: subscription ? subscription.id : null,
      subscriptionUserId: subscription ? subscription.userId : null,
    });
  } catch (error) {
    console.error('Error checking endpoint ownership:', error);
    return NextResponse.json(
      { error: 'Failed to check endpoint ownership' },
      { status: 500 }
    );
  }
}
