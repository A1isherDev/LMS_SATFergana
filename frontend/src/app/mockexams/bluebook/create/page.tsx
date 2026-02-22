'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { bluebookApi, questionBankApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Save, Plus, X, Loader, Database, Search, Edit2, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateBluebookExamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [createdExamId, setCreatedExamId] = useState<number | null>(null);
    const [isPopulating, setIsPopulating] = useState(false);
    const [setupMode, setSetupMode] = useState<'CHOICE' | 'AUTO' | 'MANUAL' | null>(null);

    // Manual Setup State
    const [examStructure, setExamStructure] = useState<any>(null);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        is_active: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const toastId = toast.loading('Creating Digital SAT structure...');
        try {
            const result = await bluebookApi.createExam({
                ...formData,
                total_duration_minutes: 134
            });

            setCreatedExamId(result.id);
            setSetupMode('CHOICE');
            toast.success('Exam structure created! Choose how to add questions.', { id: toastId });

            // Fetch structure immediately
            const structure = await bluebookApi.getExamStructure(result.id);
            setExamStructure(structure);
        } catch (error) {
            console.error('Error creating exam:', error);
            toast.error('Failed to create Digital SAT exam', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePopulate = async () => {
        if (!createdExamId) return;
        setIsPopulating(true);
        const toastId = toast.loading('Populating exam with questions from the Question Bank...');

        try {
            const res = await bluebookApi.populateQuestions(createdExamId);
            toast.success(res.message || 'Questions populated successfully!', { id: toastId });
            router.push('/mockexams/bluebook');
        } catch (error) {
            console.error('Error populating questions:', error);
            toast.error('Failed to populate questions. Ensure there are enough active questions in the bank.', { id: toastId });
        } finally {
            setIsPopulating(false);
        }
    };

    const openManualModule = async (module: any) => {
        setSelectedModule(module);
        setSelectedQuestionIds(module.questions?.map((q: any) => q.id) || []);
        setSetupMode('MANUAL');
        fetchQuestions(module.section_type);
    };

    const fetchQuestions = async (sectionType: string) => {
        setIsSearching(true);
        try {
            const qType = sectionType === 'MATH' ? 'MATH' : 'READING';
            const response = await questionBankApi.getQuestions({
                question_type: qType,
                search: searchQuery,
                limit: 50
            });
            setAvailableQuestions(response.results || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleQuestion = (id: number) => {
        setSelectedQuestionIds(prev =>
            prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
        );
    };

    const saveModuleQuestions = async () => {
        if (!selectedModule) return;
        setIsLoading(true);
        const toastId = toast.loading('Saving module questions...');
        try {
            await bluebookApi.setModuleQuestions(selectedModule.id, selectedQuestionIds);
            toast.success('Module updated successfully!', { id: toastId });

            // Refresh structure
            const structure = await bluebookApi.getExamStructure(createdExamId!);
            setExamStructure(structure);
            setSetupMode('CHOICE');
            setSelectedModule(null);
        } catch (error) {
            console.error('Error saving questions:', error);
            toast.error('Failed to save questions');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Digital SAT Exam</h1>
                            <p className="text-gray-500 dark:text-gray-400">Generates standard DSAT structure with 4 modules.</p>
                        </div>
                        {createdExamId && (
                            <div className="flex items-center space-x-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800">
                                <Check className="h-4 w-4" />
                                <span>Exam ID: {createdExamId}</span>
                            </div>
                        )}
                    </div>

                    {!createdExamId ? (
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 max-w-2xl mx-auto">
                            <div>
                                <label className="block text-sm font-medium mb-1">Exam Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="e.g., October 2025 International Form A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    rows={3}
                                    placeholder="Description of the test focus or origin..."
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Automated Structure</h3>
                                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc">
                                    <li>Reading & Writing Section (64 mins total)</li>
                                    <li>Math Section (70 mins total)</li>
                                    <li>2 adaptive modules per section</li>
                                </ul>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium">Publish exam immediately</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center font-medium"
                                >
                                    {isLoading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                    Create Exam Structure
                                </button>
                            </div>
                        </form>
                    ) : setupMode === 'CHOICE' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900 space-y-6 flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex p-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full mb-4">
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-xl font-bold">Auto-Populate</h2>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Quickly fill all 4 modules with optimal questions from the bank matching DSAT standards (27 per RW, 22 per Math).
                                    </p>
                                </div>
                                <button
                                    onClick={handlePopulate}
                                    disabled={isPopulating}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold"
                                >
                                    {isPopulating ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : 'Run Auto-Generator'}
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900 space-y-6 flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full mb-4">
                                        <Edit2 className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-xl font-bold">Manual Curation</h2>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Individually select questions for each module. Best for specific practice tests or known past papers.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    {examStructure?.sections?.map((section: any) => (
                                        <div key={section.id} className="space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{section.section_type.replace('_', ' ')}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {section.modules.map((module: any) => (
                                                    <button
                                                        key={module.id}
                                                        onClick={() => openManualModule({ ...module, section_type: section.section_type })}
                                                        className="px-3 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:border-blue-200 transition text-left relative"
                                                    >
                                                        M{module.module_order} ({module.questions?.length || 0})
                                                        <Edit2 className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 opacity-30" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-6 flex justify-center">
                                <button
                                    onClick={() => router.push('/mockexams/bluebook')}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg"
                                >
                                    Finish & Go to Lab index
                                </button>
                            </div>
                        </div>
                    ) : setupMode === 'MANUAL' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[70vh]">
                            {/* Manual Header */}
                            <div className="p-6 border-b flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <button onClick={() => setSetupMode('CHOICE')} className="p-2 hover:bg-gray-100 rounded-full transition">
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                    <div>
                                        <h2 className="text-lg font-bold">Curating Module {selectedModule.module_order}</h2>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{selectedModule.section_type.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{selectedQuestionIds.length} / {selectedModule.section_type === 'MATH' ? 22 : 27}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-black">Questions Selected</p>
                                    </div>
                                    <button
                                        onClick={saveModuleQuestions}
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center"
                                    >
                                        {isLoading ? <Loader className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4 mr-2" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* Manual Body */}
                            <div className="flex flex-1 overflow-hidden">
                                {/* Question Selector */}
                                <div className="w-1/2 border-r flex flex-col">
                                    <div className="p-4 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search question text..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchQuestions(selectedModule.section_type)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {isSearching ? (
                                            <div className="flex justify-center py-10"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>
                                        ) : availableQuestions.map(q => {
                                            const isSelected = selectedQuestionIds.includes(q.id);
                                            return (
                                                <div
                                                    key={q.id}
                                                    onClick={() => toggleQuestion(q.id)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 hover:border-slate-200'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{q.category_name || 'Uncategorized'}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.difficulty === 1 ? 'bg-emerald-100 text-emerald-700' : q.difficulty === 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {q.difficulty === 1 ? 'Easy' : q.difficulty === 3 ? 'Hard' : 'Medium'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{q.question_text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Preview / Selected List */}
                                <div className="w-1/2 bg-slate-50 dark:bg-gray-800/50 overflow-y-auto p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center">
                                        <Info className="h-4 w-4 mr-2" /> Current Selection Preview
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedQuestionIds.length === 0 ? (
                                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                                                <p className="text-gray-400 text-sm">No questions selected yet.</p>
                                                <p className="text-[10px] text-gray-300 uppercase font-black mt-2 tracking-widest">Search and click to add</p>
                                            </div>
                                        ) : selectedQuestionIds.map((id, index) => {
                                            const q = availableQuestions.find(aq => aq.id === id) || selectedModule.questions?.find((mq: any) => mq.id === id);
                                            return (
                                                <div key={id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-start space-x-4 group">
                                                    <div className="bg-slate-900 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">{index + 1}</div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{q?.question_text || `Question ID: ${id} (Details pending search)`}</p>
                                                    </div>
                                                    <button onClick={() => toggleQuestion(id)} className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
