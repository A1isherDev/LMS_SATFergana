# SAT LMS Platform - Architecture Document

## Overview
Production-ready SAT-focused Learning Management System for private education centers.

## Tech Stack
- **Backend**: Django 6.0+ with Django REST Framework
- **Database**: PostgreSQL
- **Async Tasks**: Celery + Redis
- **Frontend**: React/Next.js (to be implemented)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Architecture**: Modular, scalable, analytics-ready

## Database Schema Design

### Core Models

#### 1. User (Custom User Model)
- Extends AbstractUser
- `email` as unique identifier
- `role`: STUDENT, TEACHER, ADMIN
- `is_active`, `date_joined`
- `invitation_code`: For invitation-only access
- `invited_by`: ForeignKey to User (who invited them)

#### 2. StudentProfile
- `user`: OneToOne to User
- `target_sat_score`: Integer (400-1600)
- `estimated_current_score`: Integer (400-1600)
- `sat_exam_date`: DateTime (for countdown timer)
- `weak_areas`: JSONField (Math, Reading, Writing breakdown)
- `created_at`, `updated_at`

#### 3. Class
- `name`: CharField
- `teacher`: ForeignKey to User (role=TEACHER)
- `students`: ManyToMany to User (role=STUDENT)
- `start_date`, `end_date`
- `is_active`: Boolean
- `created_at`, `updated_at`

#### 4. Homework
- `class`: ForeignKey to Class
- `title`: CharField
- `description`: TextField
- `assigned_by`: ForeignKey to User (teacher)
- `due_date`: DateTime
- `questions`: ManyToMany to Question (from QuestionBank)
- `max_score`: Integer
- `created_at`, `updated_at`

#### 5. HomeworkSubmission
- `homework`: ForeignKey to Homework
- `student`: ForeignKey to User
- `submitted_at`: DateTime (null if not submitted)
- `is_late`: Boolean
- `score`: Integer (null until graded)
- `answers`: JSONField (question_id -> answer mapping)
- `time_spent`: Integer (seconds)
- `created_at`, `updated_at`

#### 6. Question (Question Bank)
- `question_type`: CharField (MATH, READING, WRITING)
- `skill_tag`: CharField (e.g., "Algebra", "Reading Comprehension")
- `difficulty`: Integer (1-5)
- `question_text`: TextField
- `question_image`: ImageField (optional)
- `options`: JSONField (for multiple choice)
- `correct_answer`: CharField/Integer
- `explanation`: TextField
- `estimated_time_seconds`: Integer
- `created_at`, `updated_at`

#### 7. QuestionAttempt
- `question`: ForeignKey to Question
- `student`: ForeignKey to User
- `selected_answer`: CharField/Integer
- `is_correct`: Boolean
- `time_spent_seconds`: Integer
- `attempted_at`: DateTime
- `context`: CharField (HOMEWORK, MOCK_EXAM, PRACTICE)

#### 8. MockExam
- `title`: CharField
- `exam_type`: CharField (FULL, MATH_ONLY, READING_WRITING_ONLY)
- `total_questions`: Integer
- `math_questions`: ManyToMany to Question (type=MATH)
- `reading_questions`: ManyToMany to Question (type=READING)
- `writing_questions`: ManyToMany to Question (type=WRITING)
- `math_time_limit`: Integer (seconds)
- `reading_time_limit`: Integer (seconds)
- `writing_time_limit`: Integer (seconds)
- `is_active`: Boolean
- `created_at`, `updated_at`

#### 9. MockExamAttempt
- `mock_exam`: ForeignKey to MockExam
- `student`: ForeignKey to User
- `started_at`: DateTime
- `submitted_at`: DateTime (null if in progress)
- `math_raw_score`: Integer (null until submitted)
- `reading_raw_score`: Integer (null until submitted)
- `writing_raw_score`: Integer (null until submitted)
- `total_raw_score`: Integer (null until submitted)
- `sat_score`: Integer (400-1600, null until converted)
- `answers`: JSONField (question_id -> answer mapping)
- `time_spent_by_section`: JSONField
- `is_completed`: Boolean
- `created_at`, `updated_at`

#### 10. Flashcard
- `word`: CharField (vocabulary word)
- `definition`: TextField
- `example_sentence`: TextField (optional)
- `difficulty`: Integer (1-5)
- `created_at`, `updated_at`

#### 11. FlashcardProgress
- `flashcard`: ForeignKey to Flashcard
- `student`: ForeignKey to User
- `last_reviewed`: DateTime
- `next_review`: DateTime (spaced repetition)
- `review_count`: Integer
- `ease_factor`: Float (for spaced repetition algorithm)
- `interval_days`: Integer
- `is_mastered`: Boolean
- `created_at`, `updated_at`

#### 12. Ranking
- `student`: ForeignKey to User
- `period_type`: CharField (WEEKLY, MONTHLY, ALL_TIME)
- `period_start`: DateTime
- `period_end`: DateTime
- `total_points`: Integer
- `homework_completion_rate`: Float
- `homework_accuracy`: Float
- `mock_exam_scores`: JSONField (list of recent scores)
- `rank`: Integer
- `created_at`, `updated_at`

#### 13. Invitation
- `code`: CharField (unique)
- `invited_by`: ForeignKey to User
- `email`: EmailField
- `role`: CharField (STUDENT, TEACHER)
- `is_used`: Boolean
- `used_by`: ForeignKey to User (null until used)
- `used_at`: DateTime (null until used)
- `expires_at`: DateTime
- `created_at`

## Django Apps Structure

```
sat_lms/
├── config/              # Main Django project config
├── users/               # User management, authentication, invitations
├── classes/             # Class management, teacher-student relationships
├── homework/            # Homework assignments and submissions
├── questionbank/        # Question bank, question attempts
├── mockexams/           # Mock exam creation and attempts
├── flashcards/          # Vocabulary flashcards with spaced repetition
├── rankings/            # Leaderboards and ranking calculations
├── analytics/           # Progress tracking, statistics, pie charts
└── common/              # Shared utilities, mixins, base classes
```

## Key Design Decisions

### 1. Analytics-First Architecture
- All user actions (question attempts, submissions, exam completions) are tracked
- JSONFields used strategically for flexible data storage (answers, time tracking)
- Separate Ranking model allows for efficient leaderboard queries
- QuestionAttempt model enables detailed analytics on weak areas

### 2. Scalability Considerations
- Indexes on frequently queried fields (student, homework, exam, dates)
- ManyToMany relationships for flexible question assignment
- Separate tracking models (QuestionAttempt, FlashcardProgress) for analytics
- Celery tasks for heavy computations (ranking calculations, score conversions)

### 3. SAT Score Conversion
- Raw score → SAT score conversion will be implemented as a utility function
- Conversion tables stored in constants or database for easy updates
- Historical tracking in MockExamAttempt for comparison

### 4. Spaced Repetition Algorithm
- SM-2 algorithm variant for flashcard scheduling
- next_review calculated based on ease_factor and interval_days
- Review count and mastery tracking for analytics

### 5. Ranking System
- Separate Ranking model for each period (weekly/monthly/all-time)
- Celery task to recalculate rankings periodically
- Supports reset functionality via period_start/period_end

### 6. Invitation System
- Unique invitation codes
- Email-based invitations
- Role assignment at invitation time
- Expiration and usage tracking

## API Endpoints Structure

### Authentication
- `POST /api/auth/register/` - Register with invitation code
- `POST /api/auth/login/` - JWT login
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout

### Users & Profiles
- `GET /api/users/me/` - Current user profile
- `PATCH /api/users/me/` - Update profile
- `GET /api/users/students/` - List students (teacher/admin)
- `POST /api/users/invitations/` - Create invitation (admin/teacher)

### Classes
- `GET /api/classes/` - List classes (filtered by role)
- `POST /api/classes/` - Create class (teacher/admin)
- `GET /api/classes/{id}/` - Class details
- `GET /api/classes/{id}/leaderboard/` - Class leaderboard

### Homework
- `GET /api/homework/` - List homework (filtered by student/teacher)
- `POST /api/homework/` - Create homework (teacher)
- `GET /api/homework/{id}/` - Homework details
- `POST /api/homework/{id}/submit/` - Submit homework
- `GET /api/homework/{id}/submissions/` - View submissions (teacher)

### Question Bank
- `GET /api/questions/` - List questions (with filters)
- `POST /api/questions/` - Create question (admin/teacher)
- `GET /api/questions/{id}/` - Question details
- `POST /api/questions/{id}/attempt/` - Record question attempt

### Mock Exams
- `GET /api/mock-exams/` - List available mock exams
- `POST /api/mock-exams/{id}/start/` - Start mock exam
- `GET /api/mock-exams/attempts/{id}/` - Get attempt details
- `POST /api/mock-exams/attempts/{id}/submit/` - Submit section/complete exam
- `GET /api/mock-exams/attempts/` - List student's attempts

### Flashcards
- `GET /api/flashcards/` - List flashcards
- `GET /api/flashcards/due/` - Get flashcards due for review
- `POST /api/flashcards/{id}/review/` - Record flashcard review
- `GET /api/flashcards/progress/` - Get flashcard progress stats

### Rankings
- `GET /api/rankings/global/` - Global leaderboard
- `GET /api/rankings/class/{class_id}/` - Class leaderboard
- `GET /api/rankings/periods/` - Available ranking periods

### Analytics
- `GET /api/analytics/progress/` - Student progress overview
- `GET /api/analytics/homework-completion/` - Homework completion pie chart data
- `GET /api/analytics/weak-areas/` - Weak areas analysis
- `GET /api/analytics/mock-exam-history/` - Mock exam score history

## Background Tasks (Celery)

1. **Ranking Calculation**: Recalculate rankings for weekly/monthly periods
2. **Score Conversion**: Convert raw scores to SAT scores for mock exams
3. **Late Submission Detection**: Mark late submissions after deadline
4. **Flashcard Scheduling**: Update next_review dates based on spaced repetition
5. **Analytics Aggregation**: Pre-calculate common analytics queries

## Security Considerations

- JWT token expiration and refresh
- Role-based access control (RBAC)
- Invitation-only registration
- Student data isolation (students can only see their own data)
- Teacher access limited to their classes
- Admin access for platform management

## Future Enhancements

- Real-time notifications (WebSockets)
- File uploads for homework submissions
- Advanced analytics dashboards
- Mobile app support
- Integration with official SAT resources
- Automated weak area detection using ML
