@echo off
REM Bulk Email Sender Development Startup Script for Windows

echo 🚀 Starting Bulk Email Sender Development Environment

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found. Please ensure you're in the project root.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "bulk-referral-sender" (
    echo ❌ Frontend directory not found. Please ensure you're in the project root.
    pause
    exit /b 1
)

REM Start backend
echo 🔧 Starting Backend Server...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📥 Installing Python dependencies...
    pip install -r requirements.txt
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found in backend directory.
    echo    Please copy env.example to .env and configure your settings.
)

REM Start backend server in background
echo 🚀 Starting FastAPI server on http://localhost:8000
start "Backend Server" cmd /k "python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Go back to root and start frontend
cd ..\bulk-referral-sender

REM Install dependencies if package.json exists
if exist "package.json" (
    echo 📥 Installing Node.js dependencies...
    npm install
)

REM Check if .env.local file exists
if not exist ".env.local" (
    echo ⚠️  Warning: .env.local file not found in frontend directory.
    echo    Please copy .env.example to .env.local and configure your settings.
)

REM Start frontend server
echo 🚀 Starting Next.js server on http://localhost:3000
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Development servers started!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close the windows to stop the servers.
echo.
pause 