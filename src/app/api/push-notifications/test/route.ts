import { NextResponse } from 'next/server';
import { webpush } from '@/lib/webpush';
import { prisma } from '@/lib/prisma';

// POST: Send a test push notification to all subscribers
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title = 'Test Notification', message = 'This is a test notification' } = body;

    // Get all push subscriptions
    const subscriptions = await (prisma as any).pushSubscription.findMany();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No subscriptions found. Subscribe to notifications first.' 
      });
    }
    
    let notificationsSent = 0;
    let errors = 0;

    // Send notification to all subscriptions
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body: message,
            url: '/list/events',
          })
        );
        notificationsSent++;
      } catch (error) {
        errors++;
        console.error('Error sending test notification:', error);
        
        // If the subscription is invalid (gone), remove it
        if (error instanceof Error && 
            (error.message.includes('410') || error.message.includes('404'))) {
          await (prisma as any).pushSubscription.delete({
            where: { id: subscription.id },
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      notificationsSent,
      errors,
      totalSubscriptions: subscriptions.length
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
