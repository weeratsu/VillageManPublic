@echo off
REM ============================================================
REM  update_public.bat  (VillageManPublic)
REM  One-click: copy meter photos into this repo, then push to GitHub.
REM  Run AFTER you press "Export for web" in the VillageMan app and
REM  replace villageman_data.js in this folder.
REM ============================================================
cd /d "%~dp0"

echo.
echo [1/3] Copying referenced meter photos into the repo...
python scripts\copy_photos_to_public.py
if errorlevel 1 goto :error

echo.
echo [2/3] Staging changes...
git add -A

echo.
echo [3/3] Commit + push to GitHub...
REM commit; if nothing changed, git returns non-zero -> skip push gracefully
git commit -m "Update common-area report data + meter photos (%DATE% %TIME%)"
if errorlevel 1 (
  echo.
  echo    Nothing to commit ^(no changes since last push^) - skipping push.
  goto :done
)
git push
if errorlevel 1 goto :pushfail

echo.
echo ============================================================
echo   [OK] PUSH SUCCESSFUL
echo   The public site will refresh in about a minute:
echo   https://weeratsu.github.io/VillageManPublic/
echo ============================================================
echo.
echo Press any key to close...
pause >nul
goto :eof

:done
echo.
echo ============================================================
echo   [OK] Already up to date - nothing new to push.
echo ============================================================
echo.
echo Press any key to close...
pause >nul
goto :eof

:pushfail
echo.
echo ============================================================
echo   [!] PUSH FAILED - the commit was made locally but did NOT
echo       reach GitHub. The website will NOT update yet.
echo   Common causes: no internet, GitHub login/token expired,
echo   or the remote rejected the push.
echo   Try: open GitHub Desktop and push from there, or run
echo        'git push' manually to see the full error.
echo ============================================================
echo.
pause
goto :eof

:error
echo.
echo ============================================================
echo   [!] Step failed before push (photo copy or git add).
echo   Check the message above.
echo   Common causes: not a git repo yet, Python not installed,
echo   or villageman_data.js missing.
echo ============================================================
echo.
pause
