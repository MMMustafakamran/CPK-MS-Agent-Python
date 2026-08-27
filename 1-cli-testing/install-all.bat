@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"

echo ================================================================
echo  Launching dependency installers in separate terminals...
echo ================================================================
echo.

:: 1. npm
set "NPM_TARGET="
if exist "%ROOT_DIR%npm\app\package.json" (
    set "NPM_TARGET=%ROOT_DIR%npm\app"
) else if exist "%ROOT_DIR%npm\package.json" (
    set "NPM_TARGET=%ROOT_DIR%npm"
)

if defined NPM_TARGET (
    if exist "%ROOT_DIR%.env" (
        copy /y "%ROOT_DIR%.env" "!NPM_TARGET!\.env" >nul 2>&1
        if exist "!NPM_TARGET!\agent" copy /y "%ROOT_DIR%.env" "!NPM_TARGET!\agent\.env" >nul 2>&1
    )
    echo [npm]  Opening terminal for: npm install
    echo        Target: !NPM_TARGET!
    start "npm install" cmd /k "cd /d "!NPM_TARGET!" && echo ================================================================ && echo  Location: !NPM_TARGET! && echo  Running:  npm install && echo ================================================================ && echo. && npm install"
) else (
    echo [npm]  No project found in npm\app or npm. Skipping.
)

:: 2. pnpm
set "PNPM_TARGET="
if exist "%ROOT_DIR%pnpm\app\package.json" (
    set "PNPM_TARGET=%ROOT_DIR%pnpm\app"
) else if exist "%ROOT_DIR%pnpm\package.json" (
    set "PNPM_TARGET=%ROOT_DIR%pnpm"
)

if defined PNPM_TARGET (
    if exist "%ROOT_DIR%.env" (
        copy /y "%ROOT_DIR%.env" "!PNPM_TARGET!\.env" >nul 2>&1
        if exist "!PNPM_TARGET!\agent" copy /y "%ROOT_DIR%.env" "!PNPM_TARGET!\agent\.env" >nul 2>&1
    )
    echo [pnpm] Opening terminal for: pnpm install
    echo        Target: !PNPM_TARGET!
    start "pnpm install" cmd /k "cd /d "!PNPM_TARGET!" && echo ================================================================ && echo  Location: !PNPM_TARGET! && echo  Running:  pnpm install && echo ================================================================ && echo. && pnpm install"
) else (
    echo [pnpm] No project found in pnpm\app or pnpm. Skipping.
)

:: 3. bun
set "BUN_TARGET="
if exist "%ROOT_DIR%bun\app\package.json" (
    set "BUN_TARGET=%ROOT_DIR%bun\app"
) else if exist "%ROOT_DIR%bun\package.json" (
    set "BUN_TARGET=%ROOT_DIR%bun"
)

if defined BUN_TARGET (
    if exist "%ROOT_DIR%.env" (
        copy /y "%ROOT_DIR%.env" "!BUN_TARGET!\.env" >nul 2>&1
        if exist "!BUN_TARGET!\agent" copy /y "%ROOT_DIR%.env" "!BUN_TARGET!\agent\.env" >nul 2>&1
    )
    echo [bun]  Opening terminal for: bun install
    echo        Target: !BUN_TARGET!
    start "bun install" cmd /k "cd /d "!BUN_TARGET!" && echo ================================================================ && echo  Location: !BUN_TARGET! && echo  Running:  bun install && echo ================================================================ && echo. && bun install"
) else (
    echo [bun]  No project found in bun\app or bun. Skipping.
)

:: 4. yarn
set "YARN_TARGET="
if exist "%ROOT_DIR%yarn\app\package.json" (
    set "YARN_TARGET=%ROOT_DIR%yarn\app"
) else if exist "%ROOT_DIR%yarn\package.json" (
    set "YARN_TARGET=%ROOT_DIR%yarn"
)

if defined YARN_TARGET (
    if exist "%ROOT_DIR%.env" (
        copy /y "%ROOT_DIR%.env" "!YARN_TARGET!\.env" >nul 2>&1
        if exist "!YARN_TARGET!\agent" copy /y "%ROOT_DIR%.env" "!YARN_TARGET!\agent\.env" >nul 2>&1
    )
    echo [yarn] Opening terminal for: yarn install
    echo        Target: !YARN_TARGET!
    start "yarn install" cmd /k "cd /d "!YARN_TARGET!" && echo ================================================================ && echo  Location: !YARN_TARGET! && echo  Running:  yarn install && echo ================================================================ && echo. && yarn install"
) else (
    echo [yarn] No project found in yarn\app or yarn. Skipping.
)

echo.
echo ================================================================
echo  All installer terminals have been opened!
echo ================================================================
pause
