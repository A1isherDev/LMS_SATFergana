"""
Management command to add sample SAT exams for testing.
"""
from django.core.management.base import BaseCommand
from apps.mockexams.models import MockExam
from apps.questionbank.models import Question


class Command(BaseCommand):
    help = 'Add sample SAT exams for testing'

    def handle(self, *args, **options):
        self.stdout.write('Adding sample SAT exams...')
        
        try:
            # Check if we already have the main SAT test
            existing_exam = MockExam.objects.filter(title='Official SAT Practice Test').first()
            if existing_exam:
                self.stdout.write('Official SAT Practice Test already exists.')
                self.stdout.write(f'  - {existing_exam.total_questions} questions')
                self.stdout.write(f'  - {existing_exam.total_time_seconds // 60} minutes')
            
            # Add a Math-only practice test
            math_exam = MockExam(
                title='SAT Math Practice Test',
                description='Focused math section practice with 25 questions',
                exam_type='MATH_ONLY',
                math_time_limit=2700,  # 45 minutes
                reading_time_limit=0,
                writing_time_limit=0,
                is_active=True
            )
            math_exam.save_base(force_insert=True)
            
            # Add some math questions
            math_questions = Question.objects.filter(question_type='MATH')[:25]
            math_exam.math_questions.add(*math_questions)
            
            # Add a Reading & Writing practice test
            rw_exam = MockExam(
                title='SAT Reading & Writing Practice Test',
                description='Combined Reading and Writing sections with 54 questions',
                exam_type='READING_WRITING_ONLY',
                math_time_limit=0,
                reading_time_limit=2400,  # 40 minutes
                writing_time_limit=2400,  # 40 minutes
                is_active=True
            )
            rw_exam.save_base(force_insert=True)
            
            # Add reading and writing questions
            reading_questions = Question.objects.filter(question_type='READING')[:27]
            writing_questions = Question.objects.filter(question_type='WRITING')[:27]
            rw_exam.reading_questions.add(*reading_questions)
            rw_exam.writing_questions.add(*writing_questions)
            
            self.stdout.write(self.style.SUCCESS(
                f'Successfully added sample exams:\n'
                f'1. {math_exam.title} - {math_exam.total_questions} questions, {math_exam.total_time_seconds // 60} minutes\n'
                f'2. {rw_exam.title} - {rw_exam.total_questions} questions, {rw_exam.total_time_seconds // 60} minutes'
            ))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error adding sample exams: {str(e)}'))
