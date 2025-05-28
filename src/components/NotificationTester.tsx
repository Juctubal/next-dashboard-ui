'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

const NotificationTester = () => {
  const [title, setTitle] = useState('Schedule Reminder');
  const [message, setMessage] = useState('Your scheduled task is due now!');
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (sending) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, message }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sent ${data.notificationsSent} notifications successfully`);
      } else {
        toast.error(data.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Test Push Notifications</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="notification-title">Notification Title</Label>
          <Input
            id="notification-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
        </div>
        
        <div>
          <Label htmlFor="notification-message">Notification Message</Label>
          <Input
            id="notification-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
          />
        </div>
        
        <Button 
          onClick={handleSendTest} 
          disabled={sending}
          className="w-full"
        >
          {sending ? (
            <span className="animate-spin mr-2">...</span>
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Test Notification
        </Button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Note: You must first subscribe to notifications using the bell icon in the top right corner.
          Push notifications require HTTPS and may not work in development unless using a secure tunnel or https-localhost.
        </p>
      </div>
    </div>
  );
};

export default NotificationTester;
