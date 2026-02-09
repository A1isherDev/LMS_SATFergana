'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import { notificationsApi } from '../../utils/api';
import { Bell, Check, Trash2, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: number;
    actor_name: string;
    verb: string;
    target_type: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const params = filter === 'unread' ? { is_read: false } : {};
            const data: any = await notificationsApi.getNotifications(params);
            setNotifications(data.results || data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Bell className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-sm text-gray-500">Stay updated with your class activities</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={markAllRead}
                                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                disabled={!notifications.some(n => !n.is_read)}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Mark all as read
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            All Notifications
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Unread Only
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Loading notifications...</p>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-6 flex items-start space-x-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''
                                            }`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <Bell className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm ${!notification.is_read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                                    <span className="font-semibold text-blue-600">{notification.actor_name}</span> {notification.verb}
                                                </p>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-1 text-gray-400 hover:text-blue-600"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                                                <span className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                                <span className="flex items-center uppercase tracking-wider">
                                                    {notification.target_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">No notifications yet</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">
                                    We'll notify you here about new homework, class announcements, and grades.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
