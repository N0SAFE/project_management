#!/bin/bash
echo "Starting Project Management Tool in Development Mode with HMR..."
echo ""
echo "This will start:"
echo "- MySQL Database"
echo "- Spring Boot API with DevTools (Hot Reload)"
echo "- Angular Frontend with HMR (Hot Module Replacement)"
echo ""
echo "Frontend: http://localhost:4200"
echo "Backend API: http://localhost:8080"
echo "LiveReload: http://localhost:35729"
echo ""

docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up "$@"
