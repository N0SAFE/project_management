@echo off
cd /d "d:\xampp\htdocs\iscod\case_study\project_management\apps\api"
echo.
echo =================================
echo Building the project...
echo =================================
call mvnw.cmd clean compile
if %ERRORLEVEL% EQU 0 (
    echo.
    echo =================================
    echo Compilation successful! Running tests...
    echo =================================
    call mvnw.cmd test
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo =================================
        echo All tests passed!
        echo =================================
    ) else (
        echo.
        echo =================================
        echo Some tests failed. Check output above.
        echo =================================
    )
) else (
    echo.
    echo =================================
    echo Compilation failed with error level %ERRORLEVEL%
    echo =================================
)
echo.
echo Press any key to exit...
pause > nul
