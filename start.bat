@echo off
cd /d "%~dp0"
rem Installs anything new (quick when nothing changed), e.g. after unzipping an update over this folder.
echo Checking packages...
call npm install --no-audit --no-fund --loglevel=error
if errorlevel 1 (
  echo.
  echo Package install failed. Check your internet connection, then run start.bat again.
  pause
  exit /b
)
if not exist .env copy .env.example .env >nul
where claude >nul 2>nul
if errorlevel 1 if not exist "%USERPROFILE%\.local\bin\claude.exe" (
  echo.
  echo Claude Code was not found. Answers use Claude Code with your Claude plan.
  echo Install it in PowerShell:   irm https://claude.ai/install.ps1 ^| iex
  echo then run "claude" once and sign in with your Claude account.
  echo.
)
call npm start
