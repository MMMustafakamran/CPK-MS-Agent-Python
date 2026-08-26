@echo off
setlocal enabledelayedexpansion
title [Master Orchestrator] Step-by-Step Terminal Pipeline
set "DIR=%~dp0"
set "ROOT_DIR=%DIR%.."

:MENU
cls
echo ================================================================
echo   🚀 COPILOTKIT STEP-BY-STEP TERMINAL ORCHESTRATOR
echo ================================================================
echo.
echo  This launcher opens separate, dedicated terminal windows for
echo  each step so you can clearly see live output and inputs.
echo.
echo  STEPS:
echo   [1]  Check Doc Drift            (doc-snapshot/ comparison)
echo   [1B] Sync Doc Snapshot (.md)    (Fetch & overwrite changed .md files)
echo   [2]  Update Dependencies        (backend uv sync + frontend safe install)
echo   [3]  Run Backend Agent          (FastAPI agent on :8000)
echo   [4]  Run Frontend Next.js       (Next.js app on :3000)
echo   [5]  Run Autorecorder           (Playwright video automation)
echo.
echo  MODES:
echo   [A]  Guided Step-by-Step (Opens terminals one by one with pauses)
echo   [S]  Start Servers Only  (Opens Backend & Frontend terminals)
echo   [Q]  Quit
echo.
echo ================================================================
set /p "OPT=Choose an option [A, S, 1-5, 1B, Q] (default=A): "

if /i "%OPT%"=="" set "OPT=A"
if /i "%OPT%"=="Q" goto END

if /i "%OPT%"=="1" (
    echo Opening Step 1 in a new terminal...
    start "[Step 1] Doc Drift Check" cmd /k "call "%DIR%01-check-doc-drift.bat""
    goto AFTER_ACTION
)

if /i "%OPT%"=="1B" (
    echo Opening Step 1B in a new terminal...
    start "[Step 1B] Sync Doc Snapshot" cmd /k "call "%DIR%01b-sync-doc-snapshot.bat""
    goto AFTER_ACTION
)

if /i "%OPT%"=="2" (
    echo Opening Step 2 in a new terminal...
    start "[Step 2] Update Dependencies" cmd /k "call "%DIR%02-update-dependencies.bat""
    goto AFTER_ACTION
)

if /i "%OPT%"=="3" (
    echo Opening Step 3 in a new terminal...
    start "[Step 3] Backend Server :8000" cmd /k "call "%DIR%03-run-backend.bat""
    goto AFTER_ACTION
)

if /i "%OPT%"=="4" (
    echo Opening Step 4 in a new terminal...
    start "[Step 4] Frontend Next.js :3000" cmd /k "call "%DIR%04-run-frontend.bat""
    goto AFTER_ACTION
)

if /i "%OPT%"=="5" (
    echo Opening Step 5 in a new terminal...
    start "[Step 5] Autorecorder" cmd /k "call "%DIR%05-run-autorecorder.bat""
    goto AFTER_ACTION
)

if /i "%OPT%"=="S" (
    echo.
    echo ================================================================
    echo  Launching Dev Servers in separate terminals...
    echo ================================================================
    echo Opening Backend server terminal (:8000)...
    start "[Step 3] Backend Server :8000" cmd /k "call "%DIR%03-run-backend.bat""
    timeout /t 2 /nobreak >nul
    echo Opening Frontend server terminal (:3000)...
    start "[Step 4] Frontend Next.js :3000" cmd /k "call "%DIR%04-run-frontend.bat""
    echo.
    echo Both server terminals have been launched!
    goto AFTER_ACTION
)

if /i "%OPT%"=="A" (
    goto GUIDED_RUN
)

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MENU

:GUIDED_RUN
cls
echo ================================================================
echo   [MODE A] GUIDED STEP-BY-STEP TERMINAL LAUNCHER
echo ================================================================
echo.
echo Step 1 of 5: Doc Drift Check & Sync
echo This will open a new terminal to check live documentation against doc-snapshot/
echo and let you sync/update local .md files.
echo.
set /p "C1=Press ENTER to launch Step 1 terminal (or type 's' to skip): "
if /i not "%C1%"=="s" (
    start "[Step 1] Doc Drift Check" cmd /k "call "%DIR%01-check-doc-drift.bat""
)

echo.
echo ----------------------------------------------------------------
echo Step 2 of 5: Update Dependencies
echo This will open a new terminal to sync backend Python and install frontend packages.
echo.
set /p "C2=Press ENTER to launch Step 2 terminal (or type 's' to skip): "
if /i not "%C2%"=="s" (
    start "[Step 2] Update Dependencies" cmd /k "call "%DIR%02-update-dependencies.bat""
)

echo.
echo ----------------------------------------------------------------
echo Step 3 of 5: Run Backend Agent Server (:8000)
echo This will open a new terminal running the FastAPI Python server.
echo.
set /p "C3=Press ENTER to launch Step 3 (Backend) terminal (or type 's' to skip): "
if /i not "%C3%"=="s" (
    start "[Step 3] Backend Server :8000" cmd /k "call "%DIR%03-run-backend.bat""
)

echo.
echo ----------------------------------------------------------------
echo Step 4 of 5: Run Frontend Next.js Server (:3000)
echo This will open a new terminal running Next.js.
echo.
set /p "C4=Press ENTER to launch Step 4 (Frontend) terminal (or type 's' to skip): "
if /i not "%C4%"=="s" (
    start "[Step 4] Frontend Next.js :3000" cmd /k "call "%DIR%04-run-frontend.bat""
)

echo.
echo ----------------------------------------------------------------
echo Step 5 of 5: Run Autorecorder
echo Ensure Backend (:8000) and Frontend (:3000) have finished starting up
echo before launching the recorder.
echo.
set /p "C5=Press ENTER to launch Step 5 (Autorecorder) terminal (or type 's' to skip): "
if /i not "%C5%"=="s" (
    start "[Step 5] Autorecorder" cmd /k "call "%DIR%05-run-autorecorder.bat""
)

echo.
echo ================================================================
echo  All selected terminal steps have been launched!
echo ================================================================
goto AFTER_ACTION

:AFTER_ACTION
echo.
echo ----------------------------------------------------------------
set /p "M=Return to menu? (y/n, default=y): "
if /i "%M%"=="" goto MENU
if /i "%M%"=="y" goto MENU

:END
echo Exiting orchestrator.
