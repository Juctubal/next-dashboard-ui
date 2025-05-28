import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpush, vapidKeys } from '@/lib/webpush';

// POST: Save a new push subscription
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if this specific user already has a subscription with this endpoint
    const existingUserEndpointSubscription = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: subscription.endpoint,
        userId: userId,
      },
    });

    // If this user already has this exact subscription, just update it
    if (existingUserEndpointSubscription) {
      const result = await prisma.pushSubscription.update({
        where: {
          id: existingUserEndpointSubscription.id,
        },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
      return NextResponse.json({ success: true, id: result.id });
    }
    
    // Check if another user has this endpoint subscription
    const otherUserEndpointSubscription = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: subscription.endpoint,
        NOT: {
          userId: userId
        }
      },
    });

    // If another user has this endpoint, we need to delete it first to avoid unique constraint errors
    if (otherUserEndpointSubscription) {
      await prisma.pushSubscription.delete({
        where: {
          id: otherUserEndpointSubscription.id
        }
      });
    }
    
    // Check if this user already has another subscription from a different device
    const existingUserSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId: userId,
      },
    });
    
    // If this user already has a subscription, delete it to ensure we have only one per user
    if (existingUserSubscription) {
      await prisma.pushSubscription.delete({
        where: {
          id: existingUserSubscription.id
        }
      });
    }
    
    // Create a new subscription for this user
    const result = await prisma.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId,
      },
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

// DELETE: Remove a push subscription
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Find the subscription first to confirm it exists
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        endpoint: endpoint,
      },
    });

    if (!subscription) {
      return NextResponse.json({ success: true, message: 'No subscription found with this endpoint' });
    }

    // Delete the subscription
    await prisma.pushSubscription.delete({
      where: {
        id: subscription.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}

// GET: Return the public VAPID key
export async function GET() {
  return NextResponse.json({ publicKey: vapidKeys.publicKey });
}
