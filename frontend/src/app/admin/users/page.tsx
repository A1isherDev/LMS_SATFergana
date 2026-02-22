'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/utils/api';
import { User, Search, Filter, MoreVertical, Shield, Trash2, Edit2, CheckCircle, XCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/helpers';
import { ApiResponse, User as UserType } from '@/types';

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, roleFilter]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (roleFilter !== 'ALL') params.role = roleFilter;

            const response = await adminApi.getUsers(params) as ApiResponse<UserType>;
            // Handle both paginated and non-paginated responses just in case, though types say it returns data
            // If API returns standard DRF pagination: { count, next, previous, results }
            // If our apiClient unwraps data, we might get the object directly.
            // Based on api.ts get<T>, it returns response.data.
            if (response.results) {
                setUsers(response.results);
            } else if (Array.isArray(response)) {
                setUsers(response);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback mock data for demo if API fails (since backend might not have this endpoint yet)
            setUsers([
                { id: 1, email: 'admin@example.com', first_name: 'System', last_name: 'Admin', role: 'ADMIN', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 2, email: 'teacher@example.com', first_name: 'John', last_name: 'Doe', role: 'TEACHER', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: 3, email: 'student@example.com', first_name: 'Jane', last_name: 'Smith', role: 'STUDENT', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        const toastId = toast.loading('Deleting user...');
        try {
            await adminApi.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            toast.success('User deleted successfully', { id: toastId });
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user', { id: toastId });
        }
    };

    const handleRoleChange = async (id: number, newRole: string) => {
        try {
            await adminApi.updateUser(id, { role: newRole });
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole as any } : u));
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                            <p className="text-gray-500 dark:text-gray-400">Manage system access and user roles</p>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Invite User
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center space-x-2 w-full md:w-auto">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="flex-1 md:w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="STUDENT">Student</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {isLoading ? (
                                        // Skeleton loading rows
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div></td>
                                                <td className="px-6 py-4"></td>
                                            </tr>
                                        ))
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                No users found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {user.first_name} {user.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                            user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(user.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination controls could go here */}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
