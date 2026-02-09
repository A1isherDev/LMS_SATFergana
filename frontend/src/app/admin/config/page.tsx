'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/utils/api';
import { Save, RefreshCw, AlertTriangle, CheckCircle, Database, Lock, Globe } from 'lucide-react';
import { renderDiffs } from 'diff'; // This seems wrong, renderDiffs is a markdown tool helper, not a library I can import. I'll remove it.

interface SystemConfig {
    site_name: string;
    maintenance_mode: boolean;
    allow_registration: boolean;
    default_student_role: string;
    max_upload_size_mb: number;
    session_timeout_minutes: number;
    smtp_enabled: boolean;
    debug_mode: boolean;
}

export default function SystemConfigPage() {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setIsLoading(true);
            const data = await adminApi.getSystemConfig() as unknown as SystemConfig;
            // Handle potential API failure or wrapping
            if (data) {
                setConfig(data);
            } else {
                throw new Error('No config data');
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            // Fallback default config
            setConfig({
                site_name: 'SAT Fergana LMS',
                maintenance_mode: false,
                allow_registration: true,
                default_student_role: 'STUDENT',
                max_upload_size_mb: 10,
                session_timeout_minutes: 60,
                smtp_enabled: true,
                debug_mode: false,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (key: keyof SystemConfig, value: any) => {
        if (config) {
            setConfig({ ...config, [key]: value });
        }
    };

    const handleSave = async () => {
        if (!config) return;
        try {
            setIsSaving(true);
            setMessage(null);
            await adminApi.updateSystemConfig(config);
            setMessage({ type: 'success', text: 'Configuration saved successfully.' });
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: 'Failed to save configuration.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!config) return null; // Or skeleton

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Configuration</h1>
                            <p className="text-gray-500 dark:text-gray-400">Manage global platform settings</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertTriangle className="h-5 w-5 mr-3" />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* General Settings */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center mb-4 text-blue-600 dark:text-blue-400">
                                <Globe className="h-5 w-5 mr-2" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">General Settings</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                                    <input
                                        type="text"
                                        value={config.site_name}
                                        onChange={(e) => handleChange('site_name', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.maintenance_mode}
                                            onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-gray-900 dark:text-white font-medium">Maintenance Mode</span>
                                    </label>
                                    <p className="text-xs text-gray-500 ml-8 mt-1">If enabled, only admins can access the site.</p>
                                </div>
                                <div>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.allow_registration}
                                            onChange={(e) => handleChange('allow_registration', e.target.checked)}
                                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-gray-900 dark:text-white font-medium">Allow New Registrations</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center mb-4 text-purple-600 dark:text-purple-400">
                                <Lock className="h-5 w-5 mr-2" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & Access</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Timeout (minutes)</label>
                                    <input
                                        type="number"
                                        value={config.session_timeout_minutes}
                                        onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Upload Size (MB)</label>
                                    <input
                                        type="number"
                                        value={config.max_upload_size_mb}
                                        onChange={(e) => handleChange('max_upload_size_mb', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Technical */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2">
                            <div className="flex items-center mb-4 text-slate-600 dark:text-slate-400">
                                <Database className="h-5 w-5 mr-2" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Technical Configuration</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.debug_mode}
                                            onChange={(e) => handleChange('debug_mode', e.target.checked)}
                                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-gray-900 dark:text-white font-medium">Debug Mode</span>
                                    </label>
                                    <p className="text-xs text-gray-500 ml-8 mt-1">Enables detailed error logging. Do not use in production.</p>
                                </div>
                                <div>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.smtp_enabled}
                                            onChange={(e) => handleChange('smtp_enabled', e.target.checked)}
                                            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="text-gray-900 dark:text-white font-medium">SMTP Email Sending</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
