@echo off
echo Starting Freelance Backend Microservices...

echo Starting Auth Service on port 8001...
start "Auth Service" cmd /c "python -m uvicorn microServices.authMicrosService:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 2 /nobreak > nul

echo Starting Permissions Service on port 8002...
start "Permissions Service" cmd /c "python -m uvicorn microServices.permissionsMicrosService:app --host 0.0.0.0 --port 8002 --reload"

timeout /t 2 /nobreak > nul

echo Starting Services Service on port 8003...
start "Services Service" cmd /c "python -m uvicorn microServices.servicesMicrosService:app --host 0.0.0.0 --port 8003 --reload"

echo.
echo All services started!
echo.
echo Service URLs:
echo   Auth:        http://localhost:8001
echo   Permissions: http://localhost:8002
echo   Services:    http://localhost:8003
echo.
echo API Documentation:
echo   Auth:        http://localhost:8001/docs
echo   Permissions: http://localhost:8002/docs
echo   Services:    http://localhost:8003/docs
echo.
echo Press any key to exit (services will continue running)...
pause > nul