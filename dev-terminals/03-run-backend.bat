@echo off
setlocal
title [Step 3] Backend Agent Server (:8000)
set "ROOT_DIR=%~dp0.."

echo ================================================================
echo  [Step 3] Starting Backend Agent Server
echo ================================================================
echo  Location:     %ROOT_DIR%\backend
echo  Server URL:   http://127.0.0.1:8000
echo  Health Check: http://127.0.0.1:8000/health
echo  API Docs:     http://127.0.0.1:8000/docs
echo ================================================================
echo.

cd /d "%ROOT_DIR%\backend"

if not exist "main.py" (
    echo [ERROR] Cannot find backend\main.py!
    goto END
)

echo Starting FastAPI Agent server with uv run...
echo.
uv run --prerelease=allow main.py

:END
echo.
echo ================================================================
echo  Backend server process stopped.
echo ================================================================
pause

