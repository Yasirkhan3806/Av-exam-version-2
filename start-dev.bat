@echo off
title AVExam Development Environment
echo ===================================================
echo   Starting AVExam Development Environment...
echo ===================================================

echo.
echo [1/2] Starting Backend Server...
start "AVExam Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo.
echo [2/2] Starting Frontend Next.js App...
start "AVExam Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   Both services have been launched in new windows!
echo   - Backend runs on http://localhost:5000 (approx)
echo   - Frontend runs on http://localhost:3000
echo ===================================================
echo.
pause
