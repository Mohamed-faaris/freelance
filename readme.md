# Freelance Project

A full-stack application with React frontend and FastAPI backend microservices for identity verification and business services.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI microservices (Auth, Permissions, Services)
- **Database**: MongoDB
- **Reverse Proxy**: Nginx

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.12+
- Docker & Docker Compose (optional)

### Development Mode

**Single Server Setup:**

```bash
# Backend
cd backend
python -m uvicorn index:app --host 0.0.0.0 --port 8000 --reload

# Frontend (in new terminal)
cd frontend
pnpm dev
```

**Microservices Setup:**

```bash
# Auth Service
cd backend
python -m uvicorn microServices.authMicrosService:app --host 0.0.0.0 --port 8001 --reload

# Permissions Service (in new terminal)
cd backend
python -m uvicorn microServices.permissionsMicrosService:app --host 0.0.0.0 --port 8002 --reload

# Services Service (in new terminal)
cd backend
python -m uvicorn microServices.servicesMicrosService:app --host 0.0.0.0 --port 8003 --reload

# Frontend (in new terminal)
cd frontend
pnpm dev
```

### Production Build

**Single Server Build:**

```bash
# Backend
cd backend
python -m uvicorn index:app --host 0.0.0.0 --port 8000

# Frontend build
cd frontend
# Set backend API URL in .env file
echo "VITE_API_URL=http://localhost:8000" > .env
pnpm build
```

**Microservices Build:**

```bash
# Build and start auth service
cd backend
python -m uvicorn microServices.authMicrosService:app --host 0.0.0.0 --port 8001

# Build and start permissions service (in new terminal)
cd backend
python -m uvicorn microServices.permissionsMicrosService:app --host 0.0.0.0 --port 8002

# Build and start services service (in new terminal)
cd backend
python -m uvicorn microServices.servicesMicrosService:app --host 0.0.0.0 --port 8003

# Build frontend
cd frontend
pnpm build

# Setup Nginx (copy config and reload)
sudo cp backend/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

### Docker Deployment (Recommended)

```bash
cd backend

# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

**Services:**

- **Main Application (Nginx)**: http://localhost (Port 80) - Serves frontend and proxies API requests
- **Frontend Service**: http://localhost:5173
- **Auth Service**: http://localhost:8001
- **Permissions Service**: http://localhost:8002
- **Services Service**: http://localhost:8003
- **MongoDB**: localhost:27017

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI**: http://localhost:8000/docs

## 🔐 Authentication

The application uses JWT tokens for authentication. Users can have different roles:

- **superadmin**: Full access to all features
- **admin**: Access to user management and administrative features
- **user**: Standard user with permission-based access

## 🏢 Services

### Verification Services

- **Personal Verification**: Aadhaar, PAN, DL, RC verification
- **Business Verification**: GST, CIN, FSSAI verification
- **Education Verification**: Certificate validation with OCR
- **Advanced Search**: Comprehensive data lookup

### Administrative Services

- **User Management**: Create, update, delete users
- **API Analytics**: Monitor API usage and performance
- **News Management**: Content management system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
