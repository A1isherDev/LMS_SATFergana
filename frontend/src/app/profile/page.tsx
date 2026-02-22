'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Settings,
  Save,
  Camera
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, authApi } from '../../utils/api';
import { formatDate } from '../../utils/helpers';

interface StudentProfile {
  sat_exam_date: string | null;
  weak_areas: { [key: string]: number };
  target_sat_score: number;
  estimated_current_score: number;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  grade_level: number;
  target_sat_score: number;
  sat_exam_date: string | null;
  bio: string;
  subscription_end_date?: string | null;
  is_frozen?: boolean;
  assigned_main_teacher_name?: string | null;
}

const ROLE_DISPLAY: Record<string, string> = {
  'ADMIN': 'Administrator',
  'MAIN_TEACHER': 'Main Teacher',
  'SUPPORT_TEACHER': 'Support Teacher',
  'STUDENT': 'Student'
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    date_of_birth: user?.date_of_birth || '',
    grade_level: user?.grade_level || 11,
    target_sat_score: user?.target_sat_score || 1400,
    sat_exam_date: null,
    bio: user?.bio || '',
    subscription_end_date: (user as any)?.subscription_end_date,
    is_frozen: (user as any)?.is_frozen,
    assigned_main_teacher_name: (user as any)?.assigned_main_teacher_name
  });

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (user?.role === 'STUDENT') {
        try {
          const profile = await usersApi.getStudentProfile() as StudentProfile;
          setStudentProfile(profile);
          setProfileData(prev => ({
            ...prev,
            sat_exam_date: profile.sat_exam_date,
            target_sat_score: profile.target_sat_score
          }));
        } catch (error) {
          console.log('Student profile not found:', error);
        }
      }
    };

    fetchStudentProfile();
  }, [user]);

  useEffect(() => {
    if (user && !isEditing) {
      setProfileData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        grade_level: user.grade_level || 11,
        target_sat_score: studentProfile?.target_sat_score || user.target_sat_score || 1400,
        sat_exam_date: studentProfile?.sat_exam_date || null,
        bio: user.bio || '',
        subscription_end_date: (user as any).subscription_end_date,
        is_frozen: (user as any).is_frozen,
        assigned_main_teacher_name: (user as any).assigned_main_teacher_name
      }));
    }
  }, [user, studentProfile, isEditing]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await authApi.updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone_number: profileData.phone_number,
        date_of_birth: profileData.date_of_birth,
        grade_level: profileData.grade_level,
        bio: profileData.bio
      });

      if (user?.role === 'STUDENT') {
        if (profileData.sat_exam_date !== studentProfile?.sat_exam_date) {
          await usersApi.updateExamDate(profileData.sat_exam_date || '');
        }

        await usersApi.updateStudentProfile({
          target_sat_score: profileData.target_sat_score,
          estimated_current_score: studentProfile?.estimated_current_score || 1000,
          weak_areas: studentProfile?.weak_areas || {}
        });
      }

      const updatedUser = await authApi.getUserProfile();
      updateUser(updatedUser as any);

      if (user?.role === 'STUDENT') {
        const updatedProfile = await usersApi.getStudentProfile() as StudentProfile;
        setStudentProfile(updatedProfile);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number | boolean | null) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        grade_level: user.grade_level || 11,
        target_sat_score: studentProfile?.target_sat_score || user.target_sat_score || 1400,
        sat_exam_date: studentProfile?.sat_exam_date || null,
        bio: user.bio || '',
        subscription_end_date: (user as any).subscription_end_date,
        is_frozen: (user as any).is_frozen,
        assigned_main_teacher_name: (user as any).assigned_main_teacher_name
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Student Identity</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Account Profile</h1>
            </div>
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-8 py-4 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Processing...' : 'Sync Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Profile
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Identity Card */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>
                <div className="relative z-10">
                  <div className="inline-block relative mb-6">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-4xl font-black text-white italic shadow-2xl">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    {isEditing && (
                      <button className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-2xl p-3 text-blue-600 shadow-xl border border-slate-100 dark:border-gray-700 hover:scale-110 transition-transform">
                        <Camera className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                    {ROLE_DISPLAY[user.role as string] || user.role}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Verified since {new Date(user.created_at || '').getFullYear()}</p>
                </div>

                {user.role === 'STUDENT' && (
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subscription</span>
                      {profileData.is_frozen ? (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-tight">Account Frozen</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-tight">Active Tier</span>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-gray-700">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Until</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white italic">
                        {profileData.subscription_end_date ? formatDate(profileData.subscription_end_date) : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {user.role === 'SUPPORT_TEACHER' && profileData.assigned_main_teacher_name && (
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-gray-700">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Commanding Officer</span>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Main Teacher</p>
                      <p className="text-sm font-black text-blue-700 dark:text-blue-400 italic">
                        {profileData.assigned_main_teacher_name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-gray-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white italic">{profileData.target_sat_score}</p>
                  </div>
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/20">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Grade</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400 italic">{profileData.grade_level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Configuration */}
            <div className="lg:col-span-2 space-y-12">
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
                <div className="p-10 space-y-12">
                  {/* Sec: Personal Metadata */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-1px flex-1 bg-slate-50 dark:bg-gray-700"></div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Personal Metadata</h3>
                      <div className="h-1px flex-1 bg-slate-50 dark:bg-gray-700"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First ID Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
                          />
                        ) : (
                          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl text-slate-900 dark:text-white font-black italic">{user.first_name}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last ID Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
                          />
                        ) : (
                          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl text-slate-900 dark:text-white font-black italic">{user.last_name}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Verified Email</label>
                        <div className="flex items-center relative group">
                          <Mail className="absolute left-6 h-4 w-4 text-slate-400" />
                          {isEditing ? (
                            <input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
                            />
                          ) : (
                            <div className="w-full pl-16 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl text-slate-900 dark:text-white font-bold opacity-60 italic">{user.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Link</label>
                        <div className="flex items-center relative">
                          <Phone className="absolute left-6 h-4 w-4 text-slate-400" />
                          {isEditing ? (
                            <input
                              type="tel"
                              value={profileData.phone_number}
                              onChange={(e) => handleInputChange('phone_number', e.target.value)}
                              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
                            />
                          ) : (
                            <div className="w-full pl-16 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl text-slate-900 dark:text-white font-bold italic">{user.phone_number || '--'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sec: Academic Matrix */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-1px flex-1 bg-slate-50 dark:bg-gray-700"></div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Academic Profile</h3>
                      <div className="h-1px flex-1 bg-slate-50 dark:bg-gray-700"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {user?.role === 'STUDENT' && (
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Final Exam Date</label>
                          <div className="flex items-center relative">
                            <Calendar className="absolute left-6 h-4 w-4 text-slate-400" />
                            {isEditing ? (
                              <input
                                type="datetime-local"
                                value={profileData.sat_exam_date ? new Date(profileData.sat_exam_date).toISOString().slice(0, 16) : ''}
                                onChange={(e) => handleInputChange('sat_exam_date', e.target.value)}
                                className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
                              />
                            ) : (
                              <div className="w-full pl-16 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl text-slate-900 dark:text-white font-black italic">
                                {studentProfile?.sat_exam_date
                                  ? new Date(studentProfile.sat_exam_date).toLocaleDateString()
                                  : 'Sync Pending'
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Grade Level</label>
                        <div className="flex items-center relative">
                          <BookOpen className="absolute left-6 h-4 w-4 text-slate-400" />
                          {isEditing ? (
                            <select
                              value={profileData.grade_level}
                              onChange={(e) => handleInputChange('grade_level', parseInt(e.target.value))}
                              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white outline-none appearance-none"
                            >
                              {[9, 10, 11, 12].map(grade => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full pl-16 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl text-slate-900 dark:text-white font-black italic">Tier {user.grade_level}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sec: Bio Directive */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-1px flex-1 bg-slate-50 dark:bg-gray-700"></div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Bio Directive</h3>
                      <div className="h-1px flex-1 bg-slate-50 dark:bg-gray-700"></div>
                    </div>

                    <div className="space-y-2">
                      {isEditing ? (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={4}
                          className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white resize-none"
                          placeholder="Input personal statement..."
                        />
                      ) : (
                        <div className="px-8 py-6 bg-slate-50/30 dark:bg-slate-900/10 rounded-[2rem] text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed border border-dashed border-slate-100 dark:border-gray-700">
                          {user.bio || 'About me section not yet filled.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
