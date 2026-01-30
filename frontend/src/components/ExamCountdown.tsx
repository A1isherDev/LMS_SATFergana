'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ExamCountdownProps {
  examDate: string | null;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ExamCountdown({ examDate, className = '' }: ExamCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!examDate || !mounted) return;

    const calculateTimeLeft = () => {
      const difference = new Date(examDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [examDate, mounted]);

  if (!mounted) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!examDate) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Days Until Exam</p>
            <p className="text-2xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-500">No exam set</p>
          </div>
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }

  const totalDays = timeLeft.days;
  const urgencyColor = totalDays === 0 ? 'text-red-600' : 
                      totalDays <= 7 ? 'text-red-600' : 
                      totalDays <= 30 ? 'text-orange-600' : 
                      totalDays <= 60 ? 'text-yellow-600' : 'text-green-600';
  
  const urgencyLevel = totalDays === 0 ? 'Exam Day!' : 
                       totalDays <= 7 ? 'Urgent' : 
                       totalDays <= 30 ? 'High Priority' : 
                       totalDays <= 60 ? 'Medium Priority' : 'Low Priority';

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Days Until Exam</p>
          <p className={`text-2xl font-bold ${urgencyColor}`}>
            {totalDays}
          </p>
          <p className="text-xs text-gray-500">{urgencyLevel}</p>
          {totalDays > 0 && (
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
          )}
        </div>
        <Calendar className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );
}
