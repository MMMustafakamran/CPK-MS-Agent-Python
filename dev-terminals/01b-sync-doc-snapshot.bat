@echo off
setlocal
title [Step 1b] Sync Doc Snapshot Markdown Files
set "ROOT_DIR=%~dp0.."

echo ================================================================
echo  [Step 1b] Updating Doc Snapshot Markdown Files from Live Docs
echo ================================================================
echo.
cd /d "%ROOT_DIR%"

node scripts\check-doc-drift.mjs --update

echo.
pause

