"""
Comprehensive tests for Bluebook Digital SAT compliance.
Tests the exact structure and rules of the official Digital SAT.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta
from decimal import Decimal

from apps.mockexams.bluebook_models import (
    BluebookExam, BluebookSection, BluebookModule, 
    BluebookExamAttempt, BluebookQuestionResponse
)
from apps.questionbank.models import Question
from apps.users.models import StudentProfile

User = get_user_model()


class BluebookExamModelTests(TestCase):
    """Test cases for Bluebook Digital SAT exam models."""

    def setUp(self):
        """Set up test data."""
        self.teacher = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            first_name='Teacher',
            last_name='User',
            role='MAIN_TEACHER'
        )
        
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        # Create Bluebook exam
        self.exam = BluebookExam.objects.create(
            title='Digital SAT Practice Test',
            description='Official Digital SAT practice test',
            total_duration_minutes=134
        )
        
        # Create standard Digital SAT structure
        self._create_digital_sat_structure()

    def _create_digital_sat_structure(self):
        """Create the standard Digital SAT structure."""
        # Reading & Writing Section
        self.rw_section = BluebookSection.objects.create(
            exam=self.exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
        self.rw_module1 = BluebookModule.objects.create(
            section=self.rw_section,
            module_order=1,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        self.rw_module2 = BluebookModule.objects.create(
            section=self.rw_section,
            module_order=2,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        # Math Section
        self.math_section = BluebookSection.objects.create(
            exam=self.exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
        self.math_module1 = BluebookModule.objects.create(
            section=self.math_section,
            module_order=1,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )
        
        self.math_module2 = BluebookModule.objects.create(
            section=self.math_section,
            module_order=2,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )

    def test_bluebook_exam_creation(self):
        """Test Bluebook exam creation with validation."""
        self.assertEqual(self.exam.title, 'Digital SAT Practice Test')
        self.assertEqual(self.exam.total_duration_minutes, 134)  # 2 hours 14 minutes
        self.assertTrue(self.exam.is_active)

    def test_bluebook_exam_validation(self):
        """Test exam validation enforces Digital SAT structure."""
        # Test invalid duration
        invalid_exam = BluebookExam(
            title='Invalid Exam',
            total_duration_minutes=120  # Should be 134
        )
        
        with self.assertRaises(Exception):
            invalid_exam.clean()

    def test_section_structure(self):
        """Test Digital SAT section structure."""
        sections = self.exam.sections.all()
        self.assertEqual(sections.count(), 2)
        
        # Check Reading & Writing section
        rw_section = sections.get(section_type='READING_WRITING')
        self.assertEqual(rw_section.section_order, 1)
        self.assertEqual(rw_section.total_duration_minutes, 64)
        self.assertEqual(rw_section.modules.count(), 2)
        
        # Check Math section
        math_section = sections.get(section_type='MATH')
        self.assertEqual(math_section.section_order, 2)
        self.assertEqual(math_section.total_duration_minutes, 70)
        self.assertEqual(math_section.modules.count(), 2)

    def test_module_structure(self):
        """Test Digital SAT module structure."""
        # Test Reading & Writing modules
        rw_modules = self.rw_section.modules.all()
        self.assertEqual(rw_modules.count(), 2)
        
        for module in rw_modules:
            self.assertEqual(module.time_limit_minutes, 32)
            self.assertIn(module.module_order, [1, 2])
            if module.module_order == 1:
                self.assertEqual(module.difficulty_level, 'BASELINE')
        
        # Test Math modules
        math_modules = self.math_section.modules.all()
        self.assertEqual(math_modules.count(), 2)
        
        for module in math_modules:
            self.assertEqual(module.time_limit_minutes, 35)
            self.assertIn(module.module_order, [1, 2])
            if module.module_order == 1:
                self.assertEqual(module.difficulty_level, 'BASELINE')

    def test_module_validation(self):
        """Test module validation enforces Digital SAT rules."""
        # Test invalid Reading & Writing module time
        invalid_rw_module = BluebookModule(
            section=self.rw_section,
            module_order=1,
            time_limit_minutes=30,  # Should be 32
            difficulty_level='BASELINE'
        )
        
        with self.assertRaises(Exception):
            invalid_rw_module.clean()
        
        # Test invalid Math module time
        invalid_math_module = BluebookModule(
            section=self.math_section,
            module_order=1,
            time_limit_minutes=40,  # Should be 35
            difficulty_level='BASELINE'
        )
        
        with self.assertRaises(Exception):
            invalid_math_module.clean()

    def test_adaptive_module_properties(self):
        """Test adaptive module properties."""
        # Module 1 should not be adaptive
        self.assertFalse(self.rw_module1.is_adaptive)
        self.assertFalse(self.math_module1.is_adaptive)
        
        # Module 2 should be adaptive
        self.assertTrue(self.rw_module2.is_adaptive)
        self.assertTrue(self.math_module2.is_adaptive)

    def test_total_duration_calculation(self):
        """Test total duration calculation."""
        total_time = sum(
            section.total_duration_minutes 
            for section in self.exam.sections.all()
        )
        self.assertEqual(total_time, 134)  # 64 + 70 minutes


class BluebookExamAttemptTests(TestCase):
    """Test cases for Bluebook Digital SAT exam attempts."""

    def setUp(self):
        """Set up test data."""
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        # Create exam structure
        self.exam = BluebookExam.objects.create(
            title='Digital SAT Practice Test',
            total_duration_minutes=134
        )
        
        self.rw_section = BluebookSection.objects.create(
            exam=self.exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
        self.rw_module1 = BluebookModule.objects.create(
            section=self.rw_section,
            module_order=1,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        self.rw_module2 = BluebookModule.objects.create(
            section=self.rw_section,
            module_order=2,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        self.math_section = BluebookSection.objects.create(
            exam=self.exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
        self.math_module1 = BluebookModule.objects.create(
            section=self.math_section,
            module_order=1,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )
        
        self.math_module2 = BluebookModule.objects.create(
            section=self.math_section,
            module_order=2,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )

        # Create test questions
        self._create_test_questions()

        # Create attempt
        self.attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student
        )

    def _create_test_questions(self):
        """Create test questions for modules."""
        # Create Reading & Writing questions
        for i in range(27):  # 27 questions per module
            question = Question.objects.create(
                question_text=f'RW Question {i+1}',
                question_type='READING',
                options=['A', 'B', 'C', 'D'],
                correct_answer='A',
                difficulty='medium',
                is_active=True
            )
            self.rw_module1.questions.add(question)
        
        for i in range(27):
            question = Question.objects.create(
                question_text=f'RW Question {i+28}',
                question_type='WRITING',
                options=['A', 'B', 'C', 'D'],
                correct_answer='B',
                difficulty='medium',
                is_active=True
            )
            self.rw_module2.questions.add(question)
        
        # Create Math questions
        for i in range(22):  # 22 questions per module
            question = Question.objects.create(
                question_text=f'Math Question {i+1}',
                question_type='MATH',
                options=['A', 'B', 'C', 'D'],
                correct_answer='C',
                difficulty='medium',
                is_active=True
            )
            self.math_module1.questions.add(question)
        
        for i in range(22):
            question = Question.objects.create(
                question_text=f'Math Question {i+23}',
                question_type='MATH',
                options=['A', 'B', 'C', 'D'],
                correct_answer='D',
                difficulty='medium',
                is_active=True
            )
            self.math_module2.questions.add(question)

    def test_attempt_creation(self):
        """Test attempt creation."""
        self.assertEqual(self.attempt.exam, self.exam)
        self.assertEqual(self.attempt.student, self.student)
        self.assertFalse(self.attempt.is_completed)
        self.assertFalse(self.attempt.is_paused)
        self.assertIsNone(self.attempt.started_at)

    def test_start_exam(self):
        """Test starting the exam."""
        self.attempt.start_exam()
        
        self.assertIsNotNone(self.attempt.started_at)
        self.assertEqual(self.attempt.current_section, self.rw_section)
        self.assertEqual(self.attempt.current_module, self.rw_module1)
        self.assertIsNotNone(self.attempt.current_module_start_time)
        self.assertTrue(self.attempt.is_active)

    def test_module_progression(self):
        """Test module progression rules."""
        # Start exam
        self.attempt.start_exam()
        
        # Submit Module 1 with high performance (should route to harder)
        module1_answers = {
            str(q.id): 'A' for q in self.rw_module1.questions.all()[:20]  # 20 correct answers
        }
        
        self.attempt.submit_module(module1_answers)
        
        # Check adaptive routing
        self.assertEqual(self.attempt.reading_writing_difficulty, 'HARDER')
        self.assertEqual(self.attempt.current_module, self.rw_module2)
        self.assertIn(self.rw_module1, self.attempt.completed_modules.all())

    def test_adaptive_difficulty_routing(self):
        """Test adaptive difficulty routing based on performance."""
        # Start exam
        self.attempt.start_exam()
        
        # Test high performance (70%+ accuracy)
        high_performance_answers = {
            str(q.id): 'A' for q in self.rw_module1.questions.all()[:19]  # 19/27 = 70%
        }
        
        self.attempt.submit_module(high_performance_answers)
        self.assertEqual(self.attempt.reading_writing_difficulty, 'HARDER')
        
        # Reset for low performance test
        self.attempt.reading_writing_difficulty = 'BASELINE'
        self.attempt.current_module = self.rw_module1
        self.attempt.completed_modules.clear()
        
        # Test low performance (<40% accuracy)
        low_performance_answers = {
            str(q.id): 'A' for q in self.rw_module1.questions.all()[:10]  # 10/27 = 37%
        }
        
        self.attempt.submit_module(low_performance_answers)
        self.assertEqual(self.attempt.reading_writing_difficulty, 'EASIER')

    def test_no_cross_module_navigation(self):
        """Test that navigation is restricted to current module only."""
        # Start exam
        self.attempt.start_exam()
        
        # Can only access current module
        self.assertEqual(self.attempt.current_module, self.rw_module1)
        
        # Cannot access other modules
        self.assertNotEqual(self.attempt.current_module, self.rw_module2)
        self.assertNotEqual(self.attempt.current_module, self.math_module1)

    def test_module_time_tracking(self):
        """Test module time tracking."""
        # Start exam
        self.attempt.start_exam()
        
        # Simulate time passing
        original_start_time = self.attempt.current_module_start_time
        self.attempt.current_module_start_time = timezone.now() - timedelta(minutes=10)
        
        # Check time remaining
        time_remaining = self.attempt.current_module_time_remaining
        expected_remaining = (32 * 60) - (10 * 60)  # 32 minutes - 10 minutes
        self.assertAlmostEqual(time_remaining, expected_remaining, delta=10)

    def test_module_submission(self):
        """Test module submission with time tracking."""
        # Start exam
        self.attempt.start_exam()
        
        # Submit module with answers
        answers = {
            str(q.id): 'A' for q in self.rw_module1.questions.all()
        }
        
        original_start_time = self.attempt.current_module_start_time
        self.attempt.current_module_start_time = timezone.now() - timedelta(minutes=15)
        
        self.attempt.submit_module(answers)
        
        # Check time tracking
        module_id = str(self.rw_module1.id)
        self.assertIn(module_id, self.attempt.module_time_spent)
        time_spent = self.attempt.module_time_spent[module_id]
        self.assertGreater(time_spent, 14 * 60)  # At least 14 minutes
        self.assertLess(time_spent, 16 * 60)   # Less than 16 minutes

    def test_exam_completion(self):
        """Test complete exam flow."""
        # Start exam
        self.attempt.start_exam()
        
        # Complete all modules
        modules = [
            self.rw_module1, self.rw_module2,
            self.math_module1, self.math_module2
        ]
        
        for module in modules:
            answers = {
                str(q.id): 'A' for q in module.questions.all()
            }
            self.attempt.submit_module(answers)
        
        # Check exam completion
        self.assertTrue(self.attempt.is_completed)
        self.assertIsNotNone(self.attempt.submitted_at)
        self.assertIsNotNone(self.attempt.total_score)
        self.assertIsNotNone(self.attempt.reading_writing_score)
        self.assertIsNotNone(self.attempt.math_score)

    def test_scoring_with_adaptivity(self):
        """Test scoring model with adaptive difficulty impact."""
        # Start exam
        self.attempt.start_exam()
        
        # Submit Module 1 with high performance (routes to harder)
        high_performance_answers = {
            str(q.id): 'A' for q in self.rw_module1.questions.all()[:20]
        }
        self.attempt.submit_module(high_performance_answers)
        
        # Submit Module 2 (harder) with same performance
        harder_answers = {
            str(q.id): 'A' for q in self.rw_module2.questions.all()[:20]
        }
        self.attempt.submit_module(harder_answers)
        
        # Complete math modules
        for module in [self.math_module1, self.math_module2]:
            answers = {
                str(q.id): 'A' for q in module.questions.all()[:15]
            }
            self.attempt.submit_module(answers)
        
        # Check scoring includes difficulty bonus
        self.assertGreater(self.attempt.reading_writing_score, 600)  # Base score + bonus
        self.assertGreater(self.attempt.total_score, 1000)

    def test_question_flagging(self):
        """Test question flagging functionality."""
        # Start exam
        self.attempt.start_exam()
        
        # Flag a question
        question = self.rw_module1.questions.first()
        self.attempt.flag_question(question.id, flagged=True)
        
        # Check flag
        self.assertTrue(self.attempt.is_question_flagged(question.id))
        
        # Unflag
        self.attempt.flag_question(question.id, flagged=False)
        self.assertFalse(self.attempt.is_question_flagged(question.id))

    def test_module_progress_tracking(self):
        """Test module progress tracking."""
        # Start exam
        self.attempt.start_exam()
        
        # Answer some questions
        questions = list(self.rw_module1.questions.all()[:5])
        answers = {str(q.id): 'A' for q in questions}
        
        # Check progress
        progress = self.attempt.get_module_progress(self.rw_module1.id)
        expected_progress = (5 / self.rw_module1.questions.count()) * 100
        self.assertAlmostEqual(progress, expected_progress, places=1)

    def test_exam_constraints_validation(self):
        """Test exam constraints and validation."""
        # Test duplicate attempt prevention
        with self.assertRaises(Exception):
            BluebookExamAttempt.objects.create(
                exam=self.exam,
                student=self.student
            )
        
        # Test completion constraints
        self.attempt.is_completed = True
        self.attempt.submitted_at = None
        
        with self.assertRaises(Exception):
            self.attempt.clean()


class BluebookAPITests(APITestCase):
    """Test cases for Bluebook Digital SAT API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.teacher = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            first_name='Teacher',
            last_name='User',
            role='MAIN_TEACHER'
        )
        
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        # Create exam
        self.exam = BluebookExam.objects.create(
            title='Digital SAT Practice Test',
            total_duration_minutes=134
        )
        
        # Create structure
        self._create_digital_sat_structure()

    def _create_digital_sat_structure(self):
        """Create Digital SAT structure."""
        rw_section = BluebookSection.objects.create(
            exam=self.exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
        BluebookModule.objects.create(
            section=rw_section,
            module_order=1,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        BluebookModule.objects.create(
            section=rw_section,
            module_order=2,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        math_section = BluebookSection.objects.create(
            exam=self.exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
        BluebookModule.objects.create(
            section=math_section,
            module_order=1,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )
        
        BluebookModule.objects.create(
            section=math_section,
            module_order=2,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )

    def test_create_bluebook_exam(self):
        """Test creating a Bluebook exam."""
        self.client.force_authenticate(user=self.teacher)
        
        data = {
            'title': 'New Digital SAT Test',
            'description': 'Another practice test',
            'is_active': True
        }
        
        response = self.client.post('/api/bluebook/exams/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Digital SAT Test')
        
        # Check that structure was created
        exam = BluebookExam.objects.get(id=response.data['id'])
        self.assertEqual(exam.sections.count(), 2)
        self.assertEqual(exam.sections.get(section_type='READING_WRITING').modules.count(), 2)
        self.assertEqual(exam.sections.get(section_type='MATH').modules.count(), 2)

    def test_create_exam_student_forbidden(self):
        """Test that students cannot create exams."""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'title': 'Student Created Exam',
            'description': 'Should not be allowed'
        }
        
        response = self.client.post('/api/bluebook/exams/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_start_exam_attempt(self):
        """Test starting an exam attempt."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.post(f'/api/bluebook/exams/{self.exam.id}/start_attempt/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['exam']['id'], self.exam.id)
        self.assertEqual(response.data['student'], self.student.id)

    def test_start_attempt_duplicate_prevention(self):
        """Test that duplicate attempts are prevented."""
        self.client.force_authenticate(user=self.student)
        
        # Create first attempt
        response1 = self.client.post(f'/api/bluebook/exams/{self.exam.id}/start_attempt/')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create second attempt
        response2 = self.client.post(f'/api/bluebook/exams/{self.exam.id}/start_attempt/')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_start_exam_session(self):
        """Test starting the exam session."""
        # Create attempt first
        attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student
        )
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.post(f'/api/bluebook/attempts/{attempt.id}/start_exam/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['started_at'])
        self.assertIsNotNone(response.data['current_module'])
        self.assertGreater(response.data['current_module_time_remaining'], 0)

    def test_get_exam_status(self):
        """Test getting exam status."""
        # Create and start attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student
        )
        attempt.start_exam()
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/bluebook/attempts/{attempt.id}/status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['exam']['id'], self.exam.id)
        self.assertIsNotNone(response.data['current_module'])
        self.assertGreater(response.data['current_module_time_remaining'], 0)

    def test_get_current_module(self):
        """Test getting current module details."""
        # Create and start attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student
        )
        attempt.start_exam()
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/bluebook/attempts/{attempt.id}/current_module/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_order'], 1)
        self.assertEqual(response.data['time_limit_minutes'], 32)
        self.assertFalse(response.data['is_adaptive'])

    def test_submit_module(self):
        """Test submitting module answers."""
        # Create and start attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student
        )
        attempt.start_exam()
        
        self.client.force_authenticate(user=self.student)
        
        # Submit module answers
        data = {
            'answers': {'1': 'A', '2': 'B'},
            'flagged_questions': [1]
        }
        
        response = self.client.post(f'/api/bluebook/attempts/{attempt.id}/submit_module/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('1', response.data.get('module_answers', {}))
        self.assertIn('2', response.data.get('module_answers', {}))

    def test_flag_question(self):
        """Test flagging a question."""
        # Create and start attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student
        )
        attempt.start_exam()
        
        self.client.force_authenticate(user=self.student)
        
        # Flag question
        response = self.client.post(f'/api/bluebook/attempts/{attempt.id}/flag_question/', {
            'question_id': 1,
            'flagged': True
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['flagged'])
        
        # Unflag question
        response = self.client.post(f'/api/bluebook/attempts/{attempt.id}/flag_question/', {
            'question_id': 1,
            'flagged': False
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['flagged'])

    def test_get_exam_results(self):
        """Test getting exam results."""
        # Create completed attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student,
            is_completed=True,
            submitted_at=timezone.now(),
            total_score=1200,
            reading_writing_score=600,
            math_score=600
        )
        
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/bluebook/attempts/{attempt.id}/results/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_score'], 1200)
        self.assertEqual(response.data['reading_writing_score'], 600)
        self.assertEqual(response.data['math_score'], 600)

    def test_exam_structure_endpoint(self):
        """Test getting exam structure."""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(f'/api/bluebook/exams/{self.exam.id}/structure/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['sections']), 2)
        
        # Check Reading & Writing section
        rw_section = next(s for s in response.data['sections'] if s['section_type'] == 'READING_WRITING')
        self.assertEqual(rw_section['total_duration_minutes'], 64)
        self.assertEqual(len(rw_section['modules']), 2)
        
        # Check Math section
        math_section = next(s for s in response.data['sections'] if s['section_type'] == 'MATH')
        self.assertEqual(math_section['total_duration_minutes'], 70)
        self.assertEqual(len(math_section['modules']), 2)

    def test_exam_statistics_endpoint(self):
        """Test exam statistics endpoint (admin only)."""
        self.client.force_authenticate(user=self.teacher)
        
        # Create some attempts
        BluebookExamAttempt.objects.create(
            exam=self.exam,
            student=self.student,
            is_completed=True,
            total_score=1200
        )
        
        response = self.client.get('/api/bluebook/management/exam_statistics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_exams', response.data)
        self.assertIn('total_attempts', response.data)
        self.assertIn('completed_attempts', response.data)
        self.assertIn('average_score', response.data)


class BluebookComplianceTests(TestCase):
    """Test cases for strict Digital SAT compliance."""

    def setUp(self):
        """Set up test data."""
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            role='STUDENT'
        )

    def test_digital_sat_duration_compliance(self):
        """Test that exams comply with Digital SAT duration requirements."""
        exam = BluebookExam.objects.create(
            title='Digital SAT Test',
            total_duration_minutes=134
        )
        
        # Create structure
        rw_section = BluebookSection.objects.create(
            exam=exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
        math_section = BluebookSection.objects.create(
            exam=exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
        # Verify total duration
        total_time = rw_section.total_duration_minutes + math_section.total_duration_minutes
        self.assertEqual(total_time, 134)  # 2 hours 14 minutes

    def test_module_timing_compliance(self):
        """Test that modules comply with Digital SAT timing requirements."""
        exam = BluebookExam.objects.create(
            title='Digital SAT Test',
            total_duration_minutes=134
        )
        
        # Reading & Writing modules must be 32 minutes each
        rw_section = BluebookSection.objects.create(
            exam=exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
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
            difficulty_level='BASELINE'
        )
        
        # Math modules must be 35 minutes each
        math_section = BluebookSection.objects.create(
            exam=exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
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
            difficulty_level='BASELINE'
        )
        
        # Verify timing
        self.assertEqual(rw_module1.time_limit_minutes, 32)
        self.assertEqual(rw_module2.time_limit_minutes, 32)
        self.assertEqual(math_module1.time_limit_minutes, 35)
        self.assertEqual(math_module2.time_limit_minutes, 35)

    def test_adaptive_structure_compliance(self):
        """Test that adaptive structure complies with Digital SAT rules."""
        exam = BluebookExam.objects.create(
            title='Digital SAT Test',
            total_duration_minutes=134
        )
        
        # Create sections
        rw_section = BluebookSection.objects.create(
            exam=exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
        math_section = BluebookSection.objects.create(
            exam=exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
        # Module 1 must be baseline
        rw_module1 = BluebookModule.objects.create(
            section=rw_section,
            module_order=1,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        math_module1 = BluebookModule.objects.create(
            section=math_section,
            module_order=1,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )
        
        # Module 2 must be adaptive (initially baseline, will be set adaptively)
        rw_module2 = BluebookModule.objects.create(
            section=rw_section,
            module_order=2,
            time_limit_minutes=32,
            difficulty_level='BASELINE'
        )
        
        math_module2 = BluebookModule.objects.create(
            section=math_section,
            module_order=2,
            time_limit_minutes=35,
            difficulty_level='BASELINE'
        )
        
        # Verify adaptive properties
        self.assertFalse(rw_module1.is_adaptive)
        self.assertFalse(math_module1.is_adaptive)
        self.assertTrue(rw_module2.is_adaptive)
        self.assertTrue(math_module2.is_adaptive)

    def test_scoring_range_compliance(self):
        """Test that scoring complies with Digital SAT range requirements."""
        exam = BluebookExam.objects.create(
            title='Digital SAT Test',
            total_duration_minutes=134
        )
        
        # Create structure
        rw_section = BluebookSection.objects.create(
            exam=exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
        math_section = BluebookSection.objects.create(
            exam=exam,
            section_type='MATH',
            section_order=2,
            total_duration_minutes=70
        )
        
        # Create completed attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=exam,
            student=self.student,
            is_completed=True,
            submitted_at=timezone.now(),
            reading_writing_score=600,
            math_score=600,
            total_score=1200
        )
        
        # Verify scoring ranges
        self.assertGreaterEqual(attempt.reading_writing_score, 200)
        self.assertLessEqual(attempt.reading_writing_score, 800)
        self.assertGreaterEqual(attempt.math_score, 200)
        self.assertLessEqual(attempt.math_score, 800)
        self.assertGreaterEqual(attempt.total_score, 400)
        self.assertLessEqual(attempt.total_score, 1600)

    def test_navigation_restrictions(self):
        """Test that navigation restrictions comply with Digital SAT rules."""
        exam = BluebookExam.objects.create(
            title='Digital SAT Test',
            total_duration_minutes=134
        )
        
        # Create structure
        rw_section = BluebookSection.objects.create(
            exam=exam,
            section_type='READING_WRITING',
            section_order=1,
            total_duration_minutes=64
        )
        
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
            difficulty_level='BASELINE'
        )
        
        # Create attempt
        attempt = BluebookExamAttempt.objects.create(
            exam=exam,
            student=self.student
        )
        
        # Start exam
        attempt.start_exam()
        
        # Verify current module is Module 1
        self.assertEqual(attempt.current_module, rw_module1)
        
        # Cannot access Module 2 yet
        self.assertNotEqual(attempt.current_module, rw_module2)
        
        # Submit Module 1
        answers = {'1': 'A'}
        attempt.submit_module(answers)
        
        # Now should be in Module 2
        self.assertEqual(attempt.current_module, rw_module2)
        
        # Cannot go back to Module 1
        self.assertNotEqual(attempt.current_module, rw_module1)
        self.assertIn(rw_module1, attempt.completed_modules.all())
