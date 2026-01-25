"""
Serializers for the flashcards app.
"""
from rest_framework import serializers
from apps.flashcards.models import Flashcard, FlashcardProgress


class FlashcardSerializer(serializers.ModelSerializer):
    """Serializer for Flashcard model."""
    part_of_speech_display = serializers.CharField(source='get_part_of_speech_display', read_only=True)
    synonyms_list = serializers.SerializerMethodField()
    antonyms_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Flashcard
        fields = [
            'id', 'word', 'definition', 'example_sentence', 'difficulty',
            'part_of_speech', 'part_of_speech_display', 'synonyms', 'antonyms',
            'synonyms_list', 'antonyms_list', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_synonyms_list(self, obj):
        """Get synonyms as a list."""
        return obj.get_synonyms_list()
    
    def get_antonyms_list(self, obj):
        """Get antonyms as a list."""
        return obj.get_antonyms_list()
    
    def validate_difficulty(self, value):
        """Validate difficulty level."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Difficulty must be between 1 and 5")
        return value


class FlashcardListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for flashcard lists."""
    part_of_speech_display = serializers.CharField(source='get_part_of_speech_display', read_only=True)
    
    class Meta:
        model = Flashcard
        fields = [
            'id', 'word', 'difficulty', 'part_of_speech', 'part_of_speech_display',
            'is_active', 'created_at'
        ]


class FlashcardProgressSerializer(serializers.ModelSerializer):
    """Serializer for FlashcardProgress model."""
    flashcard_word = serializers.CharField(source='flashcard.word', read_only=True)
    flashcard_definition = serializers.CharField(source='flashcard.definition', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    is_due_for_review = serializers.ReadOnlyField()
    days_until_review = serializers.ReadOnlyField()
    mastery_level = serializers.ReadOnlyField()
    
    class Meta:
        model = FlashcardProgress
        fields = [
            'id', 'flashcard', 'flashcard_word', 'flashcard_definition',
            'student', 'student_name', 'student_email', 'last_reviewed',
            'next_review', 'is_due_for_review', 'days_until_review',
            'review_count', 'ease_factor', 'interval_days', 'is_mastered',
            'consecutive_correct', 'mastery_level', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_reviewed', 'next_review', 'review_count',
            'ease_factor', 'interval_days', 'is_mastered',
            'consecutive_correct', 'created_at', 'updated_at'
        ]


class FlashcardReviewSerializer(serializers.Serializer):
    """Serializer for reviewing flashcards."""
    quality = serializers.IntegerField(
        min_value=0,
        max_value=5,
        help_text="Quality of recall (0-5): 0=blackout, 1=incorrect, 2=familiar, 3=difficult, 4=hesitation, 5=perfect"
    )
    
    def validate_quality(self, value):
        """Validate quality rating."""
        if value < 0 or value > 5:
            raise serializers.ValidationError("Quality must be between 0 and 5")
        return value


class FlashcardProgressDetailSerializer(FlashcardProgressSerializer):
    """Detailed serializer for flashcard progress with full flashcard info."""
    flashcard = FlashcardSerializer(read_only=True)
    
    class Meta(FlashcardProgressSerializer.Meta):
        fields = FlashcardProgressSerializer.Meta.fields + ['flashcard']


class FlashcardStatsSerializer(serializers.Serializer):
    """Serializer for flashcard learning statistics."""
    total_cards = serializers.IntegerField()
    mastered_cards = serializers.IntegerField()
    due_cards = serializers.IntegerField()
    struggling_cards = serializers.IntegerField()
    learning_cards = serializers.IntegerField()
    nearly_mastered_cards = serializers.IntegerField()
    mastery_percentage = serializers.FloatField()


class StudentFlashcardProgressSerializer(serializers.Serializer):
    """Serializer for student's overall flashcard progress."""
    flashcard_id = serializers.IntegerField()
    word = serializers.CharField()
    definition = serializers.CharField()
    mastery_level = serializers.CharField()
    review_count = serializers.IntegerField()
    consecutive_correct = serializers.IntegerField()
    is_mastered = serializers.BooleanField()
    days_until_review = serializers.IntegerField()
    last_reviewed = serializers.DateTimeField()


class FlashcardBatchReviewSerializer(serializers.Serializer):
    """Serializer for batch reviewing multiple flashcards."""
    reviews = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(min_value=0, max_value=5)
        ),
        help_text="List of reviews: [{'flashcard_id': quality}, ...]"
    )
    
    def validate_reviews(self, value):
        """Validate reviews format."""
        if not value:
            raise serializers.ValidationError("At least one review must be provided")
        
        flashcard_ids = []
        for review in value:
            if not isinstance(review, dict) or 'flashcard_id' not in review:
                raise serializers.ValidationError("Each review must be a dict with 'flashcard_id' key")
            
            flashcard_id = review['flashcard_id']
            if flashcard_id in flashcard_ids:
                raise serializers.ValidationError(f"Duplicate flashcard_id: {flashcard_id}")
            flashcard_ids.append(flashcard_id)
            
            quality = review.get('quality')
            if quality is None or quality < 0 or quality > 5:
                raise serializers.ValidationError(f"Invalid quality for flashcard_id {flashcard_id}")
        
        return value


class FlashcardCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating flashcards (teachers/admins only)."""
    
    class Meta:
        model = Flashcard
        fields = [
            'word', 'definition', 'example_sentence', 'difficulty',
            'part_of_speech', 'synonyms', 'antonyms', 'is_active'
        ]
    
    def validate_word(self, value):
        """Validate word is unique and not empty."""
        if not value.strip():
            raise serializers.ValidationError("Word cannot be empty")
        
        # Check for duplicate (case-insensitive)
        if Flashcard.objects.filter(word__iexact=value.strip()).exists():
            raise serializers.ValidationError("Flashcard with this word already exists")
        
        return value.strip()
    
    def validate_difficulty(self, value):
        """Validate difficulty level."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Difficulty must be between 1 and 5")
        return value
