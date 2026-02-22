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
        <Link href="/notifications" className="relative p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 active:scale-95 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 group">
            <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-xl bg-red-500 text-[10px] font-black text-white border-4 border-white dark:border-gray-800 shadow-lg shadow-red-500/40">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
