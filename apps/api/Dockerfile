# API Dockerfile
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copy all files (including source code and Maven wrapper)
COPY . .

ARG DB_URL
ARG DB_USERNAME
ARG DB_PASSWORD

ENV DB_URL=${DB_URL}
ENV DB_USERNAME=${DB_USERNAME}
ENV DB_PASSWORD=${DB_PASSWORD}

# Expose the default Spring Boot port
EXPOSE 8080

# Install Maven (if not present)
RUN apk add --no-cache maven

# Use spring-boot:run for HMR/devtools support
CMD ["./mvnw", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-Dspring.devtools.restart.enabled=true"]
