'use client';

import { useEffect } from 'react';
import { useScheduleNotificationChecker } from '@/lib/notificationScheduler';

/**
 * This component doesn't render anything visible.
 * It just sets up the notification checking logic when it's mounted.
 */
const NotificationScheduler = () => {
  // Set up the notification checker
  const { lastChecked } = useScheduleNotificationChecker();

  return null;
};

export default NotificationScheduler;
