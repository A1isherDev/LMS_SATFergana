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
import { usersApi } from '../../utils/api';
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
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
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
    bio: user?.bio || ''
  });

  useEffect(() => {
    // Fetch student profile if user is a student
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

  // Keep form in sync with latest user and studentProfile data when not editing
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
        bio: user.bio || ''
      }));
    }
  }, [user, studentProfile, isEditing]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update basic user profile
      await usersApi.updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone_number: profileData.phone_number,
        date_of_birth: profileData.date_of_birth,
        grade_level: profileData.grade_level,
        bio: profileData.bio
      });
      
      // Update student profile if user is a student
      if (user?.role === 'STUDENT') {
        // Update exam date if it changed
        if (profileData.sat_exam_date !== studentProfile?.sat_exam_date) {
          await usersApi.updateExamDate(profileData.sat_exam_date || '');
        }
        
        // Update other student profile data
        await usersApi.updateStudentProfile({
          target_sat_score: profileData.target_sat_score,
          estimated_current_score: studentProfile?.estimated_current_score || 1000,
          weak_areas: studentProfile?.weak_areas || {}
        });
      }
      
      // Refresh user from backend and update local user context
      if (user) {
        try {
          const updatedUser = await usersApi.getProfile();
          updateUser(updatedUser);
        } catch (err) {
          updateUser({
            ...user,
            ...profileData
          });
        }
      }
      
      // Refresh student profile
      if (user?.role === 'STUDENT') {
        const updatedProfile = await usersApi.getStudentProfile() as StudentProfile;
        setStudentProfile(updatedProfile);
      }
      
      setIsEditing(false);
      // Show success message (you could replace this with a toast notification)
      console.log('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message (you could replace this with a toast notification)
      console.error('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    // Reset to original user data
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
        bio: user.bio || ''
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your personal information and preferences</p>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture & Basic Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-blue-600" />
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700">
                        <Camera className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-gray-600">{user.role === 'STUDENT' ? 'Student' : user.role === 'TEACHER' ? 'Teacher' : 'Admin'}</p>
                  <p className="text-sm text-gray-500 mt-1">Member since {formatDate(user.created_at || '')}</p>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Study Streak</span>
                    <span className="text-sm font-medium text-gray-900">12 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-gray-900">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">SAT Score</span>
                    <span className="text-sm font-medium text-gray-900">1250</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{user.first_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{user.last_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {isEditing ? (
                            <input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {isEditing ? (
                            <input
                              type="tel"
                              value={profileData.phone_number}
                              onChange={(e) => handleInputChange('phone_number', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{user.phone_number || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {isEditing ? (
                            <input
                              type="date"
                              value={profileData.date_of_birth}
                              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{user.date_of_birth ? formatDate(user.date_of_birth) : 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade Level
                        </label>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                          {isEditing ? (
                            <select
                              value={profileData.grade_level}
                              onChange={(e) => handleInputChange('grade_level', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {[9, 10, 11, 12].map(grade => (
                                <option key={grade} value={grade}>Grade {grade}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-gray-900">Grade {user.grade_level || 'Not specified'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                    <div className="space-y-4">
                      {user?.role === 'STUDENT' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SAT Exam Date
                          </label>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {isEditing ? (
                              <input
                                type="datetime-local"
                                value={profileData.sat_exam_date ? new Date(profileData.sat_exam_date).toISOString().slice(0, 16) : ''}
                                onChange={(e) => handleInputChange('sat_exam_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            ) : (
                              <p className="text-gray-900">
                                {studentProfile?.sat_exam_date 
                                  ? new Date(studentProfile.sat_exam_date).toLocaleDateString() + ' at ' + new Date(studentProfile.sat_exam_date).toLocaleTimeString()
                                  : 'Not set'
                                }
                              </p>
                            )}
                          </div>
                          {!isEditing && (
                            <p className="text-xs text-gray-500 mt-1">
                              This date is used for the countdown timer on your dashboard
                            </p>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target SAT Score
                        </label>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-gray-400 mr-2" />
                          {isEditing ? (
                            <input
                              type="number"
                              min="400"
                              max="1600"
                              value={profileData.target_sat_score}
                              onChange={(e) => handleInputChange('target_sat_score', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{studentProfile?.target_sat_score || user.target_sat_score || 'Not set'}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </label>
                        {isEditing ? (
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tell us about yourself..."
                          />
                        ) : (
                          <p className="text-gray-900">{user.bio || 'No bio provided'}</p>
                        )}
                      </div>
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
