'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

interface RealtimeNotification {
  id: string;
  type: 'BOOKING' | 'PAYMENT' | 'REVIEW' | 'CHAT' | 'SYSTEM' | 'PROMOTION';
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationListItem extends RealtimeNotification {
  isRead: boolean;
  createdAt: string;
}

export function NotificationsRealtimeBridge() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
      {
        auth: { token: accessToken },
        transports: ['websocket'],
      }
    );

    socket.on('notification:new', (notification: RealtimeNotification) => {
      queryClient.setQueryData(
        ['notifications'],
        (current: NotificationListItem[] | undefined): NotificationListItem[] => {
          const nextItem: NotificationListItem = {
            ...notification,
            isRead: false,
            createdAt: new Date().toISOString(),
          };

          const existing = current ?? [];
          const withoutDuplicate = existing.filter((item) => item.id !== notification.id);
          return [nextItem, ...withoutDuplicate];
        }
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  return null;
}
