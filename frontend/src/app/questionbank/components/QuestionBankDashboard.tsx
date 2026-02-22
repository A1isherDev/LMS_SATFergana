import { useState, useEffect } from 'react';
import {
    BookOpen,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight,
    ChevronRight,
    TrendingUp,
    Brain,
    Calculator,
    PenTool
} from 'lucide-react';
import { TOPIC_HIERARCHY } from '../constants';
import { questionBankApi } from '@/utils/api';

interface QuestionBankDashboardProps {
    onSelectTopic: (subject: string, category: string, skill: string) => void;
    isLoading?: boolean;
}

interface HierarchyCategory {
    name: string;
    count: number;
    skills: string[];
}

interface HierarchyData {
    label: string;
    total_questions: number;
    color: string;
    text_color: string;
    bg_soft: string;
    dark_bg_soft: string;
    categories: HierarchyCategory[];
}

interface TopicCount {
    question_type: string;
    skill_tag: string;
    count: number;
}

export function QuestionBankDashboard({ onSelectTopic, isLoading: parentIsLoading = false }: QuestionBankDashboardProps) {
    const [topicCounts, setTopicCounts] = useState<TopicCount[]>([]);
    const [isLoadingCounts, setIsLoadingCounts] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await questionBankApi.getTopicCounts();
                setTopicCounts(response as any);
            } catch (error) {
                console.error('Failed to fetch topic counts', error);
            } finally {
                setIsLoadingCounts(false);
            }
        };
        fetchCounts();
    }, []);

    const isLoading = parentIsLoading || isLoadingCounts;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-gray-700 animate-pulse">
                        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 mb-8"></div>
                        <div className="space-y-6">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Helper to get count for a specific skill
    const getSkillCount = (subject: string, skill: string) => {
        const countObj = topicCounts.find(t => t.skill_tag === skill);
        return countObj ? countObj.count : 0;
    };

    // Helper to get category count (sum of skills)
    const getCategoryCount = (subject: string, category: HierarchyCategory) => {
        return category.skills.reduce((sum, skill) => sum + getSkillCount(subject, skill), 0);
    };

    // Helper to get total subject count
    const getSubjectCount = (subject: string, data: HierarchyData) => {
        return data.categories.reduce((sum, cat) => sum + getCategoryCount(subject, cat), 0);
    };

    const sections = [
        { key: 'ENGLISH', icon: PenTool, data: TOPIC_HIERARCHY.ENGLISH as HierarchyData },
        { key: 'MATH', icon: Calculator, data: TOPIC_HIERARCHY.MATH as HierarchyData }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sections.map(({ key, icon: Icon, data }) => {
                const totalQuestions = getSubjectCount(key, data);

                return (
                    <div key={key} className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-700">
                        {/* Section Header */}
                        <div className={`p-8 ${data.color} text-white relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Icon className="h-32 w-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">{data.label}</h2>
                                    <div className="px-4 py-1.5 bg-white/20 rounded-full backdrop-blur-sm text-[10px] font-black uppercase tracking-widest">
                                        {totalQuestions} Questions
                                    </div>
                                </div>
                                <p className="text-white/80 font-medium text-sm"> comprehensive coverage</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-10">
                            {data.categories.map((category: HierarchyCategory, idx: number) => {
                                const categoryCount = getCategoryCount(key, category);
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                {category.name}
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
                                                {categoryCount} Q
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {category.skills.map((skill: string, sIdx: number) => {
                                                const skillCount = getSkillCount(key, skill);
                                                return (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => onSelectTopic(key, category.name, skill)}
                                                        className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group/skill flex items-center justify-between border border-transparent hover:border-slate-100 dark:hover:border-gray-700"
                                                    >
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 text-sm group-hover/skill:text-slate-900 dark:group-hover/skill:text-white transition-colors">
                                                            {skill}
                                                        </span>

                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-bold ${skillCount > 0 ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                                {skillCount} available
                                                            </span>
                                                            <ChevronRight className="h-4 w-4 text-slate-300" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
