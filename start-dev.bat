@echo off
cd /d "%~dp0"
echo.
echo  Rahul Web — local preview (required for animated backgrounds)
echo  Opening http://localhost:3000 ...
echo.
npx --yes serve . -l 3000
