'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { classesApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import {
    FileText,
    Link,
    Video,
    Trash2,
    Plus,
    Pencil
} from 'lucide-react';

interface ClassResource {
    id: number;
    title: string;
    description: string;
    resource_type: 'PDF' | 'LINK' | 'VIDEO' | 'OTHER';
    file?: string;
    url?: string;
    class_obj: number;
    created_at: string;
}

interface ClassSummary {
    id: number;
    name: string;
}

export default function ResourcesPage() {
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<ClassResource[]>([]);
    const [classes, setClasses] = useState<ClassSummary[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        description: '',
        resource_type: 'PDF',
        url: '',
        file: null as File | null
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const classesData = await classesApi.getClasses();
            const classList = (Array.isArray(classesData) ? classesData : (classesData as any).results || []) as ClassSummary[];
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClassId(classList[0].id);
                fetchResources(classList[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('Failed to load classes');
            setLoading(false);
        }
    };

    const fetchResources = async (classId: number) => {
        setLoading(true);
        try {
            const response = await classesApi.getResources({ class_id: classId });
            // Cast response to unknown then to ClassResource[] because api returns generic type
            const resourceList = (Array.isArray(response) ? response : (response as any).results || []) as ClassResource[];
            setResources(resourceList);
        } catch (error) {
            console.error('Error fetching resources:', error);
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const classId = Number(e.target.value);
        setSelectedClassId(classId);
        fetchResources(classId);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            await classesApi.deleteResource(id);
            toast.success('Resource deleted');
            setResources(resources.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting resource:', error);
            toast.error('Failed to delete resource');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId) return;

        try {
            const formData = {
                title: newResource.title,
                description: newResource.description,
                resource_type: newResource.resource_type,
                url: newResource.url,
                file: newResource.file,
                class_obj: selectedClassId
            };

            await classesApi.createResource(formData);
            toast.success('Resource created successfully');
            setIsModalOpen(false);
            setNewResource({
                title: '',
                description: '',
                resource_type: 'PDF',
                url: '',
                file: null
            });
            fetchResources(selectedClassId);
        } catch (error) {
            console.error('Error creating resource:', error);
            toast.error('Failed to create resource');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'PDF': return <FileText className="h-6 w-6 text-red-500" />;
            case 'LINK': return <Link className="h-6 w-6 text-blue-500" />;
            case 'VIDEO': return <Video className="h-6 w-6 text-purple-500" />;
            default: return <FileText className="h-6 w-6 text-gray-500" />;
        }
    };

    return (
        <AuthGuard requireAuth={true}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Class Resources</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage study materials, links, and documents for your classes
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={selectedClassId || ''}
                                    onChange={handleClassChange}
                                    disabled={classes.length === 0}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                    {classes.length === 0 && <option>No classes found</option>}
                                </select>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                disabled={!selectedClassId}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Resource
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Start by adding some study materials for your students.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {resources.map((resource) => (
                                <div key={resource.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <div className="flex-shrink-0">
                                        {getIcon(resource.resource_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <a href={resource.url || resource.file} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                                            <span className="absolute inset-0" aria-hidden="true" />
                                            <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                                            <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                                        </a>
                                    </div>
                                    <div className="z-10 flex-shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(resource.id); }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Resource Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Resource</h3>
                                    <form onSubmit={handleCreate} className="mt-5 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={newResource.title}
                                                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                value={newResource.description}
                                                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            <select
                                                value={newResource.resource_type}
                                                onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value as any })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                <option value="PDF">PDF Document</option>
                                                <option value="LINK">External Link</option>
                                                <option value="VIDEO">Video</option>
                                            </select>
                                        </div>

                                        {newResource.resource_type === 'PDF' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">File</label>
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => setNewResource({ ...newResource, file: e.target.files ? e.target.files[0] : null })}
                                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">URL</label>
                                                <input
                                                    type="url"
                                                    value={newResource.url}
                                                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    placeholder="https://"
                                                />
                                            </div>
                                        )}

                                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                            <button
                                                type="submit"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                                            >
                                                Create
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </AuthGuard>
    );
}
