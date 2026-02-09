import React from 'react';
import {
    Users,
    BookOpen,
    FileText,
    Award,
    Clock,
    PlusCircle,
    Calendar,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TeacherDashboardProps {
    stats: {
        classesCount: number;
        totalStudents: number;
        homeworkAssigned: number;
        homeworkPublished: number;
        pendingSubmissions: number;
        averageClassScore: number;
        recentClasses?: Array<{
            id: number;
            name: string;
            student_count: number;
            max_students: number;
        }>;
    };
}

export default function TeacherDashboard({ stats }: TeacherDashboardProps) {
    const router = useRouter();

    const cards = [
        {
            title: 'Active Classes',
            value: stats.classesCount,
            icon: <Calendar className="h-8 w-8 text-blue-500" />,
            footer: 'Across all subjects',
            color: 'bg-blue-50',
            onClick: () => router.push('/classes')
        },
        {
            title: 'Total Students',
            value: stats.totalStudents,
            icon: <Users className="h-8 w-8 text-purple-500" />,
            footer: 'Enrolled in your classes',
            color: 'bg-purple-50'
        },
        {
            title: 'Pending Reviews',
            value: stats.pendingSubmissions,
            icon: <Clock className="h-8 w-8 text-orange-500" />,
            footer: 'Submissions to grade',
            color: 'bg-orange-50',
            highlight: stats.pendingSubmissions > 0,
            onClick: () => router.push('/homework?filter=pending')
        },
        {
            title: 'Avg. Accuracy',
            value: `${stats.averageClassScore}%`,
            icon: <Award className="h-8 w-8 text-green-500" />,
            footer: 'Class performance',
            color: 'bg-green-50'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-card rounded-xl shadow-sm border border-border p-6 ${card.highlight ? 'ring-2 ring-orange-500' : ''} ${card.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={card.onClick}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${card.color} dark:bg-opacity-10`}>
                                {card.icon}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold text-foreground">{card.value}</span>
                            <span className="text-xs text-muted-foreground mt-1">{card.footer}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h3 className="text-lg font-bold text-foreground mb-6">Teaching Controls</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push('/homework/bulk-create')}
                            className="group flex items-center p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-900/30"
                        >
                            <div className="p-3 bg-card rounded-lg shadow-sm mr-4 group-hover:scale-110 transition-transform">
                                <PlusCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-indigo-900 dark:text-indigo-200">Bulk Homework</p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-400">Assign multiple tasks</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/classes')}
                            className="group flex items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all border border-emerald-100 dark:border-emerald-900/30"
                        >
                            <div className="p-3 bg-card rounded-lg shadow-sm mr-4 group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-emerald-900 dark:text-emerald-200">Manage Classes</p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">Profiles & Enrollment</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/homework')}
                            className="group flex items-center p-4 bg-sky-50 dark:bg-sky-900/10 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/20 transition-all border border-sky-100 dark:border-sky-900/30"
                        >
                            <div className="p-3 bg-card rounded-lg shadow-sm mr-4 group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-sky-900 dark:text-sky-200">Review Work</p>
                                <p className="text-xs text-sky-700 dark:text-sky-400">Grade submissions</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/analytics')}
                            className="group flex items-center p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all border border-rose-100 dark:border-rose-900/30"
                        >
                            <div className="p-3 bg-card rounded-lg shadow-sm mr-4 group-hover:scale-110 transition-transform">
                                <Award className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-rose-900 dark:text-rose-200">Class Progress</p>
                                <p className="text-xs text-rose-700 dark:text-rose-400">Detailed analytics</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Management Summary */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h3 className="text-lg font-bold text-foreground mb-6">Assigned Content</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center">
                                <BookOpen className="h-5 w-5 text-muted-foreground mr-3" />
                                <span className="text-sm font-medium text-foreground opacity-80">Total Homework Sets</span>
                            </div>
                            <span className="text-lg font-bold text-foreground">{stats.homeworkAssigned}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-400">Published Assignments</span>
                            </div>
                            <span className="text-lg font-bold text-green-700 dark:text-green-300">{stats.homeworkPublished}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-xl">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-amber-500 mr-3" />
                                <span className="text-sm font-medium text-amber-800 dark:text-amber-400">Draft Assignments</span>
                            </div>
                            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.homeworkAssigned - stats.homeworkPublished}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Classes section */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">Recent Classes</h3>
                    <button
                        onClick={() => router.push('/classes')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                        View All <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.recentClasses && stats.recentClasses.length > 0 ? (
                        stats.recentClasses.map((cls) => (
                            <div
                                key={cls.id}
                                className="group p-4 bg-muted/30 rounded-xl border border-border hover:border-indigo-400/50 hover:bg-indigo-50/10 transition-all cursor-pointer"
                                onClick={() => router.push(`/classes/${cls.id}`)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <h4 className="font-bold text-foreground mb-1">{cls.name}</h4>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Users className="h-3 w-3 mr-1" />
                                    <span>{cls.student_count} / {cls.max_students} Students</span>
                                </div>
                                <div className="mt-4 w-full bg-muted rounded-full h-1.5">
                                    <div
                                        className="bg-indigo-500 h-1.5 rounded-full"
                                        style={{ width: `${(cls.student_count / cls.max_students) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-10 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                            <p className="text-sm text-muted-foreground italic">No active classes found.</p>
                            <button
                                onClick={() => router.push('/classes')}
                                className="mt-2 text-sm text-indigo-600 font-medium hover:underline"
                            >
                                Set up your first class
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
