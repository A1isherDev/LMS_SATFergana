import json
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.questionbank.models import Question
from apps.mockexams.models import MockExam
from apps.mockexams.bluebook_models import BluebookExam, BluebookSection, BluebookModule
import os

class Command(BaseCommand):
    help = 'Import synthetic SAT exam from JSON file'

    def handle(self, *args, **options):
        # Use absolute path to avoid CWD issues
        file_path = 'd:/SAT_Fergana/LMS_SATFergana/synthetic_sat_full_exam.json'
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
            
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except Exception as e:
             self.stdout.write(self.style.ERROR(f'Error reading file: {str(e)}'))
             return

        exam_data = data['exam']
        
        try:
            # Removed transaction.atomic for debugging
            # with transaction.atomic():
                # 1. Create Traditional Mock Exam
                mock_exam, _ = MockExam.objects.get_or_create(
                    title=exam_data['title'] + " (Review Mode)",
                    defaults={
                        'description': exam_data['description'],
                        'exam_type': 'FULL',
                        'math_time_limit': 2700,
                        'reading_time_limit': 2400, # Simplified split
                        'writing_time_limit': 2400,
                        'is_active': True
                    }
                )
                
                # 2. Create Bluebook Digital SAT Exam
                bluebook_exam, _ = BluebookExam.objects.get_or_create(
                    title=exam_data['title'],
                    defaults={
                        'description': exam_data['description'],
                        'is_active': True,
                        'difficulty': 'STANDARD',
                        'version': '1.0'
                    }
                )

                # Ensure Bluebook Structure exists (RW and Math Sections)
                if not bluebook_exam.sections.exists():
                     # Create Reading & Writing Section
                    rw_section = BluebookSection.objects.create(
                        exam=bluebook_exam,
                        section_type='READING_WRITING',
                        section_order=1,
                        total_duration_minutes=64
                    )
                    # Create Math Section
                    math_section = BluebookSection.objects.create(
                        exam=bluebook_exam,
                        section_type='MATH',
                        section_order=2,
                        total_duration_minutes=70 
                    )
                else:
                    rw_section = bluebook_exam.sections.get(section_type='READING_WRITING')
                    math_section = bluebook_exam.sections.get(section_type='MATH')

                # Ensure Modules exist
                # RW Modules
                rw_m1, _ = BluebookModule.objects.get_or_create(
                    section=rw_section, module_order=1, 
                    defaults={'time_limit_minutes': 32, 'difficulty_level': 'BASELINE'}
                )
                rw_m2, _ = BluebookModule.objects.get_or_create(
                    section=rw_section, module_order=2, 
                    defaults={'time_limit_minutes': 32, 'difficulty_level': 'HARDER'} # Must be adaptive (HARDER/EASIER)
                )
                
                # Math Modules
                math_m1, _ = BluebookModule.objects.get_or_create(
                    section=math_section, module_order=1, 
                    defaults={'time_limit_minutes': 35, 'difficulty_level': 'BASELINE'}
                )
                math_m2, _ = BluebookModule.objects.get_or_create(
                    section=math_section, module_order=2, 
                    defaults={'time_limit_minutes': 35, 'difficulty_level': 'HARDER'} # Must be adaptive
                )

                # Process Questions from JSON
                for section in exam_data['sections']:
                    section_id = section['id']
                    
                    for module in section['modules']:
                        # Map JSON module ID to Bluebook Module
                        target_module = None
                        if section_id == 'math':
                            if 'module_1' in module['id']: target_module = math_m1
                            elif 'module_2' in module['id']: target_module = math_m2
                        elif section_id == 'english':
                            if 'module_1' in module['id']: target_module = rw_m1
                            elif 'module_2' in module['id']: target_module = rw_m2

                        for i, q_data in enumerate(module['questions']):
                            # Determine Type/Subject
                            if section_id == 'math':
                                q_type = 'MATH'
                            else:
                                q_type = 'READING' # Default for English in Bluebook context
                                # Note: Actual Digital SAT mixes them. For MockExam model compliance (if used), we split.
                                # But for BluebookExam, questions are just added to the module.
                            
                            
                            
                            # Create Question - Handle duplicates safely
                            question = Question.objects.filter(question_text=q_data['prompt']).first()
                            if not question:
                                question = Question.objects.create(
                                    question_text=q_data['prompt'],
                                    question_type=q_type,
                                    skill_tag='General',
                                    difficulty=3,
                                    options=q_data['choices'],
                                    correct_answer=q_data['correct'],
                                    explanation='Correct answer is ' + q_data['correct'],
                                    is_active=True
                                )
                            
                            # DEBUG: Verify IDs
                            if not question.pk: 
                                question.save()
                                self.stdout.write(f"Saved Question: {question.pk}")
                            
                            if not mock_exam.pk: 
                                mock_exam.save()
                                self.stdout.write(f"Saved MockExam: {mock_exam.pk}")

                            if target_module and not target_module.pk:
                                target_module.save()
                                self.stdout.write(f"Saved Module: {target_module.pk}")
                            
                            # Add to Traditional Mock Exam
                            if section_id == 'math':
                                try:
                                    mock_exam.math_questions.add(question)
                                except Exception as e:
                                    self.stdout.write(self.style.ERROR(f"Failed to add to MockExam: {e} MockID:{mock_exam.pk} QID:{question.pk}"))
                                    raise e
                            else:
                                if i % 2 == 0: mock_exam.reading_questions.add(question)
                                else: mock_exam.writing_questions.add(question)
                            
                            # Add to Bluebook Module
                            if target_module:
                                target_module.questions.add(question)

                self.stdout.write(self.style.SUCCESS(f'Successfully imported exam: {bluebook_exam.title} (Bluebook) and {mock_exam.title} (Traditional)'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error importing exam: {str(e)}'))
            raise e
