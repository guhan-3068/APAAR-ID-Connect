@echo off
title APAAR CONNECT AI Server
echo Starting APAAR CONNECT AI Web Server on http://localhost:5173 ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
