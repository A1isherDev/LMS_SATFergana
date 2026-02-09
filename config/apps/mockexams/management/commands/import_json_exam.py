"""
Management command to import SAT exam from JSON file into Bluebook system.
"""
import json
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.mockexams.bluebook_models import BluebookExam, BluebookSection, BluebookModule
from apps.questionbank.models import Question


class Command(BaseCommand):
    help = 'Import SAT exam from JSON file into Bluebook system'

    def add_arguments(self, parser):
        parser.add_argument(
            'json_file',
            type=str,
            help='Path to JSON file containing exam data'
        )

    def handle(self, *args, **options):
        json_file = options['json_file']
        
        self.stdout.write(f'Importing SAT exam from: {json_file}')
        
        try:
            with transaction.atomic():
                # Read JSON file
                with open(json_file, 'r', encoding='utf-8') as f:
                    exam_data = json.load(f)
                
                exam_info = exam_data['exam']
                
                # Create the Bluebook exam
                exam = BluebookExam.objects.create(
                    title=exam_info['title'],
                    description=exam_info['description'],
                    is_active=True,
                    total_duration_minutes=134  # Standard Digital SAT duration
                )
                
                self.stdout.write(f'Created exam: {exam.title}')
                
                # Create sections based on the JSON structure
                sections_created = []
                for section_data in exam_info['sections']:
                    if section_data['id'] == 'math':
                        # Math Section
                        section = BluebookSection.objects.create(
                            exam=exam,
                            section_type='MATH',
                            section_order=2,  # Math comes second in SAT
                            total_duration_minutes=70  # 35 minutes per module
                        )
                        sections_created.append(('MATH', section))
                    elif section_data['id'] == 'english':
                        # Reading & Writing Section
                        section = BluebookSection.objects.create(
                            exam=exam,
                            section_type='READING_WRITING',
                            section_order=1,  # Reading & Writing comes first
                            total_duration_minutes=64  # 32 minutes per module
                        )
                        sections_created.append(('READING_WRITING', section))
                
                self.stdout.write(f'Created sections: {[s[0] for s in sections_created]}')
                
                # Process modules and questions
                total_questions = 0
                
                for section_data in exam_info['sections']:
                    section_type = 'MATH' if section_data['id'] == 'math' else 'READING_WRITING'
                    section = next(s for s in sections_created if s[0] == section_type)[1]
                    
                    for module_data in section_data['modules']:
                        module_questions = []
                        
                        # Create questions for this module
                        for q_data in module_data['questions']:
                            question = Question.objects.create(
                                question_text=q_data['prompt'],
                                question_type='MATH' if section_type == 'MATH' else 'READING',
                                options={
                                    'A': q_data['choices']['A'],
                                    'B': q_data['choices']['B'], 
                                    'C': q_data['choices']['C'],
                                    'D': q_data['choices']['D']
                                },
                                correct_answer=q_data['correct'],
                                difficulty=2,  # Medium difficulty
                                estimated_time_seconds=75 if section_type == 'READING_WRITING' else 90,  # More time for reading
                                explanation=f'Correct answer is {q_data["correct"]}',
                                skill_tag=f'SYNTHETIC_{section_type.upper()}_{module_data["id"].upper()}',
                                is_active=True
                            )
                            module_questions.append(question)
                            total_questions += 1
                        
                        # Create module
                        module = BluebookModule.objects.create(
                            section=section,
                            module_order=1 if 'module_1' in module_data['id'] else 2,
                            time_limit_minutes=32 if section_type == 'READING_WRITING' else 35,
                            difficulty_level='BASELINE' if 'module_1' in module_data['id'] else 'EASIER'
                        )
                        
                        # Add questions to module
                        module.questions.add(*module_questions)
                        
                        self.stdout.write(f'  - {module_data["title"]}: {len(module_questions)} questions')
                
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully imported Synthetic SAT exam:\n'
                    f'  - Exam: {exam.title}\n'
                    f'  - Total Duration: {exam.total_duration_minutes} minutes\n'
                    f'  - Sections: {[s[0] for s in sections_created]}\n'
                    f'  - Total Questions: {total_questions}\n'
                    f'  - Questions imported from: {json_file}'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error importing exam: {str(e)}'))
            raise
