@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if errorlevel 1 (
  set "PY=python"
) else (
  set "PY=py -3"
)

%PY% --version
if errorlevel 1 goto :python_error

%PY% -m pip install Flask flask-cors
if errorlevel 1 goto :install_error

%PY% -m pip install MetaTrader5
if errorlevel 1 echo.& echo WARNING: MetaTrader5 package could not be installed. MT5 charts are disabled; crypto and forex still work.& echo.

start "MT5 Bridge" cmd /k %PY% mt5_bridge.py
start "Web Server" cmd /k %PY% -m http.server 8000 --bind 127.0.0.1
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:8000/index.html
exit /b 0

:python_error
echo Python 3 was not found. Install 64-bit Python and try again.
pause
exit /b 1

:install_error
echo Could not install Flask. Check your Python version and internet connection.
pause
exit /b 1
