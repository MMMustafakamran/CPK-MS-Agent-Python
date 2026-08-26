@echo off
setlocal
title [Step 1] Doc Drift Check & Sync
set "ROOT_DIR=%~dp0.."

echo ================================================================
echo  [Step 1] Documentation Drift & Markdown Snapshot Sync
echo ================================================================
echo  Working Directory: %ROOT_DIR%
echo  Target: Live docs.copilotkit.ai vs doc-snapshot/
echo ================================================================
echo.

cd /d "%ROOT_DIR%"

if not exist "scripts\check-doc-drift.mjs" (
    echo [ERROR] Cannot find scripts\check-doc-drift.mjs!
    goto END
)

:: If arguments passed, forward them directly
if not "%~1"=="" (
    node scripts\check-doc-drift.mjs %*
    goto END
)

echo Choose execution mode:
echo   [1] Check drift only (Report differences, ask before saving)
echo   [2] Sync & update markdown files automatically (Apply changes to doc-snapshot/)
echo.
set /p "MODE=Enter choice [1-2] (default=1): "

if "%MODE%"=="2" (
    echo.
    echo Running doc drift with automatic markdown update...
    node scripts\check-doc-drift.mjs --update
) else (
    echo.
    echo Running doc drift check...
    node scripts\check-doc-drift.mjs
)

:END
echo.
echo ================================================================
echo  Doc drift process completed.
echo ================================================================
pause
