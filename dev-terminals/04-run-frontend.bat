@echo off
setlocal
title [Step 4] Frontend Next.js App (:3000)
set "ROOT_DIR=%~dp0.."

echo ================================================================
echo  [Step 4] Starting Frontend Next.js Server
echo ================================================================
echo  Location:     %ROOT_DIR%\frontend
echo  App URL:      http://localhost:3000
echo  Doc-Sync UI:  http://localhost:3000/doc-sync
echo ================================================================
echo.

cd /d "%ROOT_DIR%\frontend"

if not exist "package.json" (
    echo [ERROR] Cannot find frontend\package.json!
    goto END
)

echo Starting Next.js development server with npm run dev...
echo.
call npm run dev

:END
echo.
echo ================================================================
echo  Frontend server process stopped.
echo ================================================================
pause

