# Freelance Backend - Microservices Architecture

This project implements a microservices architecture with three separate services:

- **Auth Service** (Port 8001): Handles user authentication and login
- **Permissions Service** (Port 8002): Manages user permissions and user data
- **Services Service** (Port 8003): Provides business verification and other services

## Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local development)

## Quick Start with Docker Compose

1. **Clone the repository and navigate to the backend directory**
   ```bash
   cd freelance/backend
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the services**
   - Auth Service: http://localhost:8001
   - Permissions Service: http://localhost:8002
   - Services Service: http://localhost:8003
   - MongoDB: localhost:27017

## API Endpoints

### Auth Service (Port 8001)
- `POST /api/auth/` - User login

### Permissions Service (Port 8002)
- `GET /api/user/permissions` - Get user permissions
- `GET /api/users` - Get all users

### Services Service (Port 8003)
- `GET /api/news` - News endpoints
- `GET /api/states` - States data
- `POST /api/verification/*` - Various verification services
- `POST /api/fssai-verification` - FSSAI verification
- And many more business services...

## Development Setup

### Local Development (without Docker)

1. **Create virtual environment**
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file with your configuration

4. **Run individual services**
   ```bash
   # Auth Service
   uvicorn microServices.authMicrosService:app --host 0.0.0.0 --port 8001 --reload

   # Permissions Service
   uvicorn microServices.permissionsMicrosService:app --host 0.0.0.0 --port 8002 --reload

   # Services Service
   uvicorn microServices.servicesMicrosService:app --host 0.0.0.0 --port 8003 --reload
   ```

   **Or use the convenience scripts:**
   ```bash
   # Linux/Mac
   ./start-services.sh

   # Windows
   start-services.bat
   ```

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild specific service
docker-compose up --build [service-name]
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URL=mongodb://admin:password@mongodb:27017/freelance?authSource=admin

# JWT
JWT_SECRET=your-jwt-secret-key

# External APIs
CLIENT_ID=your-deepvue-client-id
CLIENT_SECRET=your-deepvue-client-secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Analytics
ENABLE_ANALYTICS_TRACKING=true
```

## Architecture

```
┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│   Auth Service  │    │ Permissions Service │    │ Services Service │
│     (8001)      │    │       (8002)        │    │      (8003)       │
│                 │    │                     │    │                  │
│ • User login    │    │ • User management   │    │ • Verifications   │
│ • JWT tokens    │    │ • Permissions       │    │ • Business APIs   │
└─────────────────┘    └─────────────────────┘    └──────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │     MongoDB         │
                    │     (27017)        │
                    └─────────────────────┘
```

## Health Checks

Each service includes automatic health checks and CORS middleware configured for frontend integration.

## Monitoring

- All services include comprehensive logging
- API analytics tracking (when enabled)
- Error handling and validation

## Contributing

1. Make changes to the respective microservice
2. Test locally
3. Update documentation if needed
4. Submit pull request