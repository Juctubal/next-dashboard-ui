import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Check if a subscription belongs to a specific user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const userId = searchParams.get('userId');

    if (!endpoint || !userId) {
      return NextResponse.json({ 
        error: 'Endpoint and userId are required',
        exists: false 
      }, { status: 400 });
    }

    // Check if the subscription exists and belongs to this user
    const subscription = await (prisma as any).pushSubscription.findFirst({
      where: {
        endpoint: endpoint,
        userId: userId
      },
    });

    return NextResponse.json({ 
      exists: !!subscription,
      userId: userId
    });
  } catch (error) {
    console.error('Error checking subscription ownership:', error);
    return NextResponse.json({ 
      error: 'Failed to check subscription',
      exists: false 
    }, { status: 500 });
  }
}
