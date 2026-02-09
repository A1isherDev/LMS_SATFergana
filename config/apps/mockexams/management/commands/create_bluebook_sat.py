"""
Management command to create a Bluebook Digital SAT exam for testing.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.mockexams.bluebook_models import BluebookExam, BluebookSection, BluebookModule
from apps.questionbank.models import Question


class Command(BaseCommand):
    help = 'Create a Bluebook Digital SAT exam with sample questions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--title',
            type=str,
            default='Digital SAT Practice Test',
            help='Title for the Digital SAT test'
        )
        parser.add_argument(
            '--description',
            type=str,
            default='Official Digital SAT format practice test with adaptive modules',
            help='Description for the Digital SAT test'
        )

    def handle(self, *args, **options):
        title = options['title']
        description = options['description']
        
        self.stdout.write(f'Creating Bluebook Digital SAT: {title}')
        
        try:
            with transaction.atomic():
                # Create the Bluebook exam
                exam = BluebookExam.objects.create(
                    title=title,
                    description=description,
                    is_active=True,
                    total_duration_minutes=134  # 2 hours 14 minutes
                )
                
                self.stdout.write(f'Created exam: {exam.title}')
                
                # Create Reading & Writing Section
                rw_section = BluebookSection.objects.create(
                    exam=exam,
                    section_type='READING_WRITING',
                    section_order=1,
                    total_duration_minutes=64  # 32 minutes per module
                )
                
                # Create Math Section
                math_section = BluebookSection.objects.create(
                    exam=exam,
                    section_type='MATH',
                    section_order=2,
                    total_duration_minutes=70  # 35 minutes per module
                )
                
                self.stdout.write(f'Created sections: {rw_section.section_type}, {math_section.section_type}')
                
                # Get sample questions
                math_questions = list(Question.objects.filter(question_type='MATH')[:44])
                reading_questions = list(Question.objects.filter(question_type='READING')[:32])
                writing_questions = list(Question.objects.filter(question_type='WRITING')[:22])
                
                # Create Reading & Writing Module 1 (Baseline)
                rw_module1 = BluebookModule.objects.create(
                    section=rw_section,
                    module_order=1,
                    time_limit_minutes=32,
                    difficulty_level='BASELINE'
                )
                
                # Add 16 Reading + 11 Writing questions to Module 1
                rw_module1_questions = reading_questions[:16] + writing_questions[:11]
                rw_module1.questions.add(*rw_module1_questions)
                
                # Create Reading & Writing Module 2 (Adaptive)
                rw_module2 = BluebookModule.objects.create(
                    section=rw_section,
                    module_order=2,
                    time_limit_minutes=32,
                    difficulty_level='EASIER'  # Adaptive difficulty
                )
                
                # Add remaining 16 Reading + 11 Writing questions to Module 2
                rw_module2_questions = reading_questions[16:32] + writing_questions[11:22]
                rw_module2.questions.add(*rw_module2_questions)
                
                # Create Math Module 1 (Baseline)
                math_module1 = BluebookModule.objects.create(
                    section=math_section,
                    module_order=1,
                    time_limit_minutes=35,
                    difficulty_level='BASELINE'
                )
                
                # Add 22 Math questions to Module 1
                math_module1.questions.add(*math_questions[:22])
                
                # Create Math Module 2 (Adaptive)
                math_module2 = BluebookModule.objects.create(
                    section=math_section,
                    module_order=2,
                    time_limit_minutes=35,
                    difficulty_level='EASIER'  # Adaptive difficulty
                )
                
                # Add remaining 22 Math questions to Module 2
                math_module2.questions.add(*math_questions[22:44])
                
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully created Bluebook Digital SAT:\n'
                    f'  - Exam: {exam.title}\n'
                    f'  - Total Duration: {exam.total_duration_minutes} minutes\n'
                    f'  - Reading & Writing: {rw_section.total_duration_minutes} minutes (2 modules)\n'
                    f'    - Module 1: {rw_module1.questions.count()} questions\n'
                    f'    - Module 2: {rw_module2.questions.count()} questions\n'
                    f'  - Math: {math_section.total_duration_minutes} minutes (2 modules)\n'
                    f'    - Module 1: {math_module1.questions.count()} questions\n'
                    f'    - Module 2: {math_module2.questions.count()} questions\n'
                    f'  - Total Questions: {rw_module1.questions.count() + rw_module2.questions.count() + math_module1.questions.count() + math_module2.questions.count()}'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating Bluebook SAT: {str(e)}'))
            raise
