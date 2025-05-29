@echo off
echo Testing HMR and Watch Mode Setup...
echo.

echo [1/3] Checking Docker Compose configuration...
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml config > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker Compose configuration is valid
) else (
    echo ✗ Docker Compose configuration has errors
    echo Running config check:
    docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml config
    goto end
)

echo.
echo [2/3] Checking Angular HMR script...
cd apps\web
npm run start:hmr --dry-run > nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Angular HMR script is available
) else (
    echo ✗ Angular HMR script not found or invalid
    echo Available scripts:
    npm run
    goto end
)
cd ..\..

echo.
echo [3/3] Checking Spring Boot DevTools dependency...
findstr /c:"spring-boot-devtools" apps\api\pom.xml > nul
if %errorlevel% equ 0 (
    echo ✓ Spring Boot DevTools dependency found
) else (
    echo ✗ Spring Boot DevTools dependency missing
)

echo.
echo Setup validation complete!
echo.
echo To start development environment:
echo   start-dev.bat
echo.
echo Services will be available at:
echo   Frontend (HMR): http://localhost:4200
echo   Backend API:    http://localhost:8080
echo   LiveReload:     http://localhost:35729

:end
pause
