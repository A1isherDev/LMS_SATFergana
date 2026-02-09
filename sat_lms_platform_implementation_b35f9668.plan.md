---
name: SAT LMS Platform Implementation
overview: Build a production-ready SAT-focused LMS platform with Django backend and Next.js frontend, implementing all core features including invitation system, student profiles, classes, homework, question bank, mock exams, flashcards, rankings, and analytics.
todos:
  - id: setup-dependencies
    content: Create requirements.txt with all Python dependencies and .env.example template
    status: completed
  - id: create-django-apps
    content: "Create all 9 Django apps: users, classes, homework, questionbank, mockexams, flashcards, rankings, analytics, common"
    status: completed
  - id: common-infrastructure
    content: "Implement common app: TimestampedModel, permissions (IsStudent, IsTeacher, etc.), SAT score conversion utils, spaced repetition algorithm"
    status: completed
  - id: users-app
    content: "Implement users app: Custom User model, StudentProfile, Invitation model, serializers, views, authentication endpoints"
    status: in_progress
  - id: classes-app
    content: "Implement classes app: Class model, serializers, views, class leaderboard endpoint"
    status: pending
  - id: questionbank-app
    content: "Implement questionbank app: Question model, QuestionAttempt model, filtering/search, attempt tracking"
    status: pending
  - id: homework-app
    content: "Implement homework app: Homework model, HomeworkSubmission model, auto-grading, Celery task for late submissions"
    status: pending
  - id: mockexams-app
    content: "Implement mockexams app: MockExam model, MockExamAttempt model, section-based timing, score conversion, auto-submit Celery task"
    status: pending
  - id: flashcards-app
    content: "Implement flashcards app: Flashcard model, FlashcardProgress model, spaced repetition algorithm (SM-2), review endpoints"
    status: pending
  - id: rankings-app
    content: "Implement rankings app: Ranking model, leaderboard views, Celery tasks for weekly/monthly resets"
    status: pending
  - id: analytics-app
    content: "Implement analytics app: Progress endpoints, homework completion charts, weak areas analysis, mock exam history"
    status: pending
  - id: url-routing
    content: "Set up URL routing: Update config/urls.py, create urls.py for each app, configure JWT auth endpoints"
    status: pending
  - id: celery-setup
    content: "Configure Celery: Create celery.py, implement background tasks (late submissions, auto-submit exams, ranking calculations)"
    status: pending
  - id: database-migrations
    content: Create and run database migrations for all apps, add indexes, set up initial admin user
    status: pending
  - id: nextjs-setup
    content: Initialize Next.js project, configure TypeScript, Tailwind CSS, project structure
    status: pending
  - id: frontend-api-client
    content: Create API client (axios), AuthContext, TypeScript types matching backend serializers
    status: pending
  - id: frontend-auth-pages
    content: "Build authentication pages: Login, Register (with invitation code)"
    status: pending
  - id: frontend-dashboard
    content: "Build student dashboard: Countdown timer, progress overview, recent activity"
    status: pending
  - id: frontend-core-pages
    content: "Build core pages: Classes, Homework, Question Bank, Mock Exams, Flashcards, Rankings, Analytics"
    status: pending
  - id: frontend-components
    content: "Build reusable components: Leaderboard, ProgressChart, QuestionCard, FlashcardReview, MockExamSection"
    status: pending
  - id: integration-testing
    content: Connect frontend to backend APIs, test end-to-end flows, handle errors and loading states
    status: pending
isProject: false
---

# SAT LMS Platform - Implementation Plan

## Current State

- Django project initialized in `config/` directory
- Architecture document created (`ARCHITECTURE.md`)
- Settings configured for PostgreSQL, DRF, JWT, Celery, CORS
- No Django apps created yet
- No models, serializers, or views implemented
- No frontend structure

## Implementation Strategy

### Phase 1: Backend Foundation

#### 1.1 Project Setup & Dependencies

- Create `requirements.txt` with all dependencies:
  - Django 6.0+, djangorestframework, djangorestframework-simplejwt
  - psycopg2-binary (PostgreSQL adapter)
  - celery, redis, django-celery-beat
  - corsheaders, pillow (for image uploads)
  - python-dotenv (for environment variables)
- Create `.env.example` template
- Update `.gitignore` to exclude virtualenv, .env, db files, media, staticfiles

#### 1.2 Create Django Apps

Create all 9 apps in `config/` directory:

- `users` - Custom User model, authentication, invitations
- `classes` - Class management, teacher-student relationships
- `homework` - Homework assignments and submissions
- `questionbank` - Question bank and attempt tracking
- `mockexams` - Mock exam creation and attempts
- `flashcards` - Vocabulary flashcards with spaced repetition
- `rankings` - Leaderboards and ranking calculations
- `analytics` - Progress tracking and statistics
- `common` - Shared utilities, mixins, base classes

#### 1.3 Common App (Base Infrastructure)

**File: `config/common/models.py`**

- `TimestampedModel` abstract base class (created_at, updated_at)
- `SoftDeleteModel` mixin if needed

**File: `config/common/permissions.py`**

- `IsStudent`, `IsTeacher`, `IsAdmin` permission classes
- `IsClassTeacher` - verify teacher owns the class
- `IsStudentInClass` - verify student belongs to class

**File: `config/common/utils.py`**

- SAT score conversion utilities (raw → scaled score)
- Date/time utilities for countdown timers
- Spaced repetition algorithm (SM-2 variant)

#### 1.4 Users App

**File: `config/users/models.py`**

- `User` model (extends AbstractUser):
  - email as USERNAME_FIELD (unique)
  - role choices: STUDENT, TEACHER, ADMIN
  - invitation_code, invited_by (ForeignKey)
  - Custom UserManager
- `StudentProfile` model:
  - OneToOne to User
  - target_sat_score, estimated_current_score (400-1600)
  - sat_exam_date (DateTimeField)
  - weak_areas (JSONField: {math: float, reading: float, writing: float})
  - Indexes on user, sat_exam_date
- `Invitation` model:
  - code (CharField, unique, indexed)
  - invited_by (ForeignKey to User)
  - email, role, is_used, used_by, used_at, expires_at
  - Methods: is_valid(), mark_as_used()

**File: `config/users/serializers.py`**

- `UserSerializer` - basic user info
- `StudentProfileSerializer` - profile with nested user
- `InvitationSerializer` - create/list invitations
- `RegisterSerializer` - registration with invitation validation

**File: `config/users/views.py`**

- `UserViewSet` - GET/PATCH /api/users/me/
- `StudentProfileViewSet` - GET/PATCH profile
- `InvitationViewSet` - POST /api/users/invitations/ (create), GET (list)
- `RegisterView` - POST /api/auth/register/ (with invitation code)

**File: `config/users/admin.py`**

- Register User, StudentProfile, Invitation with proper admin config

#### 1.5 Classes App

**File: `config/classes/models.py`**

- `Class` model:
  - name, teacher (ForeignKey to User, role=TEACHER)
  - students (ManyToMany to User, role=STUDENT)
  - start_date, end_date, is_active
  - Timestamps
  - Indexes on teacher, is_active, start_date

**File: `config/classes/serializers.py`**

- `ClassSerializer` - with nested teacher and students
- `ClassListSerializer` - lightweight for lists

**File: `config/classes/views.py`**

- `ClassViewSet` - CRUD operations
  - Students see only their classes
  - Teachers see their own classes + can create
  - Admins see all
- `ClassLeaderboardView` - GET /api/classes/{id}/leaderboard/

#### 1.6 QuestionBank App

**File: `config/questionbank/models.py`**

- `Question` model:
  - question_type: MATH, READING, WRITING
  - skill_tag (CharField, indexed for filtering)
  - difficulty (1-5, indexed)
  - question_text (TextField)
  - question_image (ImageField, optional)
  - options (JSONField: {A: "...", B: "...", C: "...", D: "..."})
  - correct_answer (CharField: "A", "B", etc.)
  - explanation (TextField)
  - estimated_time_seconds
  - Timestamps
  - Indexes on question_type, skill_tag, difficulty
- `QuestionAttempt` model:
  - question (ForeignKey, indexed)
  - student (ForeignKey, indexed)
  - selected_answer, is_correct
  - time_spent_seconds
  - attempted_at (DateTimeField, indexed)
  - context: HOMEWORK, MOCK_EXAM, PRACTICE
  - Composite index on (student, question, attempted_at)

**File: `config/questionbank/serializers.py`**

- `QuestionSerializer` - full question details (exclude correct_answer for students)
- `QuestionListSerializer` - for lists/filtering
- `QuestionAttemptSerializer` - record attempts

**File: `config/questionbank/views.py`**

- `QuestionViewSet` - list/filter questions, create (teacher/admin)
  - Filters: question_type, skill_tag, difficulty
  - Search: question_text
- `QuestionAttemptViewSet` - POST /api/questions/{id}/attempt/

#### 1.7 Homework App

**File: `config/homework/models.py`**

- `Homework` model:
  - class (ForeignKey to Class)
  - title, description
  - assigned_by (ForeignKey to User, teacher)
  - due_date (DateTimeField, indexed)
  - questions (ManyToMany to Question)
  - max_score (calculated from questions)
  - Timestamps
- `HomeworkSubmission` model:
  - homework (ForeignKey, indexed)
  - student (ForeignKey, indexed)
  - submitted_at (DateTimeField, nullable)
  - is_late (Boolean, auto-calculated)
  - score (Integer, nullable until graded)
  - answers (JSONField: {question_id: answer})
  - time_spent (Integer, seconds)
  - Composite index on (homework, student)
  - Method: calculate_score() - auto-grade from answers

**File: `config/homework/serializers.py`**

- `HomeworkSerializer` - with nested questions
- `HomeworkSubmissionSerializer` - submit/create submissions
- `HomeworkSubmissionDetailSerializer` - with grading info

**File: `config/homework/views.py`**

- `HomeworkViewSet` - CRUD (teachers), list (students see assigned)
- `HomeworkSubmissionViewSet` - submit homework, view submissions
- Celery task: `mark_late_submissions` - scheduled task to check deadlines

#### 1.8 MockExams App

**File: `config/mockexams/models.py`**

- `MockExam` model:
  - title, exam_type: FULL, MATH_ONLY, READING_WRITING_ONLY
  - total_questions (calculated)
  - math_questions, reading_questions, writing_questions (ManyToMany)
  - math_time_limit, reading_time_limit, writing_time_limit (seconds)
  - is_active
  - Timestamps
- `MockExamAttempt` model:
  - mock_exam (ForeignKey, indexed)
  - student (ForeignKey, indexed)
  - started_at, submitted_at (nullable)
  - math_raw_score, reading_raw_score, writing_raw_score (nullable)
  - total_raw_score, sat_score (400-1600, nullable)
  - answers (JSONField: {question_id: answer})
  - time_spent_by_section (JSONField: {math: int, reading: int, writing: int})
  - is_completed (Boolean)
  - Methods: calculate_raw_scores(), convert_to_sat_score()
  - Indexes on student, submitted_at, sat_score

**File: `config/mockexams/serializers.py`**

- `MockExamSerializer` - exam details
- `MockExamAttemptSerializer` - start exam, submit sections
- `MockExamAttemptDetailSerializer` - results with scores

**File: `config/mockexams/views.py`**

- `MockExamViewSet` - list available exams
- `MockExamAttemptViewSet`:
  - POST /api/mock-exams/{id}/start/ - create attempt
  - GET /api/mock-exams/attempts/{id}/ - get attempt details
  - POST /api/mock-exams/attempts/{id}/submit/ - submit section or complete
- Celery task: `auto_submit_exam` - auto-submit when time expires

#### 1.9 Flashcards App

**File: `config/flashcards/models.py`**

- `Flashcard` model:
  - word (CharField, indexed)
  - definition (TextField)
  - example_sentence (TextField, optional)
  - difficulty (1-5)
  - Timestamps
- `FlashcardProgress` model:
  - flashcard (ForeignKey, indexed)
  - student (ForeignKey, indexed)
  - last_reviewed, next_review (DateTimeField, indexed)
  - review_count, ease_factor (Float, default 2.5)
  - interval_days (Integer)
  - is_mastered (Boolean)
  - Methods: update_spaced_repetition(quality) - SM-2 algorithm
  - Composite index on (student, next_review)

**File: `config/flashcards/serializers.py`**

- `FlashcardSerializer` - card details
- `FlashcardProgressSerializer` - progress tracking
- `FlashcardReviewSerializer` - record review with quality (0-5)

**File: `config/flashcards/views.py`**

- `FlashcardViewSet` - list flashcards
- `FlashcardProgressViewSet`:
  - GET /api/flashcards/due/ - get cards due for review
  - POST /api/flashcards/{id}/review/ - record review
  - GET /api/flashcards/progress/ - progress stats

#### 1.10 Rankings App

**File: `config/rankings/models.py`**

- `Ranking` model:
  - student (ForeignKey, indexed)
  - period_type: WEEKLY, MONTHLY, ALL_TIME
  - period_start, period_end (DateTimeField, indexed)
  - total_points (Integer)
  - homework_completion_rate (Float)
  - homework_accuracy (Float)
  - mock_exam_scores (JSONField: list of recent scores)
  - rank (Integer, indexed)
  - Composite index on (period_type, period_start, rank)
  - Unique constraint on (student, period_type, period_start)

**File: `config/rankings/serializers.py`**

- `RankingSerializer` - leaderboard entry

**File: `config/rankings/views.py`**

- `GlobalLeaderboardView` - GET /api/rankings/global/?period=weekly
- `ClassLeaderboardView` - GET /api/rankings/class/{id}/?period=weekly
- Celery tasks:
  - `calculate_rankings` - recalculate for period
  - `reset_weekly_rankings` - scheduled weekly reset
  - `reset_monthly_rankings` - scheduled monthly reset

#### 1.11 Analytics App

**File: `config/analytics/views.py`**

- `ProgressOverviewView` - GET /api/analytics/progress/
  - Returns: target_score, current_estimate, days_until_exam, completion_stats
- `HomeworkCompletionView` - GET /api/analytics/homework-completion/
  - Returns: pie chart data (completed, late, pending)
- `WeakAreasView` - GET /api/analytics/weak-areas/
  - Returns: breakdown by skill_tag with accuracy percentages
- `MockExamHistoryView` - GET /api/analytics/mock-exam-history/
  - Returns: historical scores with trend analysis

**File: `config/analytics/utils.py`**

- Analytics calculation functions
- Weak area detection from QuestionAttempt data

#### 1.12 URL Configuration

**File: `config/config/urls.py`**

- Include all app URLs under `/api/`
- JWT auth endpoints: `/api/auth/login/`, `/api/auth/refresh/`
- Media/static file serving in development

**File: `config/users/urls.py`**, `config/classes/urls.py`, etc.

- URL routing for each app using ViewSets

#### 1.13 Celery Configuration

**File: `config/config/celery.py`**

- Celery app initialization
- Task discovery

**File: `config/homework/tasks.py`**

- `mark_late_submissions()` - check and mark late submissions

**File: `config/mockexams/tasks.py`**

- `auto_submit_exam(attempt_id)` - auto-submit expired exams

**File: `config/rankings/tasks.py`**

- `calculate_rankings(period_type, period_start)`
- `reset_weekly_rankings()`
- `reset_monthly_rankings()`

#### 1.14 Database Migrations

- Create initial migrations for all apps
- Add database indexes as specified in models
- Create migration for custom User model (must be first)

### Phase 2: Frontend Foundation (Next.js)

#### 2.1 Project Setup

- Initialize Next.js 14+ project in `frontend/` directory
- Configure TypeScript, ESLint, Prettier
- Set up project structure:
  ```
  frontend/
  ├── src/
  │   ├── app/          # Next.js App Router
  │   ├── components/   # Reusable components
  │   ├── lib/          # Utilities, API client
  │   ├── hooks/        # Custom React hooks
  │   ├── types/        # TypeScript types
  │   └── contexts/     # React contexts (Auth, etc.)
  ```


#### 2.2 Core Infrastructure

**File: `frontend/src/lib/api.ts`**

- Axios instance with JWT token injection
- API client functions for all endpoints
- Error handling and token refresh logic

**File: `frontend/src/contexts/AuthContext.tsx`**

- Authentication context provider
- Login, logout, token management
- Protected route wrapper

**File: `frontend/src/types/index.ts`**

- TypeScript interfaces matching backend serializers
- User, StudentProfile, Class, Homework, Question, etc.

#### 2.3 Key Pages Structure

- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/register/page.tsx` - Registration with invitation code
- `app/(dashboard)/dashboard/page.tsx` - Student dashboard
  - Countdown timer component
  - Progress overview cards
  - Recent homework/exams
- `app/(dashboard)/classes/page.tsx` - Class list
- `app/(dashboard)/classes/[id]/page.tsx` - Class details + leaderboard
- `app/(dashboard)/homework/page.tsx` - Homework list
- `app/(dashboard)/homework/[id]/page.tsx` - Homework detail + submission
- `app/(dashboard)/question-bank/page.tsx` - Question bank with filters
- `app/(dashboard)/mock-exams/page.tsx` - Available mock exams
- `app/(dashboard)/mock-exams/[id]/page.tsx` - Take mock exam (section-based)
- `app/(dashboard)/flashcards/page.tsx` - Flashcard review interface
- `app/(dashboard)/rankings/page.tsx` - Global leaderboard
- `app/(dashboard)/analytics/page.tsx` - Analytics dashboard with charts
- `app/(teacher)/...` - Teacher-specific pages (if role-based routing)

#### 2.4 Key Components

- `CountdownTimer.tsx` - SAT exam countdown (student-specific)
- `Leaderboard.tsx` - Reusable leaderboard component
- `ProgressChart.tsx` - Pie charts for homework completion
- `QuestionCard.tsx` - Question display component
- `FlashcardReview.tsx` - Spaced repetition flashcard interface
- `MockExamSection.tsx` - Section-based exam interface with timer

#### 2.5 UI Framework & Styling

- Install Tailwind CSS or Material-UI/Chakra UI
- Create design system (colors, typography, components)
- Responsive layout components

### Phase 3: Integration & Testing

#### 3.1 API Integration

- Connect all frontend pages to backend APIs
- Handle loading states, errors
- Implement optimistic updates where appropriate

#### 3.2 Real-time Features (Future)

- WebSocket setup for live leaderboard updates
- Real-time exam timer synchronization

## Key Implementation Details

### Database Indexes (Critical for Performance)

- User: email, role
- StudentProfile: user, sat_exam_date
- Question: question_type, skill_tag, difficulty
- QuestionAttempt: (student, question, attempted_at)
- HomeworkSubmission: (homework, student)
- MockExamAttempt: student, submitted_at, sat_score
- Ranking: (period_type, period_start, rank)

### SAT Score Conversion

- Implement conversion tables in `common/utils.py`
- Math section: 0-58 raw → 200-800 scaled
- Reading+Writing: 0-96 raw → 200-800 scaled (combined)
- Total: 400-1600

### Spaced Repetition Algorithm (SM-2)

- Quality: 0-5 (0=complete blackout, 5=perfect recall)
- Ease factor starts at 2.5
- Interval calculation based on ease_factor and review_count
- Update next_review = now + interval_days

### Ranking Calculation Logic

- Points from: homework completion (weighted), homework accuracy, mock exam scores
- Weekly/Monthly: filter by period_start/period_end
- All-time: all historical data
- Rank assigned by ordering total_points DESC

## Files to Create/Modify

### Backend (Django)

- `requirements.txt` (new)
- `.env.example` (new)
- `.gitignore` (update)
- `config/common/` - 5 files (models, permissions, utils, admin, **init**)
- `config/users/` - 6 files (models, serializers, views, urls, admin, **init**)
- `config/classes/` - 5 files
- `config/homework/` - 6 files (including tasks.py)
- `config/questionbank/` - 5 files
- `config/mockexams/` - 6 files (including tasks.py)
- `config/flashcards/` - 5 files
- `config/rankings/` - 6 files (including tasks.py)
- `config/analytics/` - 4 files (views, utils, urls, **init**)
- `config/config/celery.py` (new)
- `config/config/urls.py` (update)

### Frontend (Next.js)

- `frontend/package.json` (new)
- `frontend/tsconfig.json` (new)
- `frontend/next.config.js` (new)
- `frontend/tailwind.config.js` or UI config (new)
- `frontend/src/lib/api.ts` (new)
- `frontend/src/contexts/AuthContext.tsx` (new)
- `frontend/src/types/index.ts` (new)
- ~15-20 page components
- ~10-15 reusable components

## Dependencies Summary

### Backend

- Django>=6.0
- djangorestframework>=3.14
- djangorestframework-simplejwt>=5.3
- psycopg2-binary>=2.9
- celery>=5.3
- redis>=5.0
- django-celery-beat>=2.5
- django-cors-headers>=4.3
- Pillow>=10.0
- python-dotenv>=1.0

### Frontend

- next>=14.0
- react>=18.0
- typescript>=5.0
- axios>=1.6
- tailwindcss>=3.3 (or chosen UI framework)
- recharts>=2.8 (for charts)
- date-fns>=2.30 (for date handling)

## Execution Order

1. Create requirements.txt and install dependencies
2. Create all Django apps
3. Implement common app (base classes, permissions)
4. Implement users app (foundation for everything)
5. Implement remaining apps in order: classes → questionbank → homework → mockexams → flashcards → rankings → analytics
6. Set up URL routing and Celery
7. Create and run migrations
8. Set up Next.js frontend structure
9. Implement authentication flow
10. Build key pages and components
11. Integrate APIs
12. Test end-to-end flows