@echo off
title Push School Site to GitHub Pages
cd /d "%~dp0"

set /p REPO_URL=Paste GitHub repository URL, for example https://github.com/USER/school-site.git: 
if "%REPO_URL%"=="" (
  echo Repository URL is empty.
  pause
  exit /b 1
)

git init
git branch -M main
git config user.name >nul 2>nul
if errorlevel 1 git config user.name "school-site"
git config user.email >nul 2>nul
if errorlevel 1 git config user.email "school-site@example.com"
git add .
git commit -m "Publish school portal"
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo If push worked, open GitHub Settings - Pages and select main / root.
pause
