"""
Management command to convert existing SAT test to Bluebook format with proper module structure.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.mockexams.bluebook_models import BluebookExam, BluebookSection, BluebookModule
from apps.mockexams.models import MockExam
from apps.questionbank.models import Question


class Command(BaseCommand):
    help = 'Convert existing SAT test to Bluebook format with proper modules'

    def handle(self, *args, **options):
        self.stdout.write('Converting SAT test to Bluebook format...')
        
        try:
            # Get the existing SAT test
            existing_exam = MockExam.objects.get(title='Official SAT Practice Test')
            self.stdout.write(f'Found existing exam: {existing_exam.title}')
            self.stdout.write(f'  - Math questions: {existing_exam.math_questions.count()}')
            self.stdout.write(f'  - Reading questions: {existing_exam.reading_questions.count()}')
            self.stdout.write(f'  - Writing questions: {existing_exam.writing_questions.count()}')
            
            # Create Bluebook exam
            bluebook_exam = BluebookExam.objects.create(
                title='Digital SAT Practice Test',
                description='Official Digital SAT practice test with adaptive modules',
                total_duration_minutes=134  # 2 hours 14 minutes
            )
            
            self.stdout.write(f'Created Bluebook exam: {bluebook_exam.title}')
            
            # Create Reading & Writing section (64 minutes total)
            rw_section = BluebookSection.objects.create(
                exam=bluebook_exam,
                section_type='READING_WRITING',
                section_order=1,
                total_duration_minutes=64
            )
            
            # Create Reading & Writing modules (32 minutes each)
            rw_module1 = BluebookModule.objects.create(
                section=rw_section,
                module_order=1,
                time_limit_minutes=32,
                difficulty_level='BASELINE'
            )
            
            rw_module2 = BluebookModule.objects.create(
                section=rw_section,
                module_order=2,
                time_limit_minutes=32,
                difficulty_level='BASELINE'  # Will be set adaptively
            )
            
            # Create Math section (70 minutes total)
            math_section = BluebookSection.objects.create(
                exam=bluebook_exam,
                section_type='MATH',
                section_order=2,
                total_duration_minutes=70
            )
            
            # Create Math modules (35 minutes each)
            math_module1 = BluebookModule.objects.create(
                section=math_section,
                module_order=1,
                time_limit_minutes=35,
                difficulty_level='BASELINE'
            )
            
            math_module2 = BluebookModule.objects.create(
                section=math_section,
                module_order=2,
                time_limit_minutes=35,
                difficulty_level='BASELINE'  # Will be set adaptively
            )
            
            self.stdout.write('Created Bluebook structure:')
            self.stdout.write('  - Reading & Writing Section (64 min)')
            self.stdout.write('    - Module 1: 32 min (Baseline)')
            self.stdout.write('    - Module 2: 32 min (Adaptive)')
            self.stdout.write('  - Math Section (70 min)')
            self.stdout.write('    - Module 1: 35 min (Baseline)')
            self.stdout.write('    - Module 2: 35 min (Adaptive)')
            
            # Distribute questions across modules
            self._distribute_questions(existing_exam, rw_module1, rw_module2, math_module1, math_module2)
            
            self.stdout.write(self.style.SUCCESS(
                f'Successfully converted to Bluebook format!\n'
                f'Total time: 134 minutes (2 hours 14 minutes)\n'
                f'Math Module 1: {math_module1.questions.count()} questions\n'
                f'Math Module 2: {math_module2.questions.count()} questions\n'
                f'Reading Module 1: {rw_module1.questions.count()} questions\n'
                f'Reading Module 2: {rw_module2.questions.count()} questions\n'
                f'Writing Module 1: {rw_module1.questions.count()} questions\n'
                f'Writing Module 2: {rw_module2.questions.count()} questions'
            ))
            
        except MockExam.DoesNotExist:
            self.stdout.write(self.style.ERROR('Official SAT Practice Test not found. Please create it first using: python manage.py create_full_sat'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error converting to Bluebook format: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())

    def _distribute_questions(self, existing_exam, rw_module1, rw_module2, math_module1, math_module2):
        """Distribute questions across modules."""
        
        # Get questions from existing exam
        math_questions = list(existing_exam.math_questions.all())
        reading_questions = list(existing_exam.reading_questions.all())
        writing_questions = list(existing_exam.writing_questions.all())
        
        # Distribute reading questions (split roughly evenly)
        reading_mid = len(reading_questions) // 2
        rw_module1.questions.add(*reading_questions[:reading_mid])
        rw_module2.questions.add(*reading_questions[reading_mid:])
        
        # Distribute writing questions (split roughly evenly)
        writing_mid = len(writing_questions) // 2
        rw_module1.questions.add(*writing_questions[:writing_mid])
        rw_module2.questions.add(*writing_questions[writing_mid:])
        
        # Distribute math questions (split roughly evenly)
        math_mid = len(math_questions) // 2
        math_module1.questions.add(*math_questions[:math_mid])
        math_module2.questions.add(*math_questions[math_mid:])
        
        self.stdout.write('Question distribution:')
        self.stdout.write(f'  - Math: {math_mid} in Module 1, {len(math_questions) - math_mid} in Module 2')
        self.stdout.write(f'  - Reading: {reading_mid} in Module 1, {len(reading_questions) - reading_mid} in Module 2')
        self.stdout.write(f'  - Writing: {writing_mid} in Module 1, {len(writing_questions) - writing_mid} in Module 2')
