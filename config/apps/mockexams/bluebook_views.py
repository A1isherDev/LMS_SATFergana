"""
Bluebook-style analytics and performance views for mockexams app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.db.models import Q, Count, Avg, StdDev, Max, Min
from django.utils import timezone
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from datetime import timedelta, datetime
import json

from apps.mockexams.models import MockExam, MockExamAttempt
from apps.mockexams.serializers import (
    MockExamStatsSerializer,
    StudentMockExamProgressSerializer
)
from apps.common.permissions import IsStudent, IsTeacherOrAdmin


class ExamAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for Bluebook-style exam analytics and insights.
    """
    permission_classes = [IsStudent]

    @extend_schema(
        summary="Get performance trends",
        description="Get student's performance trends over time with various metrics.",
        tags=["Mock Exams Analytics"],
        parameters=[
            OpenApiParameter(
                name='time_range',
                type=str,
                enum=['week', 'month', 'quarter', 'year'],
                description='Time range for trend analysis',
                required=False
            ),
            OpenApiParameter(
                name='exam_type',
                type=str,
                enum=['FULL', 'MATH_ONLY', 'READING_WRITING_ONLY'],
                description='Filter by exam type',
                required=False
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def performance_trends(self, request):
        """Get performance trends for the current student."""
        user = request.user
        time_range = request.query_params.get('time_range', 'month')
        exam_type = request.query_params.get('exam_type')

        # Calculate date range
        now = timezone.now()
        if time_range == 'week':
            start_date = now - timedelta(days=7)
        elif time_range == 'month':
            start_date = now - timedelta(days=30)
        elif time_range == 'quarter':
            start_date = now - timedelta(days=90)
        else:  # year
            start_date = now - timedelta(days=365)

        # Get attempts in the time range
        queryset = MockExamAttempt.objects.filter(
            student=user,
            started_at__gte=start_date,
            is_completed=True
        )

        if exam_type:
            queryset = queryset.filter(mock_exam__exam_type=exam_type)

        attempts = queryset.order_by('started_at')

        # Calculate trends
        trend_data = []
        for attempt in attempts:
            trend_data.append({
                'date': attempt.started_at.strftime('%Y-%m-%d'),
                'total_score': attempt.sat_score or 0,
                'math_score': attempt.math_scaled_score or 0,
                'reading_score': attempt.reading_scaled_score or 0,
                'writing_score': attempt.writing_scaled_score or 0,
                'exam_type': attempt.mock_exam.exam_type,
                'time_spent': int(attempt.duration_seconds),
                'accuracy': self._calculate_accuracy(attempt)
            })

        return Response({
            'trends': trend_data,
            'summary': self._calculate_trend_summary(trend_data)
        })

    @extend_schema(
        summary="Get weak areas analysis",
        description="Get detailed analysis of student's weak areas and improvement recommendations.",
        tags=["Mock Exams Analytics"]
    )
    @action(detail=False, methods=['get'])
    def weak_areas(self, request):
        """Get weak areas analysis for the current student."""
        user = request.user

        # Get completed attempts
        attempts = MockExamAttempt.objects.filter(
            student=user,
            is_completed=True
        ).order_by('-started_at')[:10]  # Last 10 attempts

        weak_areas = []
        
        # Analyze by section
        for section in ['math', 'reading', 'writing']:
            section_performance = self._analyze_section_performance(attempts, section)
            if section_performance['accuracy'] < 70:  # Less than 70% accuracy
                weak_areas.append({
                    'section': section,
                    'accuracy': section_performance['accuracy'],
                    'total_questions': section_performance['total_questions'],
                    'correct_answers': section_performance['correct_answers'],
                    'priority': 'high' if section_performance['accuracy'] < 50 else 'medium',
                    'recommendations': self._get_section_recommendations(section, section_performance)
                })

        # Sort by priority and accuracy
        weak_areas.sort(key=lambda x: (x['priority'], x['accuracy']))

        return Response({
            'weak_areas': weak_areas,
            'overall_analysis': self._get_overall_weak_areas_analysis(attempts)
        })

    @extend_schema(
        summary="Get comparative analysis",
        description="Get comparative analysis against peer group and historical performance.",
        tags=["Mock Exams Analytics"],
        parameters=[
            OpenApiParameter(
                name='exam_id',
                type=int,
                description='Specific exam ID for analysis',
                required=False
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def comparative_analysis(self, request):
        """Get comparative analysis for the current student."""
        user = request.user
        exam_id = request.query_params.get('exam_id')

        if exam_id:
            # Analysis for specific exam
            try:
                exam = MockExam.objects.get(id=exam_id)
                attempts = MockExamAttempt.objects.filter(
                    mock_exam=exam,
                    is_completed=True
                )
            except MockExam.DoesNotExist:
                return Response(
                    {"detail": "Exam not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Overall analysis
            attempts = MockExamAttempt.objects.filter(
                student=user,
                is_completed=True
            )

        # Get peer group data (same class/school if available)
        peer_attempts = MockExamAttempt.objects.filter(
            is_completed=True
        ).exclude(student=user)

        # Calculate comparative metrics
        student_stats = self._calculate_student_stats(attempts)
        peer_stats = self._calculate_peer_stats(peer_attempts)

        return Response({
            'student_performance': student_stats,
            'peer_comparison': peer_stats,
            'percentiles': self._calculate_percentiles(student_stats, peer_stats),
            'improvement_potential': self._calculate_improvement_potential(student_stats, peer_stats)
        })

    @extend_schema(
        summary="Get score prediction",
        description="Get AI-powered score prediction based on current performance trends.",
        tags=["Mock Exams Analytics"],
        parameters=[
            OpenApiParameter(
                name='target_date',
                type=str,
                description='Target date for prediction (YYYY-MM-DD)',
                required=False
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def score_prediction(self, request):
        """Get score prediction based on performance trends."""
        user = request.user
        target_date_str = request.query_params.get('target_date')

        # Get recent performance data
        recent_attempts = MockExamAttempt.objects.filter(
            student=user,
            is_completed=True
        ).order_by('-started_at')[:20]

        if len(recent_attempts) < 3:
            return Response({
                'prediction': None,
                'message': 'Insufficient data for prediction. Need at least 3 completed exams.',
                'confidence': 0
            })

        # Calculate trend and predict
        prediction_data = self._predict_scores(recent_attempts, target_date_str)

        return Response(prediction_data)

    @extend_schema(
        summary="Get adaptive recommendations",
        description="Get personalized study recommendations based on performance analysis.",
        tags=["Mock Exams Analytics"]
    )
    @action(detail=False, methods=['get'])
    def adaptive_recommendations(self, request):
        """Get adaptive study recommendations."""
        user = request.user

        # Get performance data
        attempts = MockExamAttempt.objects.filter(
            student=user,
            is_completed=True
        ).order_by('-started_at')

        if not attempts.exists():
            return Response({
                'recommendations': [],
                'message': 'No completed exams found for recommendations.'
            })

        # Generate recommendations
        recommendations = self._generate_adaptive_recommendations(attempts)

        return Response({
            'recommendations': recommendations,
            'focus_areas': self._identify_focus_areas(attempts),
            'study_plan': self._generate_study_plan(attempts)
        })

    def _calculate_accuracy(self, attempt):
        """Calculate accuracy percentage for an attempt."""
        if not attempt.total_raw_score or not attempt.mock_exam:
            return 0
        
        total_questions = attempt.mock_exam.total_questions
        if total_questions == 0:
            return 0
        
        return round((attempt.total_raw_score / total_questions) * 100, 2)

    def _calculate_trend_summary(self, trend_data):
        """Calculate summary statistics from trend data."""
        if not trend_data:
            return {}

        scores = [item['total_score'] for item in trend_data]
        
        return {
            'average_score': round(sum(scores) / len(scores), 2),
            'highest_score': max(scores),
            'lowest_score': min(scores),
            'score_improvement': scores[-1] - scores[0] if len(scores) > 1 else 0,
            'average_accuracy': round(sum(item['accuracy'] for item in trend_data) / len(trend_data), 2),
            'total_exams': len(trend_data)
        }

    def _analyze_section_performance(self, attempts, section):
        """Analyze performance for a specific section."""
        total_questions = 0
        correct_answers = 0
        
        for attempt in attempts:
            if section == 'math':
                total_questions += attempt.mock_exam.math_questions.count() if attempt.mock_exam else 0
                correct_answers += attempt.math_raw_score or 0
            elif section == 'reading':
                total_questions += attempt.mock_exam.reading_questions.count() if attempt.mock_exam else 0
                correct_answers += attempt.reading_raw_score or 0
            elif section == 'writing':
                total_questions += attempt.mock_exam.writing_questions.count() if attempt.mock_exam else 0
                correct_answers += attempt.writing_raw_score or 0

        accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        return {
            'section': section,
            'total_questions': total_questions,
            'correct_answers': correct_answers,
            'accuracy': round(accuracy, 2)
        }

    def _get_section_recommendations(self, section, performance):
        """Get recommendations for improving section performance."""
        recommendations = []

        if section == 'math':
            if performance['accuracy'] < 50:
                recommendations.extend([
                    'Focus on fundamental algebra concepts',
                    'Practice basic arithmetic operations',
                    'Review geometry formulas and theorems'
                ])
            else:
                recommendations.extend([
                    'Work on advanced problem-solving strategies',
                    'Practice time management for complex problems',
                    'Review data analysis and statistics'
                ])
        elif section == 'reading':
            recommendations.extend([
                'Practice active reading techniques',
                'Focus on vocabulary building',
                'Work on passage analysis strategies'
            ])
        elif section == 'writing':
            recommendations.extend([
                'Review grammar rules and conventions',
                'Practice essay structure and organization',
                'Work on sentence clarity and conciseness'
            ])

        return recommendations

    def _get_overall_weak_areas_analysis(self, attempts):
        """Get overall weak areas analysis."""
        if not attempts:
            return {}

        # Calculate overall metrics
        avg_score = attempts.aggregate(Avg('sat_score'))['sat_score__avg'] or 0
        avg_math = attempts.aggregate(Avg('math_scaled_score'))['math_scaled_score__avg'] or 0
        avg_reading = attempts.aggregate(Avg('reading_scaled_score'))['reading_scaled_score__avg'] or 0
        avg_writing = attempts.aggregate(Avg('writing_scaled_score'))['writing_scaled_score__avg'] or 0

        # Identify weakest section
        section_scores = {
            'Math': avg_math,
            'Reading': avg_reading,
            'Writing': avg_writing
        }
        weakest_section = min(section_scores, key=section_scores.get)

        return {
            'average_score': round(avg_score, 2),
            'section_averages': section_scores,
            'weakest_section': weakest_section,
            'improvement_needed': 1200 - avg_score if avg_score < 1200 else 0,
            'study_focus': self._get_study_focus(section_scores)
        }

    def _calculate_student_stats(self, attempts):
        """Calculate student performance statistics."""
        if not attempts.exists():
            return {}

        return {
            'average_score': attempts.aggregate(Avg('sat_score'))['sat_score__avg'] or 0,
            'highest_score': attempts.aggregate(Max('sat_score'))['sat_score__max'] or 0,
            'lowest_score': attempts.aggregate(Min('sat_score'))['sat_score__min'] or 0,
            'score_std_dev': attempts.aggregate(StdDev('sat_score'))['sat_score__stddev'] or 0,
            'total_exams': attempts.count(),
            'average_time': attempts.aggregate(Avg('duration_seconds'))['duration_seconds__avg'] or 0
        }

    def _calculate_peer_stats(self, attempts):
        """Calculate peer group statistics."""
        if not attempts.exists():
            return {}

        return {
            'peer_average': attempts.aggregate(Avg('sat_score'))['sat_score__avg'] or 0,
            'peer_highest': attempts.aggregate(Max('sat_score'))['sat_score__max'] or 0,
            'peer_lowest': attempts.aggregate(Min('sat_score'))['sat_score__min'] or 0,
            'peer_std_dev': attempts.aggregate(StdDev('sat_score'))['sat_score__stddev'] or 0,
            'total_peer_exams': attempts.count()
        }

    def _calculate_percentiles(self, student_stats, peer_stats):
        """Calculate percentile rankings."""
        if not student_stats or not peer_stats:
            return {}

        student_score = student_stats.get('average_score', 0)
        peer_avg = peer_stats.get('peer_average', 0)
        peer_std = peer_stats.get('peer_std_dev', 1)

        # Simple percentile calculation using z-score
        if peer_std > 0:
            z_score = (student_score - peer_avg) / peer_std
            percentile = max(0, min(100, 50 + z_score * 20))  # Rough approximation
        else:
            percentile = 50

        return {
            'overall_percentile': round(percentile, 2),
            'performance_rating': self._get_performance_rating(percentile)
        }

    def _get_performance_rating(self, percentile):
        """Get performance rating based on percentile."""
        if percentile >= 90:
            return 'Excellent'
        elif percentile >= 75:
            return 'Good'
        elif percentile >= 50:
            return 'Average'
        elif percentile >= 25:
            return 'Below Average'
        else:
            return 'Needs Improvement'

    def _calculate_improvement_potential(self, student_stats, peer_stats):
        """Calculate improvement potential."""
        if not student_stats or not peer_stats:
            return {}

        current_score = student_stats.get('average_score', 0)
        peer_average = peer_stats.get('peer_average', 0)
        peer_highest = peer_stats.get('peer_highest', 0)

        return {
            'potential_improvement': peer_highest - current_score,
            'gap_to_average': peer_average - current_score,
            'realistic_target': min(current_score + 100, peer_highest),
            'time_to_target': self._estimate_time_to_target(current_score, peer_average)
        }

    def _estimate_time_to_target(self, current_score, target_score):
        """Estimate time needed to reach target score."""
        if current_score >= target_score:
            return 'Target reached'
        
        gap = target_score - current_score
        # Rough estimate: 10 points improvement per month of consistent study
        months_needed = gap / 10
        
        if months_needed <= 1:
            return '1 month'
        elif months_needed <= 3:
            return '2-3 months'
        elif months_needed <= 6:
            return '4-6 months'
        else:
            return '6+ months'

    def _predict_scores(self, attempts, target_date_str):
        """Predict future scores based on trends."""
        scores = [attempt.sat_score for attempt in attempts if attempt.sat_score]
        
        if len(scores) < 3:
            return {
                'prediction': None,
                'confidence': 0,
                'message': 'Insufficient data for prediction'
            }

        # Simple linear regression for trend
        x = list(range(len(scores)))
        n = len(scores)
        
        # Calculate slope (trend)
        sum_x = sum(x)
        sum_y = sum(scores)
        sum_xy = sum(x[i] * scores[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        intercept = (sum_y - slope * sum_x) / n

        # Predict next score
        next_x = n
        predicted_score = round(slope * next_x + intercept)
        
        # Calculate confidence based on trend consistency
        recent_trend = scores[-3:] if len(scores) >= 3 else scores
        trend_consistency = 1 - (max(recent_trend) - min(recent_trend)) / (sum(recent_trend) / len(recent_trend))
        confidence = round(max(0.3, min(0.9, trend_consistency)) * 100, 2)

        return {
            'predicted_score': max(400, min(1600, predicted_score)),
            'confidence': confidence,
            'trend': 'improving' if slope > 5 else 'declining' if slope < -5 else 'stable',
            'recommendations': self._get_prediction_recommendations(slope, predicted_score)
        }

    def _get_prediction_recommendations(self, slope, predicted_score):
        """Get recommendations based on prediction."""
        recommendations = []

        if slope < -5:
            recommendations.append('Focus on fundamentals - your scores are declining')
        elif slope > 5:
            recommendations.append('Great progress! Maintain your current study routine')
        
        if predicted_score < 1000:
            recommendations.append('Consider increasing study time and focusing on weak areas')
        elif predicted_score >= 1200:
            recommendations.append('Focus on advanced topics and time management')

        return recommendations

    def _generate_adaptive_recommendations(self, attempts):
        """Generate adaptive study recommendations."""
        recommendations = []
        
        # Analyze recent performance
        recent_attempts = attempts[:5]
        if not recent_attempts:
            return recommendations

        avg_score = sum(attempt.sat_score for attempt in recent_attempts if attempt.sat_score) / len(recent_attempts)
        
        # Score-based recommendations
        if avg_score < 1000:
            recommendations.extend([
                {
                    'type': 'foundation',
                    'priority': 'high',
                    'title': 'Build Core Skills',
                    'description': 'Focus on fundamental concepts and basic problem-solving techniques',
                    'actions': ['Review basic math operations', 'Practice grammar rules', 'Improve reading comprehension']
                }
            ])
        elif avg_score < 1200:
            recommendations.extend([
                {
                    'type': 'intermediate',
                    'priority': 'medium',
                    'title': 'Strengthen Weak Areas',
                    'description': 'Identify and improve specific weak areas while maintaining strengths',
                    'actions': ['Take diagnostic tests', 'Focus on time management', 'Practice advanced problems']
                }
            ])
        else:
            recommendations.extend([
                {
                    'type': 'advanced',
                    'priority': 'low',
                    'title': 'Optimize Performance',
                    'description': 'Fine-tune strategies and tackle the most challenging problems',
                    'actions': ['Practice with time constraints', 'Review complex passages', 'Master calculator usage']
                }
            ])

        return recommendations

    def _identify_focus_areas(self, attempts):
        """Identify areas that need focus."""
        focus_areas = []
        
        # Analyze section performance
        section_performance = {}
        for section in ['math', 'reading', 'writing']:
            perf = self._analyze_section_performance(attempts, section)
            section_performance[section] = perf['accuracy']
            
            if perf['accuracy'] < 70:
                focus_areas.append({
                    'area': section.title(),
                    'accuracy': perf['accuracy'],
                    'priority': 'high' if perf['accuracy'] < 50 else 'medium',
                    'description': f'Improve {section.title()} performance from {perf["accuracy"]}% to 70%+'
                })

        return focus_areas

    def _generate_study_plan(self, attempts):
        """Generate personalized study plan."""
        if not attempts.exists():
            return {}

        # Calculate current level
        avg_score = attempts.aggregate(Avg('sat_score'))['sat_score__avg'] or 0
        
        plan = {
            'current_level': self._get_level_description(avg_score),
            'target_level': self._get_target_level(avg_score),
            'weekly_goals': self._get_weekly_goals(avg_score),
            'daily_tasks': self._get_daily_tasks(avg_score),
            'milestones': self._get_milestones(avg_score)
        }

        return plan

    def _get_level_description(self, score):
        """Get level description based on score."""
        if score < 1000:
            return 'Beginner'
        elif score < 1200:
            return 'Intermediate'
        elif score < 1400:
            return 'Advanced'
        else:
            return 'Expert'

    def _get_target_level(self, current_score):
        """Get target level based on current score."""
        if current_score < 1000:
            return 'Intermediate (1000-1200)'
        elif current_score < 1200:
            return 'Advanced (1200-1400)'
        elif current_score < 1400:
            return 'Expert (1400-1600)'
        else:
            return 'Perfect Score (1500-1600)'

    def _get_weekly_goals(self, score):
        """Get weekly study goals based on score level."""
        if score < 1000:
            return [
                'Complete 2 practice sections',
                'Review 50 vocabulary words',
                'Practice 30 math problems',
                'Read 3 passages daily'
            ]
        elif score < 1200:
            return [
                'Complete 1 full practice test',
                'Focus on weak areas',
                'Practice timed sections',
                'Review mistakes thoroughly'
            ]
        else:
            return [
                'Complete 2 full practice tests',
                'Focus on timing strategies',
                'Practice advanced problems',
                'Perfect calculator usage'
            ]

    def _get_daily_tasks(self, score):
        """Get daily study tasks based on score level."""
        if score < 1000:
            return [
                '30 minutes math practice',
                '20 minutes vocabulary',
                '15 minutes reading practice'
            ]
        elif score < 1200:
            return [
                '45 minutes focused practice',
                '15 minutes review mistakes',
                '10 minutes vocabulary'
            ]
        else:
            return [
                '60 minutes advanced practice',
                '30 minutes timed sections',
                '15 minutes strategy review'
            ]

    def _get_milestones(self, score):
        """Get study milestones based on current score."""
        milestones = []
        
        if score < 1000:
            milestones.extend([
                {'score': 1000, 'description': 'Reach Intermediate Level', 'timeline': '2-3 months'},
                {'score': 1100, 'description': 'Build Consistency', 'timeline': '4-5 months'}
            ])
        elif score < 1200:
            milestones.extend([
                {'score': 1200, 'description': 'Reach Advanced Level', 'timeline': '2-3 months'},
                {'score': 1300, 'description': 'Strong Performance', 'timeline': '4-6 months'}
            ])
        elif score < 1400:
            milestones.extend([
                {'score': 1400, 'description': 'Expert Level', 'timeline': '3-4 months'},
                {'score': 1500, 'description': 'Top Performer', 'timeline': '5-6 months'}
            ])
        else:
            milestones.extend([
                {'score': 1550, 'description': 'Near Perfect', 'timeline': '2-3 months'},
                {'score': 1600, 'description': 'Perfect Score', 'timeline': '4-6 months'}
            ])

        return milestones

    def _get_study_focus(self, section_scores):
        """Get overall study focus based on section scores."""
        weakest = min(section_scores, key=section_scores.get)
        strongest = max(section_scores, key=section_scores.get)
        
        focus = f"Primary focus on {weakest} section"
        if section_scores[weakest] < 600:
            focus += " (urgent improvement needed)"
        
        return focus


class ExamPerformanceViewSet(viewsets.ViewSet):
    """
    ViewSet for exam performance tracking and real-time metrics.
    """
    permission_classes = [IsStudent]

    @extend_schema(
        summary="Get real-time performance metrics",
        description="Get real-time performance metrics during an active exam session.",
        tags=["Mock Exams Performance"]
    )
    @action(detail=False, methods=['get'])
    def real_time_metrics(self, request):
        """Get real-time performance metrics for active exam."""
        user = request.user
        
        # Get active attempt
        active_attempt = MockExamAttempt.objects.filter(
            student=user,
            is_completed=False
        ).first()

        if not active_attempt:
            return Response({
                'active_session': False,
                'message': 'No active exam session found'
            })

        # Calculate real-time metrics
        metrics = self._calculate_real_time_metrics(active_attempt)
        
        return Response({
            'active_session': True,
            'attempt_id': active_attempt.id,
            'exam_title': active_attempt.mock_exam.title,
            'metrics': metrics
        })

    @extend_schema(
        summary="Save question response",
        description="Save response to a specific question during an exam.",
        tags=["Mock Exams Performance"]
    )
    @action(detail=False, methods=['post'])
    def save_response(self, request):
        """Save question response in real-time."""
        user = request.user
        data = request.data

        # Get active attempt
        active_attempt = MockExamAttempt.objects.filter(
            student=user,
            is_completed=False
        ).first()

        if not active_attempt:
            return Response(
                {"detail": "No active exam session found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save response
        question_id = data.get('question_id')
        answer = data.get('answer')
        time_spent = data.get('time_spent_seconds', 0)
        marked_for_review = data.get('marked_for_review', False)

        if not question_id or not answer:
            return Response(
                {"detail": "question_id and answer are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update answers
        if not active_attempt.answers:
            active_attempt.answers = {}
        
        # Determine section from question
        section = self._get_question_section(question_id, active_attempt.mock_exam)
        if section not in active_attempt.answers:
            active_attempt.answers[section] = {}
        
        active_attempt.answers[section][str(question_id)] = answer

        # Update time spent
        if not active_attempt.time_spent_by_section:
            active_attempt.time_spent_by_section = {}
        
        if section in active_attempt.time_spent_by_section:
            active_attempt.time_spent_by_section[section] += time_spent
        else:
            active_attempt.time_spent_by_section[section] = time_spent

        active_attempt.save()

        return Response({
            'saved': True,
            'section_progress': active_attempt.get_section_progress(section),
            'overall_progress': active_attempt.get_overall_progress()
        })

    @extend_schema(
        summary="Get remaining time",
        description="Get remaining time for current exam session.",
        tags=["Mock Exams Performance"]
    )
    @action(detail=False, methods=['get'])
    def remaining_time(self, request):
        """Get remaining time for active exam."""
        user = request.user
        
        # Get active attempt
        active_attempt = MockExamAttempt.objects.filter(
            student=user,
            is_completed=False
        ).first()

        if not active_attempt:
            return Response({
                'active_session': False,
                'message': 'No active exam session found'
            })

        # Calculate remaining time
        elapsed_time = (timezone.now() - active_attempt.started_at).total_seconds()
        total_time = active_attempt.mock_exam.total_time_seconds
        remaining_time = max(0, total_time - elapsed_time)

        return Response({
            'active_session': True,
            'remaining_time_seconds': int(remaining_time),
            'elapsed_time_seconds': int(elapsed_time),
            'total_time_seconds': total_time,
            'time_percentage': round((elapsed_time / total_time) * 100, 2)
        })

    @extend_schema(
        summary="Pause exam session",
        description="Pause the current exam session.",
        tags=["Mock Exams Performance"]
    )
    @action(detail=False, methods=['post'])
    def pause_session(self, request):
        """Pause current exam session."""
        user = request.user
        
        # Get active attempt
        active_attempt = MockExamAttempt.objects.filter(
            student=user,
            is_completed=False
        ).first()

        if not active_attempt:
            return Response(
                {"detail": "No active exam session found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Store pause time in session or separate model
        # For now, just return success
        return Response({
            'paused': True,
            'message': 'Exam session paused successfully'
        })

    @extend_schema(
        summary="Resume exam session",
        description="Resume a paused exam session.",
        tags=["Mock Exams Performance"]
    )
    @action(detail=False, methods=['post'])
    def resume_session(self, request):
        """Resume paused exam session."""
        user = request.user
        
        # Get active attempt
        active_attempt = MockExamAttempt.objects.filter(
            student=user,
            is_completed=False
        ).first()

        if not active_attempt:
            return Response(
                {"detail": "No active exam session found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'resumed': True,
            'message': 'Exam session resumed successfully'
        })

    def _calculate_real_time_metrics(self, attempt):
        """Calculate real-time performance metrics."""
        metrics = {
            'section_progress': {},
            'overall_progress': attempt.get_overall_progress(),
            'time_elapsed': int(attempt.duration_seconds),
            'questions_answered': 0,
            'accuracy': 0
        }

        total_answered = 0
        total_correct = 0

        for section in ['math', 'reading', 'writing']:
            progress = attempt.get_section_progress(section)
            metrics['section_progress'][section] = progress
            
            # Count answered questions
            if attempt.answers and section in attempt.answers:
                section_answered = len(attempt.answers[section])
                total_answered += section_answered

                # Calculate accuracy (simplified - would need correct answers)
                # For now, just track answered count
                metrics['questions_answered'] = total_answered

        return metrics

    def _get_question_section(self, question_id, mock_exam):
        """Determine which section a question belongs to."""
        # Check if question is in math section
        if mock_exam.math_questions.filter(id=question_id).exists():
            return 'math'
        elif mock_exam.reading_questions.filter(id=question_id).exists():
            return 'reading'
        elif mock_exam.writing_questions.filter(id=question_id).exists():
            return 'writing'
        
        # Default fallback
        return 'math'
