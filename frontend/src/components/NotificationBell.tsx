import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../utils/api';
import Link from 'next/link';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        // Refresh count every minute
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationsApi.getUnreadCount();
            setUnreadCount((response as any).unread_count);
        } catch (error) {
            console.log('Error fetching unread count:', error);
        }
    };

    return (
        <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
