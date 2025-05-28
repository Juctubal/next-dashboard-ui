'use client';

import { useEffect, useState } from 'react';

// Function to check for matching schedules and send notifications
export const useScheduleNotificationChecker = () => {
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    // Check immediately on first load
    checkSchedulesAndNotify();

    // Set up interval to check every minute
    const intervalId = setInterval(checkSchedulesAndNotify, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const checkSchedulesAndNotify = async () => {
    try {
      // Calculate if we should check (don't check more than once per minute)
      const now = new Date();
      if (lastChecked && now.getTime() - lastChecked.getTime() < 60 * 1000) {
        return;
      }

      // Call the API endpoint to check schedules and send notifications
      const response = await fetch('/api/push-notifications');
      const data = await response.json();
      
      setLastChecked(now);
      
      // Log results for debugging
      if (data.matchingSchedules > 0) {
        console.log(`Notification check: ${data.notificationsSent} notifications sent for ${data.matchingSchedules} matching schedules`);
      }
    } catch (error) {
      console.error('Error checking for schedule notifications:', error);
    }
  };

  return { lastChecked };
};
