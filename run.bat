@echo off
title TraceFlow Launcher
echo ========================================================
echo               TRACEFLOW - STARTING UP
echo    Offline Intelligent Java Program Analysis Platform
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Checking built backend jar...
if not exist "target\traceflow-backend-1.0.0.jar" (
    echo Building backend with Maven...
    call mvnw.cmd clean package -DskipTests=true
)

echo [2/2] Launching TraceFlow Backend on http://localhost:8080 ...
start "TraceFlow-Backend" java "-Dspring.profiles.active=h2" -jar "target\traceflow-backend-1.0.0.jar"

echo Launching TraceFlow Frontend Dev Server on http://localhost:5173 ...
cd frontend
start "TraceFlow-Frontend" cmd /c "npm run dev"

echo.
echo ========================================================
echo TraceFlow is starting up!
echo.
echo Open your browser and navigate to:
echo    http://localhost:5173  (Frontend Dev Studio)
echo    http://localhost:8080  (Backend API & Bundled App)
echo.
echo Default Demo Credentials:
echo    Username: demo
echo    Password: password123
echo ========================================================
echo.
pause
