"""
Tests for the mockexams app with Bluebook-style functionality.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from apps.mockexams.models import MockExam, MockExamAttempt
from apps.questionbank.models import Question
from apps.users.models import StudentProfile

User = get_user_model()


class MockExamModelTests(TestCase):
    """Test cases for MockExam model."""

    def setUp(self):
        """Set up test data."""
        self.teacher = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            first_name='Teacher',
            last_name='User',
            role='TEACHER'
        )
        
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        # Create test questions
        self.math_question = Question.objects.create(
            question_text='What is 2 + 2?',
            question_type='MATH',
            options=['3', '4', '5', '6'],
            correct_answer='B',
            difficulty='easy',
            is_active=True
        )

        self.reading_question = Question.objects.create(
            question_text='What is the main idea?',
            question_type='READING',
            options=['A', 'B', 'C', 'D'],
            correct_answer='A',
            difficulty='medium',
            is_active=True
        )

        # Create test exam
        self.mock_exam = MockExam.objects.create(
            title='SAT Practice Test',
            description='Full-length SAT practice test',
            exam_type='FULL',
            math_time_limit=2700,  # 45 minutes
            reading_time_limit=2400,  # 40 minutes
            writing_time_limit=2400,  # 40 minutes
            is_active=True
        )
        
        self.mock_exam.math_questions.add(self.math_question)
        self.mock_exam.reading_questions.add(self.reading_question)

    def test_mock_exam_creation(self):
        """Test MockExam creation."""
        self.assertEqual(self.mock_exam.title, 'SAT Practice Test')
        self.assertEqual(self.mock_exam.exam_type, 'FULL')
        self.assertTrue(self.mock_exam.is_active)

    def test_total_questions_property(self):
        """Test total_questions property."""
        self.assertEqual(self.mock_exam.total_questions, 2)

    def test_total_time_seconds_property(self):
        """Test total_time_seconds property."""
        expected_time = 2700 + 2400 + 2400  # Sum of all sections
        self.assertEqual(self.mock_exam.total_time_seconds, expected_time)

    def test_get_section_questions(self):
        """Test get_section_questions method."""
        math_questions = self.mock_exam.get_section_questions('math')
        self.assertEqual(math_questions.count(), 1)
        self.assertEqual(math_questions.first().question_type, 'MATH')

    def test_get_section_time_limit(self):
        """Test get_section_time_limit method."""
        math_time = self.mock_exam.get_section_time_limit('math')
        self.assertEqual(math_time, 2700)

    def test_exam_validation(self):
        """Test exam validation."""
        # Test valid exam
        self.mock_exam.clean()  # Should not raise

        # Test invalid exam (no questions)
        empty_exam = MockExam(
            title='Empty Exam',
            exam_type='FULL',
            math_time_limit=2700,
            reading_time_limit=2400,
            writing_time_limit=2400
        )
        with self.assertRaises(Exception):
            empty_exam.clean()


class MockExamAttemptModelTests(TestCase):
    """Test cases for MockExamAttempt model."""

    def setUp(self):
        """Set up test data."""
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        self.mock_exam = MockExam.objects.create(
            title='SAT Practice Test',
            exam_type='FULL',
            math_time_limit=2700,
            reading_time_limit=2400,
            writing_time_limit=2400,
            is_active=True
        )

        self.attempt = MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student
        )

    def test_attempt_creation(self):
        """Test MockExamAttempt creation."""
        self.assertEqual(self.attempt.mock_exam, self.mock_exam)
        self.assertEqual(self.attempt.student, self.student)
        self.assertFalse(self.attempt.is_completed)

    def test_duration_seconds_property(self):
        """Test duration_seconds property."""
        # Test with submitted attempt
        self.attempt.submitted_at = timezone.now() + timedelta(hours=1)
        self.attempt.save()
        
        duration = self.attempt.duration_seconds
        self.assertAlmostEqual(duration, 3600, delta=10)  # 1 hour in seconds

    def test_calculate_raw_scores(self):
        """Test calculate_raw_scores method."""
        # Set up answers
        self.attempt.answers = {
            'math': {'1': 'B'},  # Correct answer
            'reading': {'2': 'A'}  # Correct answer
        }
        self.attempt.save()

        raw_score = self.attempt.calculate_raw_scores()
        self.assertEqual(raw_score, 2)  # 2 correct answers

    def test_convert_to_sat_score(self):
        """Test convert_to_sat_score method."""
        self.attempt.math_raw_score = 30
        self.attempt.reading_raw_score = 25
        self.attempt.writing_raw_score = 20

        sat_score = self.attempt.convert_to_sat_score()
        self.assertIsNotNone(sat_score)
        self.assertGreaterEqual(sat_score, 400)
        self.assertLessEqual(sat_score, 1600)

    def test_submit_exam(self):
        """Test submit_exam method."""
        self.attempt.answers = {
            'math': {'1': 'B'},
            'reading': {'2': 'A'}
        }
        self.attempt.save()

        self.attempt.submit_exam()
        
        self.assertTrue(self.attempt.is_completed)
        self.assertIsNotNone(self.attempt.submitted_at)
        self.assertIsNotNone(self.attempt.sat_score)

    def test_get_section_progress(self):
        """Test get_section_progress method."""
        # Set up partial answers
        self.attempt.answers = {
            'math': {'1': 'B'},
            'reading': {}
        }
        self.attempt.save()

        math_progress = self.attempt.get_section_progress('math')
        reading_progress = self.attempt.get_section_progress('reading')

        self.assertEqual(math_progress, 100.0)  # All math questions answered
        self.assertEqual(reading_progress, 0.0)  # No reading questions answered


class MockExamAPITests(APITestCase):
    """Test cases for MockExam API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.teacher = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            first_name='Teacher',
            last_name='User',
            role='TEACHER'
        )
        
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        # Create test questions
        self.math_question = Question.objects.create(
            question_text='What is 2 + 2?',
            question_type='MATH',
            options=['3', '4', '5', '6'],
            correct_answer='B',
            difficulty='easy',
            is_active=True
        )

        # Create test exam
        self.mock_exam = MockExam.objects.create(
            title='SAT Practice Test',
            description='Full-length SAT practice test',
            exam_type='FULL',
            math_time_limit=2700,
            reading_time_limit=2400,
            writing_time_limit=2400,
            is_active=True
        )
        
        self.mock_exam.math_questions.add(self.math_question)

    def test_get_exams_student(self):
        """Test getting exams as student."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/mock-exams/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'SAT Practice Test')

    def test_get_exams_teacher(self):
        """Test getting exams as teacher."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/mock-exams/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_start_exam(self):
        """Test starting an exam."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/mock-exams/{self.mock_exam.id}/start/')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that attempt was created
        attempt = MockExamAttempt.objects.get(student=self.student, mock_exam=self.mock_exam)
        self.assertFalse(attempt.is_completed)

    def test_start_exam_already_completed(self):
        """Test starting an already completed exam."""
        # Create completed attempt
        MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student,
            is_completed=True,
            submitted_at=timezone.now()
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/mock-exams/{self.mock_exam.id}/start/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_exam_sections(self):
        """Test getting exam sections."""
        # Start exam first
        attempt = MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/mock-exams/{self.mock_exam.id}/sections/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_submit_section(self):
        """Test submitting a section."""
        # Start exam first
        attempt = MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student
        )
        
        self.client.force_authenticate(user=self.student)
        data = {
            'section': 'math',
            'answers': {'1': 'B'},
            'time_spent_seconds': 1800
        }
        response = self.client.post(f'/api/mock-exams/{self.mock_exam.id}/submit_section/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_submit_exam(self):
        """Test submitting the entire exam."""
        # Start exam first
        attempt = MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student,
            answers={
                'math': {'1': 'B'},
                'reading': {},
                'writing': {}
            }
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/mock-exams/{self.mock_exam.id}/submit_exam/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that exam is completed
        attempt.refresh_from_db()
        self.assertTrue(attempt.is_completed)

    def test_get_my_attempts(self):
        """Test getting student's attempts."""
        # Create attempts
        MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student,
            is_completed=True
        )
        
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/mock-exam-attempts/my_attempts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_exam_statistics(self):
        """Test getting exam statistics (teacher/admin only)."""
        # Create completed attempts
        MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student,
            is_completed=True,
            sat_score=1200
        )
        
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/mock-exams/stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_attempts', response.data)
        self.assertIn('average_sat_score', response.data)


class BluebookAnalyticsTests(APITestCase):
    """Test cases for Bluebook-style analytics endpoints."""

    def setUp(self):
        """Set up test data."""
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        self.mock_exam = MockExam.objects.create(
            title='SAT Practice Test',
            exam_type='FULL',
            math_time_limit=2700,
            reading_time_limit=2400,
            writing_time_limit=2400,
            is_active=True
        )

        # Create completed attempts with different scores
        for score in [1000, 1100, 1200]:
            MockExamAttempt.objects.create(
                mock_exam=self.mock_exam,
                student=self.student,
                is_completed=True,
                sat_score=score,
                math_scaled_score=400 + score // 3,
                reading_scaled_score=300 + score // 3,
                writing_scaled_score=300 + score // 3,
                submitted_at=timezone.now() - timedelta(days=score - 999)
            )

    def test_performance_trends(self):
        """Test performance trends endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-analytics/performance_trends/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('trends', response.data)
        self.assertIn('summary', response.data)
        
        # Check trend data structure
        trends = response.data['trends']
        self.assertEqual(len(trends), 3)  # 3 attempts
        self.assertIn('total_score', trends[0])
        self.assertIn('date', trends[0])

    def test_weak_areas(self):
        """Test weak areas analysis endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-analytics/weak_areas/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('weak_areas', response.data)
        self.assertIn('overall_analysis', response.data)

    def test_comparative_analysis(self):
        """Test comparative analysis endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-analytics/comparative_analysis/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('student_performance', response.data)
        self.assertIn('peer_comparison', response.data)
        self.assertIn('percentiles', response.data)

    def test_score_prediction(self):
        """Test score prediction endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-analytics/score_prediction/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('predicted_score', response.data)
        self.assertIn('confidence', response.data)
        self.assertIn('trend', response.data)

    def test_adaptive_recommendations(self):
        """Test adaptive recommendations endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-analytics/adaptive_recommendations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recommendations', response.data)
        self.assertIn('focus_areas', response.data)
        self.assertIn('study_plan', response.data)


class BluebookPerformanceTests(APITestCase):
    """Test cases for Bluebook performance tracking endpoints."""

    def setUp(self):
        """Set up test data."""
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='STUDENT'
        )

        self.mock_exam = MockExam.objects.create(
            title='SAT Practice Test',
            exam_type='FULL',
            math_time_limit=2700,
            reading_time_limit=2400,
            writing_time_limit=2400,
            is_active=True
        )

        # Create active attempt
        self.active_attempt = MockExamAttempt.objects.create(
            mock_exam=self.mock_exam,
            student=self.student,
            is_completed=False
        )

    def test_real_time_metrics(self):
        """Test real-time metrics endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-performance/real_time_metrics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['active_session'])
        self.assertEqual(response.data['attempt_id'], self.active_attempt.id)
        self.assertIn('metrics', response.data)

    def test_save_response(self):
        """Test saving question response."""
        self.client.force_authenticate(user=self.student)
        data = {
            'question_id': 1,
            'answer': 'B',
            'time_spent_seconds': 60,
            'marked_for_review': False
        }
        response = self.client.post('/api/exam-performance/save_response/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['saved'])

    def test_remaining_time(self):
        """Test remaining time endpoint."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-performance/remaining_time/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['active_session'])
        self.assertIn('remaining_time_seconds', response.data)
        self.assertIn('elapsed_time_seconds', response.data)

    def test_pause_session(self):
        """Test pausing exam session."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/exam-performance/pause_session/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['paused'])

    def test_resume_session(self):
        """Test resuming exam session."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/exam-performance/resume_session/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['resumed'])

    def test_no_active_session_metrics(self):
        """Test metrics when no active session exists."""
        # Complete the attempt
        self.active_attempt.is_completed = True
        self.active_attempt.save()
        
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/exam-performance/real_time_metrics/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['active_session'])
