@echo off
setlocal
title [Step 5] Autorecorder
set "ROOT_DIR=%~dp0.."

echo ================================================================
echo  [Step 5] Playwright Autorecorder
echo ================================================================
echo  Location:   %ROOT_DIR%\autorecorder
echo  Videos Dir: %ROOT_DIR%\autorecorder\videos
echo.
echo  NOTE: Make sure Backend (:8000) and Frontend (:3000) are running!
echo ================================================================
echo.

cd /d "%ROOT_DIR%\autorecorder"

if not exist "package.json" (
    echo [ERROR] Cannot find autorecorder\package.json!
    goto END
)

:: If arguments passed, forward them
if not "%~1"=="" (
    echo Running with arguments: %*
    call npm run record -- %*
    goto END
)

echo Select an option:
echo   [1] Run all recordings (default)
echo   [2] List available demo recordings
echo   [3] Run doctor / environment diagnostic
echo   [4] Run doctor with online connectivity check
echo.
set /p "CHOICE=Enter choice [1-4] (default=1): "

if "%CHOICE%"=="2" (
    call npm run record:list
) else if "%CHOICE%"=="3" (
    call npm run doctor
) else if "%CHOICE%"=="4" (
    call npm run doctor:online
) else (
    echo Running all recordings...
    call npm run record
)

:END
echo.
echo ================================================================
echo  Autorecorder run finished.
echo ================================================================
pause

