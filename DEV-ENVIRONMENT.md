# Development Environment with HMR & Watch Mode

This document explains how to run the Project Management Tool in development mode with Hot Module Replacement (HMR) and automatic reloading capabilities.

## Features Enabled

### Frontend (Angular)
- **Hot Module Replacement (HMR)**: Changes to TypeScript, HTML, and SCSS files are instantly reflected without page refresh
- **File Watching**: Automatic detection of file changes using polling for Docker compatibility
- **Source Maps**: Full debugging support in browser DevTools

### Backend (Spring Boot)
- **DevTools Hot Reload**: Automatic restart on Java file changes
- **LiveReload**: Browser refresh on backend changes (port 35729)
- **Fast Restart**: Optimized restart times with Spring Boot DevTools

## Quick Start

### Option 1: Using Startup Scripts
```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

### Option 2: Manual Docker Compose
```bash
# Start with HMR and watch mode
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build

# Start in background
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d --build
```

### Option 3: Standard Mode (No HMR)
```bash
# Standard startup without HMR
docker-compose up --build
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Angular application with HMR |
| Backend API | http://localhost:8080 | Spring Boot REST API |
| LiveReload | http://localhost:35729 | Spring Boot DevTools LiveReload |
| Database | localhost:3306 | MySQL (internal only) |

## How It Works

### Frontend HMR Configuration
- **Port 4200**: Main Angular dev server
- **Port 49153**: HMR WebSocket connection
- **Environment Variables**:
  - `CHOKIDAR_USEPOLLING=true`: Enables file watching in Docker
  - `WATCHPACK_POLLING=true`: Additional polling for file changes
  - `NODE_ENV=development`: Development mode

### Backend Hot Reload Configuration
- **Port 8080**: Main Spring Boot application
- **Port 35729**: LiveReload WebSocket
- **DevTools Settings**:
  - `spring.devtools.restart.enabled=true`
  - `spring.devtools.livereload.enabled=true`
  - `spring.devtools.restart.poll-interval=1000ms`

### Volume Mounting
```yaml
# Frontend volumes (cached for performance)
- ./apps/web/src:/app/src:cached
- ./apps/web/angular.json:/app/angular.json:cached
- ./apps/web/tsconfig.json:/app/tsconfig.json:cached
- /app/node_modules  # Anonymous volume

# Backend volumes
- ./apps/api/src:/app/src:cached
- ./apps/api/pom.xml:/app/pom.xml:cached
```

## Development Workflow

### Frontend Changes
1. Edit any file in `apps/web/src/`
2. Changes are automatically detected
3. HMR updates the browser without refresh
4. State is preserved in most cases

### Backend Changes
1. Edit any Java file in `apps/api/src/main/java/`
2. Spring Boot DevTools detects changes
3. Application restarts automatically (2-5 seconds)
4. LiveReload refreshes the browser

### Configuration Changes
- **Angular config** (angular.json, tsconfig.json): Requires container restart
- **Spring Boot config** (application.properties): Hot reloaded automatically
- **Docker config**: Requires `docker-compose down` and restart

## Troubleshooting

### HMR Not Working
```bash
# Rebuild containers
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml down
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build

# Check HMR WebSocket connection in browser console
# Should see: [HMR] Waiting for update signal from WDS...
```

### Backend Not Reloading
```bash
# Check DevTools logs in container
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml logs api

# Ensure source files are mounted correctly
docker exec -it <api-container> ls -la /app/src/main/java/
```

### File Changes Not Detected
```bash
# Restart with clean volumes
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml down -v
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build
```

### Performance Issues
- **Windows**: Enable WSL2 for better Docker performance
- **Mac**: Use `:cached` volume mount flags (already configured)
- **Linux**: Native performance should be optimal

## Production Note

For production deployment, use:
```bash
docker-compose -f docker-compose.prod.yaml up --build
```

This disables HMR, DevTools, and file watching for optimal performance.

## File Structure

```
project_management/
├── docker-compose.yaml          # Base configuration
├── docker-compose.dev.yaml      # Development overrides (HMR/DevTools)
├── docker-compose.prod.yaml     # Production configuration
├── start-dev.bat               # Windows development startup
├── start-dev.sh                # Linux/Mac development startup
├── apps/
│   ├── web/
│   │   ├── Dockerfile          # Angular container
│   │   └── package.json        # HMR script: start:hmr
│   └── api/
│       ├── Dockerfile          # Spring Boot container
│       └── src/main/resources/
│           └── application.properties  # DevTools configuration
```

## Key Benefits

1. **Faster Development**: Instant feedback on changes
2. **State Preservation**: Frontend state maintained during updates
3. **Full Stack**: Both frontend and backend support hot reloading
4. **Docker Native**: Works seamlessly in containerized environment
5. **Production Ready**: Easy switch between dev and prod modes
