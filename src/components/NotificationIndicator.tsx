'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationIndicatorProps {
  timeOfDay: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  timeOfDay,
  size = 'sm',
  className = '',
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Background color based on time of day
  const getTimeColor = () => {
    switch (timeOfDay.toUpperCase()) {
      case 'MORNING':
        return 'bg-yellow-100 dark:bg-yellow-900';
      case 'AFTERNOON':
        return 'bg-orange-100 dark:bg-orange-900';
      case 'EVENING':
        return 'bg-indigo-100 dark:bg-indigo-900';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center ${className}`}>
            <div className={`rounded-full p-1 ${getTimeColor()}`}>
              <Bell className={`${sizeClasses[size]} text-gray-700 dark:text-gray-300`} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Notification will trigger at {timeOfDay.toLowerCase()} time</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotificationIndicator;
