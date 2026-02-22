'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import { usersApi } from '../../utils/api';
import {
    Mail,
    Plus,
    Copy,
    Check,
    Trash2,
    UserPlus,
    Calendar,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/helpers';

interface Invitation {
    id: number;
    code: string;
    email: string;
    role: 'STUDENT' | 'TEACHER';
    created_by: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    created_at: string;
    expires_at: string;
    is_used: boolean;
    used_by?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    used_at?: string;
}

export default function InvitationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [newInvitation, setNewInvitation] = useState({
        email: '',
        role: 'STUDENT' as 'STUDENT' | 'TEACHER'
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const data: any = await usersApi.getInvitations();
            const list = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
            setInvitations(list);
        } catch (error) {
            console.error('Error fetching invitations:', error);
            setInvitations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInvitation = async () => {
        if (!newInvitation.email) {
            toast.error('Please enter an email address');
            return;
        }

        setIsCreating(true);
        const toastId = toast.loading('Creating invitation...');
        try {
            const data: any = await usersApi.createInvitation(newInvitation);
            setInvitations([data, ...invitations]);
            setShowCreateModal(false);
            setNewInvitation({ email: '', role: 'STUDENT' });
            toast.success('Invitation created successfully!', { id: toastId });
        } catch (error: any) {
            console.error('Error creating invitation:', error);
            const detail = error.response?.data?.detail || error.message || 'Failed to create invitation';
            toast.error(`Error: ${detail}`, { id: toastId });
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success('Code copied to clipboard');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleDeleteInvitation = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this invitation?')) {
            return;
        }

        const toastId = toast.loading('Deleting invitation...');
        try {
            await usersApi.deleteInvitation(id);
            setInvitations(invitations.filter(inv => inv.id !== id));
            toast.success('Invitation deleted successfully', { id: toastId });
        } catch (error) {
            console.error('Error deleting invitation:', error);
            toast.error('Error deleting invitation', { id: toastId });
        }
    };

    const isExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date();
    };

    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">Only teachers and admins can manage invitations.</p>
                    </div>
                </DashboardLayout>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Invitation Management</h1>
                            <p className="text-gray-600">Create and manage student invitations</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create Invitation
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Invitations</p>
                                    <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
                                </div>
                                <Mail className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {invitations.filter(inv => !inv.is_used && !isExpired(inv.expires_at)).length}
                                    </p>
                                </div>
                                <UserPlus className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Accepted</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {invitations.filter(inv => inv.is_used).length}
                                    </p>
                                </div>
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Expired</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {invitations.filter(inv => !inv.is_used && isExpired(inv.expires_at)).length}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Invitations List */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">All Invitations</h2>
                        </div>

                        {isLoading ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : invitations.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Mail className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                <p>No invitations yet. Create one to get started!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invitations.map((invitation) => (
                                            <tr key={invitation.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                            {invitation.code}
                                                        </code>
                                                        <button
                                                            onClick={() => handleCopyCode(invitation.code)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                            title="Copy code"
                                                        >
                                                            {copiedCode === invitation.code ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {invitation.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${invitation.role === 'STUDENT'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {invitation.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateTime(invitation.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateTime(invitation.expires_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {invitation.is_used ? (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            Accepted
                                                        </span>
                                                    ) : isExpired(invitation.expires_at) ? (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                            Expired
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {!invitation.is_used && (
                                                        <button
                                                            onClick={() => handleDeleteInvitation(invitation.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Delete invitation"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Invitation Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Invitation</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={newInvitation.email}
                                        onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="student@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={newInvitation.role}
                                        onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value as 'STUDENT' | 'TEACHER' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewInvitation({ email: '', role: 'STUDENT' });
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateInvitation}
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create Invitation'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </AuthGuard>
    );
}
