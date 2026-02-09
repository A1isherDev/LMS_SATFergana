"""
Management command to import SAT exam from YAML file into Bluebook system.
"""
import yaml
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.mockexams.bluebook_models import BluebookExam, BluebookSection, BluebookModule
from apps.questionbank.models import Question


class Command(BaseCommand):
    help = 'Import SAT exam from YAML file into Bluebook system'

    def add_arguments(self, parser):
        parser.add_argument(
            'yaml_file',
            type=str,
            help='Path to YAML file containing exam data'
        )

    def handle(self, *args, **options):
        yaml_file = options['yaml_file']
        
        self.stdout.write(f'Importing SAT exam from: {yaml_file}')
        
        try:
            with transaction.atomic():
                # Read YAML file
                with open(yaml_file, 'r', encoding='utf-8') as f:
                    exam_data = yaml.safe_load(f)
                
                exam_info = exam_data['exam']
                
                # Create the Bluebook exam
                exam = BluebookExam.objects.create(
                    title=exam_info['title'],
                    description=exam_info['description'],
                    is_active=True,
                    total_duration_minutes=134  # Standard Digital SAT duration
                )
                
                self.stdout.write(f'Created exam: {exam.title}')
                
                # Create Reading & Writing Section (first module)
                rw_section = BluebookSection.objects.create(
                    exam=exam,
                    section_type='READING_WRITING',
                    section_order=1,
                    total_duration_minutes=64  # 32 minutes per module
                )
                
                # Create Math Section (second module)
                math_section = BluebookSection.objects.create(
                    exam=exam,
                    section_type='MATH',
                    section_order=2,
                    total_duration_minutes=70  # 35 minutes per module
                )
                
                self.stdout.write(f'Created sections: {rw_section.section_type}, {math_section.section_type}')
                
                # Process modules and questions
                questions_created = 0
                
                for module_data in exam_info['modules']:
                    module_questions = []
                    
                    # Create questions for this module
                    for q_data in module_data['questions']:
                        question = Question.objects.create(
                            question_text=q_data['prompt'],
                            question_type='MATH' if 'math' in q_data['id'].lower() or 'system' in q_data['prompt'].lower() else 'READING',
                            options={
                                'A': q_data['choices']['A'],
                                'B': q_data['choices']['B'], 
                                'C': q_data['choices']['C'],
                                'D': q_data['choices']['D']
                            },
                            correct_answer=q_data['correct'],
                            difficulty=2,  # Medium difficulty
                            estimated_time_seconds=60,  # 1 minute per question
                            explanation=f'Correct answer is {q_data["correct"]}',
                            skill_tag=f'UZBEKISTAN_{module_data["id"].upper()}',
                            is_active=True
                        )
                        module_questions.append(question)
                        questions_created += 1
                    
                    # Determine section type based on question content
                    if any('math' in q['id'].lower() or 'system' in q['prompt'].lower() or 'rocket' in q['prompt'].lower() or 'equation' in q['prompt'].lower() for q in module_data['questions']):
                        # Math module
                        module = BluebookModule.objects.create(
                            section=math_section,
                            module_order=1 if module_data['id'] == 'module_1' else 2,
                            time_limit_minutes=35,
                            difficulty_level='BASELINE' if module_data['id'] == 'module_1' else 'EASIER'
                        )
                    else:
                        # Reading & Writing module
                        module = BluebookModule.objects.create(
                            section=rw_section,
                            module_order=1 if module_data['id'] == 'module_1' else 2,
                            time_limit_minutes=32,
                            difficulty_level='BASELINE' if module_data['id'] == 'module_1' else 'EASIER'
                        )
                    
                    # Add questions to module
                    module.questions.add(*module_questions)
                    
                    self.stdout.write(f'  - {module_data["title"]}: {len(module_questions)} questions')
                
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully imported Uzbekistan SAT exam:\n'
                    f'  - Exam: {exam.title}\n'
                    f'  - Total Duration: {exam.total_duration_minutes} minutes\n'
                    f'  - Reading & Writing: {rw_section.total_duration_minutes} minutes\n'
                    f'  - Math: {math_section.total_duration_minutes} minutes\n'
                    f'  - Total Questions: {questions_created}\n'
                    f'  - Questions imported from: {yaml_file}'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error importing exam: {str(e)}'))
            raise
