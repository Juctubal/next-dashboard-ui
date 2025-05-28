import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpush } from '@/lib/webpush';
import { format } from 'date-fns';

// GET: Check for schedules matching current time and send notifications
export async function GET(request: Request) {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Format the current time for exact matching with the time_of_day field
    const currentTimeFormatted = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    console.log(`Checking notifications at exact time: ${currentTimeFormatted}`);
    console.log(`Current date/time: ${currentTime.toISOString()}`);
    
    // Format time of day (e.g., "MORNING", "AFTERNOON", "EVENING")
    let timeOfDay = "MORNING";
    if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = "AFTERNOON";
    } else if (currentHour >= 17) {
      timeOfDay = "EVENING";
    } else if (currentHour < 6) {
      // Add specific handling for nighttime hours (12 AM - 6 AM)
      timeOfDay = "NIGHT";
    }
    
    console.log(`Time of day: ${timeOfDay}`);

    // Format date for checking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the day of the week (0 = Sunday, 1 = Monday, ...)
    const dayOfWeek = currentTime.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayName = dayNames[dayOfWeek];
    
    // Get the day of the month (1-31)
    const dayOfMonth = currentTime.getDate();
    
    // 1. Check one-time schedules for today that match the current time of day AND exact time (if provided)
    // Get all today's one-time schedules
    const oneTimeSchedules = await prisma.oneTimeSched.findMany({
      where: {
        taskDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Next day
        },
      },
      include: {
        schedule: true,
      },
    });
    
    // Filter schedules to only include those that match current time
    const timeMatchingOneTimeSchedules = oneTimeSchedules.filter(sched => {
      // Look for direct time match using the time_of_day field
      const exactTimeMatch = sched.time_of_day === currentTimeFormatted;
      
      if (exactTimeMatch) {
        console.log(`Exact time match found in OneTimeSched: ${sched.time_of_day} matches current time ${currentTimeFormatted}`);
        console.log(`Task: ${sched.taskName}, Date: ${sched.taskDate.toISOString()}`);
      }
      
      // Return true if the time matches
      return exactTimeMatch;
    });
    
    console.log('One-time schedules found:', oneTimeSchedules.length);
    console.log('Time-matching one-time schedules:', timeMatchingOneTimeSchedules.length);

    // 2. Check recurring schedules that match today and the current time of day OR exact time
    // Get all valid recurring schedules
    const recurringSchedules = await prisma.recurrentSchedules.findMany({
      where: {
        startDate: { lte: currentTime },
        endDate: { gte: currentTime },
      },
      include: {
        schedule: true,
      },
    });
    
    // Filter recurring schedules based on exact time match
    const timeMatchingRecurringSchedules = recurringSchedules.filter(sched => {
      // Look for direct time match using the time_of_day field
      const exactTimeMatch = sched.time_of_day === currentTimeFormatted;
      
      if (exactTimeMatch) {
        console.log(`Exact time match found in RecurrentSchedules: ${sched.time_of_day} matches current time ${currentTimeFormatted}`);
        console.log(`Schedule ID: ${sched.schedId}, Start: ${sched.startDate.toISOString()}, End: ${sched.endDate.toISOString()}`);
      }
      
      // Return true if the time matches
      return exactTimeMatch;
    });
    
    console.log('Recurring schedules before filtering:', recurringSchedules.length);
    console.log('Time-matching recurring schedules:', timeMatchingRecurringSchedules.length);

    // Filter time-matching recurring schedules based on recurrence pattern
    const matchingRecurringSchedules = timeMatchingRecurringSchedules.filter(recurring => {
      if (!recurring.schedule) return false;

      if (recurring.reccurencePattern === "DAILY") {
        // Daily schedules always match
        return true;
      } else if (recurring.reccurencePattern === "WEEKLY") {
        // Check if today's day of week is in the weekDays array
        const weekDays = recurring.weekDays ? JSON.parse(recurring.weekDays) : [];
        return weekDays.includes(currentDayName);
      } else if (recurring.reccurencePattern === "MONTHLY") {
        // For monthly, check if day of month matches (this is simplified)
        // In a complete implementation, you'd need to handle "last day of month", etc.
        return dayOfMonth === recurring.startDate.getDate();
      }
      
      return false;
    });

    // Combine all matching schedules
    const allMatchingSchedules = [
      ...timeMatchingOneTimeSchedules.map(s => ({ 
        type: 'one-time', 
        schedule: s.schedule, 
        taskName: s.taskName 
      })),
      ...matchingRecurringSchedules.map(s => ({ 
        type: 'recurring', 
        schedule: s.schedule, 
        taskName: s.schedule?.taskName || 'Unknown task' 
      }))
    ];
    
    console.log(`Found ${allMatchingSchedules.length} total matching schedules`);

    // Get all push subscriptions using type assertion for Prisma client
    const subscriptions = await (prisma as any).pushSubscription.findMany();
    console.log(`Found ${subscriptions.length} total push subscriptions`);
    
    // Count of notifications sent
    let notificationsSent = 0;

    // Send push notifications for each matching schedule to the assigned staff only
    for (const { schedule, taskName, type } of allMatchingSchedules) {
      if (!schedule) continue;
      
      // Get the assigned staff ID for this schedule
      const assignedStaffId = schedule.staffId;
      console.log(`Schedule ${schedule.id} is assigned to staff ID: ${assignedStaffId || 'none'}`);
      
      // If no staff is assigned, skip this schedule
      if (!assignedStaffId) {
        console.log(`Skipping notification for schedule ${schedule.id} - no staff assigned`);
        continue;
      }
      
      // Format the notification details
      const currentTimeStr = format(currentTime, 'h:mm a');
      const notificationPayload = {
        title: `Schedule Reminder: ${taskName}`,
        body: `${schedule.descript} (${currentTimeStr}) - ${type === 'recurring' ? 'Recurring' : 'One-time'} task`,
        url: '/list/events', // URL to open when notification is clicked
      };
      
      console.log(`Preparing notification for staff ${assignedStaffId}: ${notificationPayload.title}`);

      // Find subscriptions belonging to the assigned staff member only
      const staffSubscriptions = subscriptions.filter((sub: { userId: string }) => sub.userId === assignedStaffId);
      console.log(`Found ${staffSubscriptions.length} subscriptions for staff ${assignedStaffId}`);
      
      // Send notification to all subscriptions belonging to the assigned staff
      for (const subscription of staffSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify(notificationPayload)
          );
          notificationsSent++;
          console.log(`Notification sent to subscription ${subscription.id} for staff ${subscription.userId}`);
        } catch (error) {
          console.error('Error sending notification to subscription:', subscription.id, error);
          
          // If the subscription is invalid (gone), remove it
          if (error instanceof Error && 
              (error.message.includes('410') || error.message.includes('404'))) {
            await (prisma as any).pushSubscription.delete({
              where: { id: subscription.id },
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      matchingSchedules: allMatchingSchedules.length,
      notificationsSent,
      currentTime: format(currentTime, 'yyyy-MM-dd HH:mm:ss'),
      timeOfDay
    });
  } catch (error) {
    console.error('Error processing schedule notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to process notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
