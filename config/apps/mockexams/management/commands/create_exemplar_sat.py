"""
Management command to create an exemplar Digital SAT with realistic questions.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.mockexams.bluebook_models import BluebookExam, BluebookSection, BluebookModule
from apps.questionbank.models import Question
import json


class Command(BaseCommand):
    help = 'Create an exemplar Digital SAT with realistic sample questions'

    def handle(self, *args, **options):
        self.stdout.write('Creating Exemplar Digital SAT with realistic questions...')
        
        try:
            with transaction.atomic():
                # Create the exemplar exam
                exam = BluebookExam.objects.create(
                    title='Exemplar Digital SAT - Official Practice',
                    description='Complete Digital SAT practice test with realistic questions and official timing',
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
                
                # Create sample questions for exemplar test
                self._create_exemplar_questions()
                
                # Get the exemplar questions
                math_questions = list(Question.objects.filter(question_type='MATH', skill_tag__startswith='EXEMPLAR_')[:44])
                reading_questions = list(Question.objects.filter(question_type='READING', skill_tag__startswith='EXEMPLAR_')[:32])
                writing_questions = list(Question.objects.filter(question_type='WRITING', skill_tag__startswith='EXEMPLAR_')[:22])
                
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
                    f'Successfully created Exemplar Digital SAT:\n'
                    f'  - Exam: {exam.title}\n'
                    f'  - Total Duration: {exam.total_duration_minutes} minutes\n'
                    f'  - Reading & Writing: {rw_section.total_duration_minutes} minutes (2 modules)\n'
                    f'    - Module 1: {rw_module1.questions.count()} questions\n'
                    f'    - Module 2: {rw_module2.questions.count()} questions\n'
                    f'  - Math: {math_section.total_duration_minutes} minutes (2 modules)\n'
                    f'    - Module 1: {math_module1.questions.count()} questions\n'
                    f'    - Module 2: {math_module2.questions.count()} questions\n'
                    f'  - Total Questions: {rw_module1.questions.count() + rw_module2.questions.count() + math_module1.questions.count() + math_module2.questions.count()}\n'
                    f'  - All questions are exemplar level with realistic content'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating exemplar SAT: {str(e)}'))
            raise

    def _create_exemplar_questions(self):
        """Create realistic exemplar questions for the Digital SAT."""
        
        # Clear existing exemplar questions (using skill_tag to identify)
        Question.objects.filter(skill_tag__startswith='EXEMPLAR_').delete()
        
        # Create Math exemplar questions
        math_questions = [
            {
                'question_text': 'If 3x + 7 = 22, what is the value of x?',
                'options': '{"A": "5", "B": "6", "C": "7", "D": "8"}',
                'correct_answer': 'A',
                'difficulty': 1,
                'estimated_time_seconds': 45,
                'explanation': 'Subtract 7 from both sides: 3x = 15, then divide by 3: x = 5',
                'skill_tag': 'EXEMPLAR_ALGEBRA'
            },
            {
                'question_text': 'What is the value of 2³ × 3²?',
                'options': '{"A": "36", "B": "72", "C": "108", "D": "144"}',
                'correct_answer': 'B',
                'difficulty': 1,
                'estimated_time_seconds': 30,
                'explanation': '2³ = 8, 3² = 9, so 8 × 9 = 72',
                'skill_tag': 'EXEMPLAR_EXPONENTS'
            },
            {
                'question_text': 'A circle has radius 6. What is its area?',
                'options': '{"A": "12π", "B": "18π", "C": "36π", "D": "72π"}',
                'correct_answer': 'C',
                'difficulty': 2,
                'estimated_time_seconds': 60,
                'explanation': 'Area = πr² = π(6)² = 36π',
                'skill_tag': 'EXEMPLAR_GEOMETRY'
            },
            {
                'question_text': 'If f(x) = 2x² - 3x + 1, what is f(3)?',
                'options': '{"A": "10", "B": "13", "C": "16", "D": "19"}',
                'correct_answer': 'A',
                'difficulty': 2,
                'estimated_time_seconds': 45,
                'explanation': 'f(3) = 2(3)² - 3(3) + 1 = 2(9) - 9 + 1 = 18 - 9 + 1 = 10',
                'skill_tag': 'EXEMPLAR_FUNCTIONS'
            },
            {
                'question_text': 'What is the slope of the line passing through points (2, 3) and (5, 9)?',
                'options': '{"A": "1", "B": "2", "C": "3", "D": "4"}',
                'correct_answer': 'B',
                'difficulty': 2,
                'estimated_time_seconds': 60,
                'explanation': 'Slope = (9-3)/(5-2) = 6/3 = 2',
                'skill_tag': 'EXEMPLAR_LINEAR_EQUATIONS'
            }
        ]
        
        # Create Reading exemplar questions
        reading_questions = [
            {
                'question_text': 'Passage: Climate change represents one of the most significant challenges facing humanity today. Scientists agree that rising global temperatures are primarily caused by human activities, particularly the burning of fossil fuels. The consequences include rising sea levels, extreme weather events, and disruptions to ecosystems worldwide.\n\nQuestion: According to the passage, what is the main argument the author makes about climate change?',
                'options': '{"A": "Climate change is primarily caused by natural cycles", "B": "Human activities are the main cause of climate change", "C": "Climate change effects are limited to polar regions", "D": "Fossil fuels have no impact on global temperatures"}',
                'correct_answer': 'B',
                'difficulty': 2,
                'estimated_time_seconds': 75,
                'explanation': 'The passage explicitly states that rising temperatures are "primarily caused by human activities, particularly the burning of fossil fuels."',
                'skill_tag': 'EXEMPLAR_MAIN_IDEA'
            },
            {
                'question_text': 'Passage: Climate change represents one of the most significant challenges facing humanity today. Scientists agree that rising global temperatures are primarily caused by human activities, particularly the burning of fossil fuels. The consequences include rising sea levels, extreme weather events, and disruptions to ecosystems worldwide.\n\nQuestion: What does the author suggest is the most urgent consequence of climate change?',
                'options': '{"A": "Economic disruption", "B": "Political instability", "C": "Multiple environmental impacts", "D": "Technological advancement"}',
                'correct_answer': 'C',
                'difficulty': 2,
                'estimated_time_seconds': 60,
                'explanation': 'The passage lists "rising sea levels, extreme weather events, and disruptions to ecosystems" as consequences, indicating multiple environmental impacts.',
                'skill_tag': 'EXEMPLAR_INFERENCE'
            }
        ]
        
        # Create Writing exemplar questions
        writing_questions = [
            {
                'question_text': 'Which choice best revises the underlined portion of the sentence? "The committee, which was formed last month, _______ meeting weekly to discuss the new policy."',
                'options': '{"A": "meets", "B": "met", "C": "will meet", "D": "has met"}',
                'correct_answer': 'A',
                'difficulty': 1,
                'estimated_time_seconds': 45,
                'explanation': 'The present tense "meets" is appropriate to indicate an ongoing action.',
                'skill_tag': 'EXEMPLAR_VERB_TENSE'
            },
            {
                'question_text': 'What change, if any, should be made to this sentence? "Each of the students were required to submit their homework on time."',
                'options': '{"A": "Change were to was", "B": "Change their to his or her", "C": "Change students to student", "D": "No change needed"}',
                'correct_answer': 'A',
                'difficulty': 2,
                'estimated_time_seconds': 60,
                'explanation': '"Each" is singular, so it requires the singular verb "was" instead of "were."',
                'skill_tag': 'EXEMPLAR_SUBJECT_VERB_AGREEMENT'
            }
        ]
        
        # Create the questions in the database
        created_count = 0
        
        for i, q_data in enumerate(math_questions):
            question = Question.objects.create(
                question_text=q_data['question_text'],
                question_type='MATH',
                options=q_data['options'],
                correct_answer=q_data['correct_answer'],
                difficulty=q_data['difficulty'],
                estimated_time_seconds=q_data['estimated_time_seconds'],
                explanation=q_data.get('explanation', ''),
                skill_tag=q_data['skill_tag'],
                is_active=True
            )
            created_count += 1
        
        for i, q_data in enumerate(reading_questions):
            question = Question.objects.create(
                question_text=q_data['question_text'],
                question_type='READING',
                options=q_data['options'],
                correct_answer=q_data['correct_answer'],
                difficulty=q_data['difficulty'],
                estimated_time_seconds=q_data['estimated_time_seconds'],
                explanation=q_data.get('explanation', ''),
                skill_tag=q_data['skill_tag'],
                is_active=True
            )
            created_count += 1
        
        for i, q_data in enumerate(writing_questions):
            question = Question.objects.create(
                question_text=q_data['question_text'],
                question_type='WRITING',
                options=q_data['options'],
                correct_answer=q_data['correct_answer'],
                difficulty=q_data['difficulty'],
                estimated_time_seconds=q_data['estimated_time_seconds'],
                explanation=q_data.get('explanation', ''),
                skill_tag=q_data['skill_tag'],
                is_active=True
            )
            created_count += 1
        
        self.stdout.write(f'Created {created_count} exemplar questions')
