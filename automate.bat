@echo off
setlocal
echo Starting CopilotKit Daily Automation...
cd /d "%~dp0"
node scripts/automate.mjs %*
pause
