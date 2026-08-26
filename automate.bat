@echo off
setlocal
echo Starting CopilotKit Daily Automation...
cd /d "%~dp0"
node ci/automate.mjs %*
pause
