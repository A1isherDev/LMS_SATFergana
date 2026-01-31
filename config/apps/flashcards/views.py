"""
Views for the flashcards app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from apps.flashcards.models import Flashcard, FlashcardProgress
from apps.flashcards.serializers import (
    FlashcardSerializer,
    FlashcardListSerializer,
    FlashcardProgressSerializer,
    FlashcardProgressDetailSerializer,
    FlashcardReviewSerializer,
    FlashcardStatsSerializer,
    StudentFlashcardProgressSerializer,
    FlashcardBatchReviewSerializer,
    FlashcardCreateSerializer
)
from apps.common.permissions import IsTeacherOrAdmin, IsStudent


class FlashcardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Flashcard model.
    Different access levels for teachers/admins vs students.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['difficulty', 'part_of_speech', 'is_active']
    search_fields = ['word', 'definition', 'example_sentence']
    
    @extend_schema(
        summary="List flashcards",
        description="Retrieve a list of vocabulary flashcards based on user role and filters. Admins/teachers see all, students see only active flashcards.",
        tags=["Flashcards"],
        parameters=[
            OpenApiParameter(
                name='difficulty',
                type=OpenApiTypes.STR,
                enum=['EASY', 'MEDIUM', 'HARD'],
                description='Filter by difficulty level',
                required=False
            ),
            OpenApiParameter(
                name='part_of_speech',
                type=OpenApiTypes.STR,
                enum=['NOUN', 'VERB', 'ADJECTIVE', 'ADVERB'],
                description='Filter by part of speech',
                required=False
            )
        ]
    )
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return Flashcard.objects.all()
        elif user.is_teacher:
            return Flashcard.objects.all()
        elif user.is_student:
            return Flashcard.objects.filter(is_active=True)
        else:
            return Flashcard.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return FlashcardListSerializer
        elif self.action == 'create':
            return FlashcardCreateSerializer
        return FlashcardSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @extend_schema(
        summary="Get random flashcards",
        description="Get random flashcards for practice. Returns a specified number of random flashcards.",
        tags=["Flashcards"],
        parameters=[
            OpenApiParameter(
                name='count',
                type=OpenApiTypes.INT,
                description='Number of flashcards to return',
                required=False
            ),
            OpenApiParameter(
                name='difficulty',
                type=OpenApiTypes.STR,
                enum=['EASY', 'MEDIUM', 'HARD'],
                description='Filter by difficulty level',
                required=False
            )
        ],
        responses={200: FlashcardListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def random(self, request):
        """Get random flashcards for practice."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can access random flashcards"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        count = int(request.query_params.get('count', 10))
        difficulty = request.query_params.get('difficulty')
        part_of_speech = request.query_params.get('part_of_speech')
        
        # Build queryset
        queryset = Flashcard.objects.filter(is_active=True)
        
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if part_of_speech:
            queryset = queryset.filter(part_of_speech=part_of_speech)
        
        # Get random flashcards
        flashcards = queryset.order_by('?')[:count]
        
        serializer = FlashcardListSerializer(flashcards, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Search flashcards",
        description="Search flashcards by word or definition. Supports full-text search.",
        tags=["Flashcards"],
        parameters=[
            OpenApiParameter(
                name='q',
                type=OpenApiTypes.STR,
                description='Search query for word or definition',
                required=True
            ),
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                description='Maximum number of results to return',
                required=False
            )
        ],
        responses={200: FlashcardListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search flashcards by word or definition."""
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {"detail": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        flashcards = Flashcard.objects.filter(
            Q(word__icontains=query) | Q(definition__icontains=query),
            is_active=True
        )[:50]  # Limit results
        
        serializer = FlashcardListSerializer(flashcards, many=True)
        return Response(serializer.data)


class FlashcardProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FlashcardProgress model.
    Students can only see their own progress.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return queryset based on user role."""
        user = self.request.user
        
        if user.is_admin:
            return FlashcardProgress.objects.select_related('flashcard', 'student').all()
        elif user.is_teacher:
            return FlashcardProgress.objects.select_related('flashcard', 'student').all()
        elif user.is_student:
            return FlashcardProgress.objects.filter(
                student=user
            ).select_related('flashcard')
        else:
            return FlashcardProgress.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['retrieve']:
            return FlashcardProgressDetailSerializer
        return FlashcardProgressSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def due(self, request):
        """Get flashcards due for review for the current student."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their due flashcards"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        limit = int(request.query_params.get('limit', 20))
        due_cards = FlashcardProgress.get_due_cards(request.user, limit=limit)
        
        serializer = FlashcardProgressDetailSerializer(due_cards, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Review flashcard",
        description="Review a flashcard and update spaced repetition algorithm. Tracks learning progress.",
        tags=["Flashcards"],
        request=FlashcardReviewSerializer,
        responses={200: {
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'next_review_date': {'type': 'string'},
                'interval': {'type': 'integer'}
            }
        }}
    )
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Review a flashcard and update spaced repetition."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can review flashcards"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progress = self.get_object()
        
        # Check if progress belongs to current student
        if progress.student != request.user:
            return Response(
                {"detail": "You can only review your own flashcards"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate and process review
        serializer = FlashcardReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quality = serializer.validated_data['quality']
        
        # Update spaced repetition
        progress.update_spaced_repetition(quality)
        
        return Response(
            FlashcardProgressDetailSerializer(progress).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def reset(self, request, pk=None):
        """Reset flashcard progress to initial state."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can reset their flashcard progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progress = self.get_object()
        
        # Check if progress belongs to current student
        if progress.student != request.user:
            return Response(
                {"detail": "You can only reset your own flashcard progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progress.reset_progress()
        
        return Response(
            {"detail": "Flashcard progress reset successfully"},
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        summary="Get my flashcard stats",
        description="Get current student's flashcard learning statistics and performance metrics.",
        tags=["Flashcards"],
        responses={200: FlashcardStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def my_stats(self, request):
        """Get current student's flashcard learning statistics."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = FlashcardProgress.get_learning_stats(request.user)
        
        serializer = FlashcardStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_progress(self, request):
        """Get current student's overall flashcard progress."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can view their progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all progress records for the student
        progress_records = FlashcardProgress.objects.filter(
            student=request.user
        ).select_related('flashcard').order_by('-last_reviewed')
        
        progress_data = []
        
        for progress in progress_records:
            progress_data.append({
                'flashcard_id': progress.flashcard.id,
                'word': progress.flashcard.word,
                'definition': progress.flashcard.definition,
                'mastery_level': progress.mastery_level,
                'review_count': progress.review_count,
                'consecutive_correct': progress.consecutive_correct,
                'is_mastered': progress.is_mastered,
                'days_until_review': progress.days_until_review,
                'last_reviewed': progress.last_reviewed
            })
        
        serializer = StudentFlashcardProgressSerializer(progress_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def batch_review(self, request):
        """Review multiple flashcards at once."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can review flashcards"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = FlashcardBatchReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reviews = serializer.validated_data['reviews']
        results = []
        
        for review_data in reviews:
            flashcard_id = review_data['flashcard_id']
            quality = review_data['quality']
            
            try:
                progress = FlashcardProgress.objects.get(
                    flashcard_id=flashcard_id,
                    student=request.user
                )
                
                # Update spaced repetition
                progress.update_spaced_repetition(quality)
                
                results.append({
                    'flashcard_id': flashcard_id,
                    'success': True,
                    'mastery_level': progress.mastery_level,
                    'next_review': progress.next_review
                })
                
            except FlashcardProgress.DoesNotExist:
                results.append({
                    'flashcard_id': flashcard_id,
                    'success': False,
                    'error': 'Progress record not found'
                })
        
        return Response({
            'results': results,
            'processed': len(results)
        })
    
    @action(detail=False, methods=['post'])
    def initialize_progress(self, request):
        """Initialize progress for all active flashcards for a student."""
        if not request.user.is_student:
            return Response(
                {"detail": "Only students can initialize their progress"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = request.user
        flashcards = Flashcard.objects.filter(is_active=True)
        
        created_count = 0
        existing_count = 0
        
        for flashcard in flashcards:
            progress, created = FlashcardProgress.objects.get_or_create(
                flashcard=flashcard,
                student=student
            )
            
            if created:
                created_count += 1
            else:
                existing_count += 1
        
        return Response({
            'detail': f"Progress initialized for {created_count} new flashcards. {existing_count} already existed."
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get flashcard statistics (teachers/admins only)."""
        if not (request.user.is_teacher or request.user.is_admin):
            return Response(
                {"detail": "Only teachers and admins can view statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Overall statistics
        total_flashcards = Flashcard.objects.filter(is_active=True).count()
        total_progress = FlashcardProgress.objects.count()
        mastered_cards = FlashcardProgress.objects.filter(is_mastered=True).count()
        
        # Calculate mastery distribution
        mastery_levels = {
            'New': 0,
            'Struggling': 0,
            'Learning': 0,
            'Nearly Mastered': 0,
            'Mastered': 0
        }
        
        for progress in FlashcardProgress.objects.all():
            mastery_levels[progress.mastery_level] += 1
        
        # Average statistics
        avg_reviews = FlashcardProgress.objects.aggregate(
            avg_reviews=Avg('review_count')
        )['avg_reviews'] or 0
        
        avg_consecutive = FlashcardProgress.objects.aggregate(
            avg_consecutive=Avg('consecutive_correct')
        )['avg_consecutive'] or 0
        
        stats_data = {
            'total_flashcards': total_flashcards,
            'total_progress_records': total_progress,
            'mastered_cards': mastered_cards,
            'mastery_distribution': mastery_levels,
            'average_reviews_per_card': round(avg_reviews, 2),
            'average_consecutive_correct': round(avg_consecutive, 2),
            'overall_mastery_percentage': (mastered_cards / total_progress * 100) if total_progress > 0 else 0
        }
        
        return Response(stats_data)
