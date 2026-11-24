@echo off
title SmartDent - Instalador y Ejecutor Automatico
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\instalar-y-ejecutar.ps1"
echo.
pause
