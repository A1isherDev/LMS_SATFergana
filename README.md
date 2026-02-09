# SAT LMS Platform

A comprehensive Learning Management System specifically designed for SAT exam preparation, built with Django REST Framework and Next.js.

## Features

### For Students
- 📚 **Digital SAT Practice** - Full-length practice tests with Bluebook integration
- 📝 **Question Bank** - Extensive collection of SAT questions organized by subject and difficulty
- 🎯 **Personalized Learning** - Track progress and identify weak areas
- 📊 **Analytics Dashboard** - Detailed performance metrics and score tracking
- 🔄 **Flashcards** - Spaced repetition system for vocabulary mastery
- ✅ **Homework Management** - Track assignments and submissions
- 🏆 **Rankings** - Compare performance with peers

### For Teachers
- 👥 **Class Management** - Create and manage classes with student enrollment
- 📋 **Assignment Creation** - Create and distribute homework assignments
- 📈 **Student Analytics** - Monitor individual and class-wide performance
- 🎓 **Mock Exams** - Administer practice tests and track results
- 📧 **Student Invitations** - Easy student onboarding via email invitations

### Technical Features
- 🔐 **JWT Authentication** - Secure token-based authentication
- ⚡ **Real-time Updates** - Celery-powered background tasks
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 📱 **Mobile-Friendly** - Works seamlessly on all devices
- 🔄 **API-First** - RESTful API with comprehensive documentation

## Tech Stack

### Backend
- **Django 5.2+** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL 15** - Database
- **Celery** - Async task processing
- **Redis** - Caching and message broker
- **Gunicorn** - WSGI HTTP server

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form management

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **Let's Encrypt** - SSL/TLS certificates

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.14+ (for local backend development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LMS_SATFergana
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/
   - API Docs: http://localhost:8000/api/schema/swagger-ui/

### Local Development (Without Docker)

#### Backend
```bash
cd config
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

Quick production deployment:
```bash
cp .env.production.example .env.production
# Edit .env.production with your settings
chmod +x deploy.sh
./deploy.sh
```

## Project Structure

```
LMS_SATFergana/
├── config/                 # Django project configuration
│   ├── apps/              # Django applications
│   │   ├── analytics/     # Analytics and reporting
│   │   ├── classes/       # Class management
│   │   ├── flashcards/    # Flashcard system
│   │   ├── homework/      # Homework assignments
│   │   ├── mockexams/     # Mock exam system
│   │   ├── questionbank/  # Question repository
│   │   ├── rankings/      # Student rankings
│   │   └── users/         # User management
│   └── config/            # Django settings
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   └── __tests__/    # Test files
│   └── public/           # Static assets
├── scripts/              # Deployment and maintenance scripts
├── docker-compose.yml    # Development Docker configuration
├── docker-compose.prod.yml  # Production Docker configuration
└── DEPLOYMENT.md         # Deployment documentation
```

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `/api/schema/swagger-ui/`
- **ReDoc**: `/api/schema/redoc/`
- **OpenAPI Schema**: `/api/schema/`

## Testing

### Backend Tests
```bash
docker-compose exec backend python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:watch  # Watch mode
```

### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd config
flake8
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For deployment issues, see [DEPLOYMENT.md](DEPLOYMENT.md).

For development questions, contact the development team.

## Acknowledgments

- Built with Django and Next.js
- Designed for SAT exam preparation
- Optimized for the Fergana region educational system
