"""
Views for the rankings app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from apps.rankings.models import Ranking
from apps.rankings.serializers import (
    RankingSerializer,
    RankingListSerializer,
    LeaderboardSerializer,
    LeaderboardEntrySerializer,
    RankingStatsSerializer,
    StudentRankingSummarySerializer,
    RankingUpdateSerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsStudent


class RankingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Ranking model.
    Read-only for all users, with special actions for updates.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['period_type', 'period_start']
    ordering_fields = ['rank', 'total_points', 'created_at']
    ordering = ['rank']
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return Ranking.objects.select_related('student').all()
        elif user.is_teacher:
            return Ranking.objects.select_related('student').all()
        elif user.is_student:
            return Ranking.objects.select_related('student').all()
        else:
            return Ranking.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return RankingListSerializer
        return RankingSerializer
    
    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get current leaderboard for a specific period."""
        period_type = request.query_params.get('period_type', 'WEEKLY')
        limit = int(request.query_params.get('limit', 50))
        
        # Validate period type
        valid_types = ['WEEKLY', 'MONTHLY', 'ALL_TIME']
        if period_type not in valid_types:
            return Response(
                {"detail": f"Invalid period type. Must be one of: {valid_types}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current period dates
        period_start = Ranking.get_period_start(period_type)
        period_end = Ranking.get_period_end(period_type)
        
        # Get rankings for the period
        rankings = Ranking.objects.filter(
            period_type=period_type,
            period_start=period_start
        ).select_related('student').order_by('rank')[:limit]
        
        # If no rankings exist, try to generate them
        if not rankings.exists():
            try:
                rankings = Ranking.update_rankings(period_type, period_start, period_end)
            except Exception as e:
                return Response(
                    {"detail": f"Failed to generate rankings: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Build leaderboard entries
        leaderboard_entries = []
        for ranking in rankings:
            leaderboard_entries.append({
                'student_id': ranking.student.id,
                'student_name': ranking.student.get_full_name() or ranking.student.email,
                'student_email': ranking.student.email,
                'rank': ranking.rank,
                'rank_change': ranking.rank_change,
                'rank_change_display': ranking.rank_change_display,
                'total_points': ranking.total_points,
                'homework_completion_rate': ranking.homework_completion_rate,
                'homework_accuracy': ranking.homework_accuracy,
                'average_sat_score': ranking.average_sat_score,
                'highest_sat_score': ranking.highest_sat_score,
                'mock_exam_count': len(ranking.mock_exam_scores)
            })
        
        leaderboard_data = {
            'period_type': period_type,
            'period_start': period_start,
            'period_end': period_end,
            'total_students': len(leaderboard_entries),
            'leaderboard': leaderboard_entries,
            'generated_at': timezone.now()
        }
        
        serializer = LeaderboardSerializer(leaderboard_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_rankings(self, request):
        """Get current student's rankings across all periods."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their rankings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = request.user
        
        # Get current period dates
        weekly_start = Ranking.get_period_start('WEEKLY')
        monthly_start = Ranking.get_period_start('MONTHLY')
        all_time_start = Ranking.get_period_start('ALL_TIME')
        
        # Get student's rankings
        weekly_ranking = Ranking.objects.filter(
            student=student,
            period_type='WEEKLY',
            period_start=weekly_start
        ).first()
        
        monthly_ranking = Ranking.objects.filter(
            student=student,
            period_type='MONTHLY',
            period_start=monthly_start
        ).first()
        
        all_time_ranking = Ranking.objects.filter(
            student=student,
            period_type='ALL_TIME',
            period_start=all_time_start
        ).first()
        
        # Find best rank
        ranks = []
        if weekly_ranking:
            ranks.append(('Weekly', weekly_ranking.rank))
        if monthly_ranking:
            ranks.append(('Monthly', monthly_ranking.rank))
        if all_time_ranking:
            ranks.append(('All Time', all_time_ranking.rank))
        
        best_rank = min((rank for _, rank in ranks)) if ranks else None
        best_period = next((period for period, rank in ranks if rank == best_rank), None) if ranks else None
        
        # Determine rank trend
        current_rank_trend = 'stable'
        if weekly_ranking and weekly_ranking.rank_change > 0:
            current_rank_trend = 'up'
        elif weekly_ranking and weekly_ranking.rank_change < 0:
            current_rank_trend = 'down'
        
        summary_data = {
            'weekly_ranking': RankingListSerializer(weekly_ranking).data if weekly_ranking else None,
            'monthly_ranking': RankingListSerializer(monthly_ranking).data if monthly_ranking else None,
            'all_time_ranking': RankingListSerializer(all_time_ranking).data if all_time_ranking else None,
            'best_rank': best_rank,
            'best_period': best_period,
            'current_rank_trend': current_rank_trend
        }
        
        serializer = StudentRankingSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get ranking statistics for a specific period."""
        period_type = request.query_params.get('period_type', 'WEEKLY')
        
        # Validate period type
        valid_types = ['WEEKLY', 'MONTHLY', 'ALL_TIME']
        if period_type not in valid_types:
            return Response(
                {"detail": f"Invalid period type. Must be one of: {valid_types}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current period dates
        period_start = Ranking.get_period_start(period_type)
        
        # Get rankings for the period
        rankings = Ranking.objects.filter(
            period_type=period_type,
            period_start=period_start
        ).select_related('student')
        
        if not rankings.exists():
            return Response(
                {"detail": "No rankings available for this period"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate statistics
        total_students = rankings.count()
        avg_points = rankings.aggregate(avg_points=Avg('total_points'))['avg_points'] or 0
        avg_sat_score = sum(r.average_sat_score for r in rankings) / total_students if total_students > 0 else 0
        avg_completion_rate = rankings.aggregate(avg_completion=Avg('homework_completion_rate'))['avg_completion'] or 0
        avg_accuracy = rankings.aggregate(avg_accuracy=Avg('homework_accuracy'))['avg_accuracy'] or 0
        
        # Get top performer
        top_ranking = rankings.first()
        top_performer = {
            'student_name': top_ranking.student.get_full_name() or top_ranking.student.email,
            'student_email': top_ranking.student.email,
            'rank': top_ranking.rank,
            'total_points': top_ranking.total_points,
            'average_sat_score': top_ranking.average_sat_score
        }
        
        stats_data = {
            'total_students': total_students,
            'average_points': round(avg_points, 2),
            'average_sat_score': round(avg_sat_score, 2),
            'average_completion_rate': round(avg_completion_rate, 2),
            'average_accuracy': round(avg_accuracy, 2),
            'top_performer': top_performer,
            'period_type': period_type
        }
        
        serializer = RankingStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_rankings(self, request):
        """Trigger ranking updates (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can update rankings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RankingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        period_type = serializer.validated_data['period_type']
        force_recalculate = serializer.validated_data['force_recalculate']
        
        try:
            # Update rankings
            if force_recalculate:
                # Force recalculation by deleting existing rankings first
                period_start = Ranking.get_period_start(period_type)
                Ranking.objects.filter(
                    period_type=period_type,
                    period_start=period_start
                ).delete()
            
            updated_rankings = Ranking.update_rankings(period_type)
            
            return Response({
                "detail": f"Successfully updated {len(updated_rankings)} rankings for {period_type}",
                "updated_count": len(updated_rankings)
            })
            
        except Exception as e:
            return Response(
                {"detail": f"Failed to update rankings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get ranking history for a specific student or period."""
        student_id = request.query_params.get('student_id')
        period_type = request.query_params.get('period_type', 'WEEKLY')
        limit = int(request.query_params.get('limit', 10))
        
        # Build queryset
        queryset = Ranking.objects.select_related('student')
        
        if student_id:
            if request.user.is_student and str(request.user.id) != student_id:
                return Response(
                    {"detail": "Students can only view their own history"},
                    status=status.HTTP_403_FORBIDDEN
                )
            queryset = queryset.filter(student_id=student_id)
        
        if period_type:
            queryset = queryset.filter(period_type=period_type)
        
        # Get historical rankings
        rankings = queryset.order_by('-period_start')[:limit]
        
        serializer = RankingListSerializer(rankings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_performers(self, request):
        """Get top performers across all periods."""
        period_type = request.query_params.get('period_type', 'WEEKLY')
        count = int(request.query_params.get('count', 10))
        
        # Validate period type
        valid_types = ['WEEKLY', 'MONTHLY', 'ALL_TIME']
        if period_type not in valid_types:
            return Response(
                {"detail": f"Invalid period type. Must be one of: {valid_types}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current period dates
        period_start = Ranking.get_period_start(period_type)
        
        # Get top performers
        top_rankings = Ranking.objects.filter(
            period_type=period_type,
            period_start=period_start
        ).select_related('student').order_by('rank')[:count]
        
        if not top_rankings.exists():
            return Response(
                {"detail": "No rankings available for this period"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        performers = []
        for ranking in top_rankings:
            performers.append({
                'rank': ranking.rank,
                'student_name': ranking.student.get_full_name() or ranking.student.email,
                'student_email': ranking.student.email,
                'total_points': ranking.total_points,
                'average_sat_score': ranking.average_sat_score,
                'homework_completion_rate': ranking.homework_completion_rate,
                'homework_accuracy': ranking.homework_accuracy,
                'rank_change': ranking.rank_change_display
            })
        
        return Response({
            'period_type': period_type,
            'top_performers': performers
        })
