@echo off
setlocal
title [Step 2] Update Dependencies (Backend & Frontend)
set "ROOT_DIR=%~dp0.."

echo ================================================================
echo  [Step 2] Updating Dependencies
echo ================================================================
echo.
echo 1) Backend:      uv sync --prerelease=allow (in backend/)
echo 2) Frontend:     npm install (in frontend/ - peer dependencies safe)
echo 3) Autorecorder: npm install (in autorecorder/)
echo.

:: 1. Backend (Python / uv)
echo ----------------------------------------------------------------
echo [Backend] Syncing Python dependencies in backend/...
echo ----------------------------------------------------------------
cd /d "%ROOT_DIR%\backend"
if exist "pyproject.toml" (
    call uv sync --prerelease=allow
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] Backend uv sync returned code %ERRORLEVEL%.
    ) else (
        echo [Backend] Dependencies synced successfully.
    )
) else (
    echo [ERROR] backend\pyproject.toml not found.
)
echo.

:: 2. Frontend (Node / npm)
echo ----------------------------------------------------------------
echo [Frontend] Installing frontend packages in frontend/...
echo ----------------------------------------------------------------
cd /d "%ROOT_DIR%\frontend"
if exist "package.json" (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] Frontend npm install returned code %ERRORLEVEL%.
    ) else (
        echo [Frontend] Packages installed successfully (peer dependencies preserved).
    )
) else (
    echo [ERROR] frontend\package.json not found.
)
echo.

:: 3. Autorecorder (Node / npm)
echo ----------------------------------------------------------------
echo [Autorecorder] Installing autorecorder packages in autorecorder/...
echo ----------------------------------------------------------------
cd /d "%ROOT_DIR%\autorecorder"
if exist "package.json" (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] Autorecorder npm install returned code %ERRORLEVEL%.
    ) else (
        echo [Autorecorder] Packages installed successfully.
    )
) else (
    echo [ERROR] autorecorder\package.json not found.
)
echo.

echo ================================================================
echo  [Step 2 Complete] Dependency update finished!
echo ================================================================
echo.
pause

