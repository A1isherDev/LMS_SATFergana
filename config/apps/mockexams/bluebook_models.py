"""
Bluebook-compliant models for Digital SAT mock exams.
Follows the exact structure of the official Digital SAT.
"""
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.common.models import TimestampedModel
from apps.questionbank.models import Question


class BluebookExam(TimestampedModel):
    """
    Bluebook-compliant Digital SAT exam structure.
    Exactly matches the official Digital SAT format.
    """
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Digital SAT has fixed structure - no customization needed
    total_duration_minutes = models.IntegerField(
        default=134,  # 2 hours 14 minutes
        help_text="Total test duration in minutes (fixed at 134 for Digital SAT)"
    )
    
    def clean(self):
        """Validate exam structure."""
        if self.total_duration_minutes != 134:
            raise ValidationError("Digital SAT duration must be exactly 134 minutes")
    
    def __str__(self):
        return f"Digital SAT - {self.title}"


class BluebookSection(TimestampedModel):
    """
    Digital SAT Section structure.
    Exactly 2 sections: Reading & Writing, and Math.
    """
    exam = models.ForeignKey(BluebookExam, on_delete=models.CASCADE, related_name='sections')
    
    SECTION_TYPES = [
        ('READING_WRITING', 'Reading & Writing'),
        ('MATH', 'Math'),
    ]
    
    section_type = models.CharField(
        max_length=20,
        choices=SECTION_TYPES,
        db_index=True
    )
    
    section_order = models.IntegerField(
        help_text="Order of section (1 or 2)"
    )
    
    total_duration_minutes = models.IntegerField(
        help_text="Total duration for both modules in this section"
    )
    
    class Meta:
        unique_together = ['exam', 'section_order']
        ordering = ['section_order']
    
    def clean(self):
        """Validate section structure."""
        if self.section_type == 'READING_WRITING':
            if self.total_duration_minutes != 64:  # 32 + 32 minutes
                raise ValidationError("Reading & Writing section must be 64 minutes total")
        elif self.section_type == 'MATH':
            if self.total_duration_minutes != 70:  # 35 + 35 minutes
                raise ValidationError("Math section must be 70 minutes total")
    
    def __str__(self):
        return f"{self.exam.title} - {self.get_section_type_display()}"


class BluebookModule(TimestampedModel):
    """
    Digital SAT Module structure.
    Each section has exactly 2 modules.
    """
    section = models.ForeignKey(BluebookSection, on_delete=models.CASCADE, related_name='modules')
    
    MODULE_ORDERS = [
        (1, 'Module 1 (Baseline)'),
        (2, 'Module 2 (Adaptive)'),
    ]
    
    module_order = models.IntegerField(
        choices=MODULE_ORDERS,
        help_text="Module order within section (1 or 2)"
    )
    
    time_limit_minutes = models.IntegerField(
        help_text="Time limit for this module in minutes"
    )
    
    # Adaptive difficulty levels
    difficulty_level = models.CharField(
        max_length=10,
        choices=[
            ('BASELINE', 'Baseline'),
            ('EASIER', 'Easier'),
            ('HARDER', 'Harder'),
        ],
        default='BASELINE',
        help_text="Difficulty level for adaptive modules"
    )
    
    # Questions for this module
    questions = models.ManyToManyField(
        Question,
        related_name='bluebook_modules',
        blank=True
    )
    
    class Meta:
        unique_together = ['section', 'module_order']
        ordering = ['section__section_order', 'module_order']
    
    def clean(self):
        """Validate module structure."""
        if self.section.section_type == 'READING_WRITING':
            if self.time_limit_minutes != 32:
                raise ValidationError("Reading & Writing modules must be 32 minutes each")
            if self.module_order == 2 and self.difficulty_level == 'BASELINE':
                raise ValidationError("Module 2 must have adaptive difficulty (Easier or Harder)")
        elif self.section.section_type == 'MATH':
            if self.time_limit_minutes != 35:
                raise ValidationError("Math modules must be 35 minutes each")
            if self.module_order == 2 and self.difficulty_level == 'BASELINE':
                raise ValidationError("Module 2 must have adaptive difficulty (Easier or Harder)")
    
    @property
    def is_adaptive(self):
        """Check if this is an adaptive module."""
        return self.module_order == 2
    
    @property
    def section_type(self):
        """Get section type for convenience."""
        return self.section.section_type
    
    def __str__(self):
        return f"{self.section} - Module {self.module_order} ({self.get_difficulty_level_display()})"


class BluebookExamAttempt(TimestampedModel):
    """
    Student's attempt at a Bluebook Digital SAT exam.
    Tracks progress through the exact Digital SAT structure.
    """
    exam = models.ForeignKey(BluebookExam, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='bluebook_attempts'
    )
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    current_module_start_time = models.DateTimeField(null=True, blank=True)
    
    # Progress tracking
    current_section = models.ForeignKey(
        BluebookSection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_attempts'
    )
    current_module = models.ForeignKey(
        BluebookModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_attempts'
    )
    
    # Module completion tracking
    completed_modules = models.ManyToManyField(
        BluebookModule,
        related_name='completed_attempts',
        blank=True
    )
    
    # Adaptive routing
    reading_writing_difficulty = models.CharField(
        max_length=10,
        choices=[
            ('BASELINE', 'Baseline'),
            ('EASIER', 'Easier'),
            ('HARDER', 'Harder'),
        ],
        default='BASELINE'
    )
    
    math_difficulty = models.CharField(
        max_length=10,
        choices=[
            ('BASELINE', 'Baseline'),
            ('EASIER', 'Easier'),
            ('HARDER', 'Harder'),
        ],
        default='BASELINE'
    )
    
    # Answers storage
    module_answers = models.JSONField(
        default=dict,
        blank=True,
        help_text="Answers stored by module ID"
    )
    
    # Module timing
    module_time_spent = models.JSONField(
        default=dict,
        blank=True,
        help_text="Time spent on each module in seconds"
    )
    
    # Flags and bookmarks
    flagged_questions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Flagged questions by module ID"
    )
    
    # Status
    is_completed = models.BooleanField(default=False, db_index=True)
    is_paused = models.BooleanField(default=False)
    
    # Scores (calculated after completion)
    reading_writing_score = models.IntegerField(null=True, blank=True)
    math_score = models.IntegerField(null=True, blank=True)
    total_score = models.IntegerField(null=True, blank=True)
    
    class Meta:
        unique_together = ['exam', 'student']
        ordering = ['-created_at']
    
    def clean(self):
        """Validate attempt constraints."""
        if self.is_completed and not self.submitted_at:
            raise ValidationError("Completed attempts must have submission time")
    
    @property
    def duration_seconds(self):
        """Calculate total duration in seconds."""
        if self.started_at and self.submitted_at:
            return int((self.submitted_at - self.started_at).total_seconds())
        return 0
    
    @property
    def is_active(self):
        """Check if attempt is currently active."""
        return not self.is_completed and not self.is_paused and self.started_at is not None
    
    @property
    def current_module_time_remaining(self):
        """Get remaining time for current module."""
        if not self.current_module or not self.current_module_start_time:
            return 0
        
        elapsed = (timezone.now() - self.current_module_start_time).total_seconds()
        time_limit = self.current_module.time_limit_minutes * 60
        remaining = max(0, time_limit - elapsed)
        return int(remaining)
    
    def start_exam(self):
        """Start the exam."""
        if self.started_at:
            raise ValidationError("Exam already started")
        
        self.started_at = timezone.now()
        # Start with first section and module
        first_section = self.exam.sections.first()
        if first_section:
            self.current_section = first_section
            first_module = first_section.modules.first()
            if first_module:
                self.current_module = first_module
                self.current_module_start_time = timezone.now()
        self.save()
    
    def start_next_module(self):
        """Start the next module in sequence."""
        if not self.current_module:
            raise ValidationError("No current module")
        
        # Complete current module
        self.completed_modules.add(self.current_module)
        
        # Find next module
        current_modules = list(self.current_section.modules.all())
        current_index = current_modules.index(self.current_module)
        
        if current_index == 0:  # Moving from Module 1 to Module 2
            # Determine adaptive difficulty based on performance
            self._determine_adaptive_difficulty()
            
            # Get Module 2 with appropriate difficulty
            next_module = current_modules[1]
            
            # Update module difficulty if needed
            if self.current_section.section_type == 'READING_WRITING':
                next_module.difficulty_level = self.reading_writing_difficulty
            elif self.current_section.section_type == 'MATH':
                next_module.difficulty_level = self.math_difficulty
            
            next_module.save()
            
            # Start Module 2
            self.current_module = next_module
            self.current_module_start_time = timezone.now()
            self.save()
            
        elif current_index == 1:  # Moving to next section
            # Move to next section
            sections = list(self.exam.sections.all())
            current_section_index = sections.index(self.current_section)
            
            if current_section_index < len(sections) - 1:
                next_section = sections[current_section_index + 1]
                self.current_section = next_section
                first_module = next_section.modules.first()
                self.current_module = first_module
                self.current_module_start_time = timezone.now()
                self.save()
            else:
                # Exam completed
                self.complete_exam()
    
    def _determine_adaptive_difficulty(self):
        """Determine adaptive difficulty for Module 2 based on Module 1 performance."""
        if not self.current_module or self.current_module.module_order != 1:
            return
        
        # Get Module 1 answers and calculate performance
        module_id = str(self.current_module.id)
        answers = self.module_answers.get(module_id, {})
        
        if not answers:
            # Default to easier if no answers
            difficulty = 'EASIER'
        else:
            # Calculate accuracy
            correct_count = 0
            total_count = len(answers)
            
            for question_id, answer in answers.items():
                try:
                    question = Question.objects.get(id=question_id)
                    if answer == question.correct_answer:
                        correct_count += 1
                except Question.DoesNotExist:
                    continue
            
            accuracy = (correct_count / total_count) * 100 if total_count > 0 else 0
            
            # Determine difficulty based on accuracy
            if accuracy >= 70:
                difficulty = 'HARDER'
            elif accuracy >= 40:
                difficulty = 'EASIER'
            else:
                difficulty = 'EASIER'  # Very low performance gets easier
        
        # Set difficulty for appropriate section
        if self.current_section.section_type == 'READING_WRITING':
            self.reading_writing_difficulty = difficulty
        elif self.current_section.section_type == 'MATH':
            self.math_difficulty = difficulty
    
    def submit_module(self, module_answers):
        """Submit answers for current module."""
        if not self.current_module:
            raise ValidationError("No current module to submit")
        
        module_id = str(self.current_module.id)
        self.module_answers[module_id] = module_answers
        
        # Calculate time spent
        if self.current_module_start_time:
            time_spent = int((timezone.now() - self.current_module_start_time).total_seconds())
            self.module_time_spent[module_id] = time_spent
        
        self.save()
        
        # Auto-start next module
        self.start_next_module()
    
    def complete_exam(self):
        """Complete the exam and calculate scores."""
        if self.is_completed:
            return
        
        self.submitted_at = timezone.now()
        self.is_completed = True
        self._calculate_scores()
        self.save()
    
    def _calculate_scores(self):
        """Calculate SAT scores based on performance."""
        # This is a simplified scoring model
        # In reality, SAT scoring is more complex with scaling
        
        reading_writing_correct = 0
        math_correct = 0
        
        # Count correct answers by section
        for module_id, answers in self.module_answers.items():
            try:
                module = BluebookModule.objects.get(id=module_id)
                for question_id, answer in answers.items():
                    try:
                        question = Question.objects.get(id=question_id)
                        if answer == question.correct_answer:
                            if module.section_type == 'READING_WRITING':
                                reading_writing_correct += 1
                            elif module.section_type == 'MATH':
                                math_correct += 1
                    except Question.DoesNotExist:
                        continue
            except BluebookModule.DoesNotExist:
                continue
        
        # Convert to SAT scores (simplified)
        # Reading & Writing: 200-800 scale
        # Math: 200-800 scale
        # Total: 400-1600 scale
        
        # Apply adaptive difficulty bonus/penalty
        reading_writing_bonus = 0
        math_bonus = 0
        
        if self.reading_writing_difficulty == 'HARDER':
            reading_writing_bonus = 50
        elif self.reading_writing_difficulty == 'EASIER':
            reading_writing_bonus = -20
        
        if self.math_difficulty == 'HARDER':
            math_bonus = 50
        elif self.math_difficulty == 'EASIER':
            math_bonus = -20
        
        # Calculate scores (simplified linear scaling)
        self.reading_writing_score = max(200, min(800, 
            int(200 + (reading_writing_correct / 54) * 600 + reading_writing_bonus)))
        self.math_score = max(200, min(800,
            int(200 + (math_correct / 44) * 600 + math_bonus)))
        self.total_score = self.reading_writing_score + self.math_score
    
    def get_module_progress(self, module_id):
        """Get progress for a specific module."""
        if not module_id:
            return 0
        
        try:
            module = BluebookModule.objects.get(id=module_id)
            answers = self.module_answers.get(str(module_id), {})
            total_questions = module.questions.count()
            answered_questions = len(answers)
            
            return (answered_questions / total_questions * 100) if total_questions > 0 else 0
        except BluebookModule.DoesNotExist:
            return 0
    
    def get_current_progress(self):
        """Get progress for current module."""
        if not self.current_module:
            return 0
        return self.get_module_progress(self.current_module.id)
    
    def flag_question(self, question_id, flagged=True):
        """Flag or unflag a question."""
        if not self.current_module:
            return
        
        module_id = str(self.current_module.id)
        if module_id not in self.flagged_questions:
            self.flagged_questions[module_id] = []
        
        question_list = self.flagged_questions[module_id]
        if flagged and question_id not in question_list:
            question_list.append(question_id)
        elif not flagged and question_id in question_list:
            question_list.remove(question_id)
        
        self.save()
    
    def is_question_flagged(self, question_id):
        """Check if a question is flagged."""
        if not self.current_module:
            return False
        
        module_id = str(self.current_module.id)
        return question_id in self.flagged_questions.get(module_id, [])
    
    def __str__(self):
        return f"{self.student.email} - {self.exam.title} ({'Completed' if self.is_completed else 'In Progress'})"


class BluebookQuestionResponse(TimestampedModel):
    """
    Individual question responses for detailed tracking.
    """
    attempt = models.ForeignKey(BluebookExamAttempt, on_delete=models.CASCADE, related_name='responses')
    module = models.ForeignKey(BluebookModule, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bluebook_responses')
    
    selected_answer = models.CharField(max_length=10)
    is_correct = models.BooleanField(default=False)
    time_spent_seconds = models.IntegerField(default=0)
    is_flagged = models.BooleanField(default=False)
    answer_order = models.IntegerField(default=0)  # Order in which question was answered
    
    class Meta:
        unique_together = ['attempt', 'module', 'question']
        ordering = ['module', 'answer_order']
    
    def save(self, *args, **kwargs):
        """Auto-calculate correctness."""
        if self.question and self.selected_answer:
            self.is_correct = self.selected_answer == self.question.correct_answer
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.attempt.student.email} - Q{self.question.id} ({'Correct' if self.is_correct else 'Incorrect'})"
