"""
Admin configuration for flashcards app.
"""
from django.contrib import admin
from apps.flashcards.models import Flashcard, FlashcardProgress


@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    """Admin interface for Flashcard model."""
    list_display = [
        'word', 'part_of_speech', 'difficulty', 'is_active', 'created_at'
    ]
    list_filter = [
        'part_of_speech', 'difficulty', 'is_active', 'created_at'
    ]
    search_fields = ['word', 'definition', 'example_sentence']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Word Details', {
            'fields': ('word', 'definition', 'example_sentence')
        }),
        ('Classification', {
            'fields': ('part_of_speech', 'difficulty', 'is_active')
        }),
        ('Related Words', {
            'fields': ('synonyms', 'antonyms')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make word readonly after creation."""
        if obj:
            return self.readonly_fields + ['word']
        return self.readonly_fields


@admin.register(FlashcardProgress)
class FlashcardProgressAdmin(admin.ModelAdmin):
    """Admin interface for FlashcardProgress model."""
    list_display = [
        'student', 'flashcard_word', 'mastery_level', 'review_count',
        'consecutive_correct', 'is_mastered', 'last_reviewed', 'next_review'
    ]
    list_filter = [
        'is_mastered', 'last_reviewed', 'next_review',
        'flashcard__part_of_speech', 'flashcard__difficulty'
    ]
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'flashcard__word', 'flashcard__definition'
    ]
    raw_id_fields = ['flashcard', 'student']
    readonly_fields = [
        'created_at', 'updated_at', 'last_reviewed', 'next_review',
        'review_count', 'ease_factor', 'interval_days'
    ]
    
    fieldsets = (
        ('Progress Details', {
            'fields': ('flashcard', 'student', 'is_mastered')
        }),
        ('Learning Metrics', {
            'fields': (
                'review_count', 'consecutive_correct', 'ease_factor',
                'interval_days'
            )
        }),
        ('Review Schedule', {
            'fields': ('last_reviewed', 'next_review'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def flashcard_word(self, obj):
        """Display flashcard word."""
        return obj.flashcard.word
    flashcard_word.short_description = 'Word'
    
    def mastery_level(self, obj):
        """Display mastery level."""
        return obj.mastery_level
    mastery_level.short_description = 'Mastery Level'
