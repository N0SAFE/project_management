# API Dockerfile
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copy all files (including source code and Maven wrapper)
COPY . .

ARG DB_URL
ARG DB_USERNAME
ARG DB_PASSWORD
ARG MAIL_HOST
ARG MAIL_PORT
ARG MAIL_USERNAME
ARG MAIL_PASSWORD
ARG APP_MAIL_FROM
ARG APP_MAIL_NAME

ENV DB_URL=${DB_URL}
ENV DB_USERNAME=${DB_USERNAME}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV MAIL_HOST=${MAIL_HOST}
ENV MAIL_PORT=${MAIL_PORT}
ENV MAIL_USERNAME=${MAIL_USERNAME}
ENV MAIL_PASSWORD=${MAIL_PASSWORD}
ENV APP_MAIL_FROM=${APP_MAIL_FROM}
ENV APP_MAIL_NAME=${APP_MAIL_NAME}

# Expose the default Spring Boot port
EXPOSE 8080

# Install Maven (if not present)
RUN apk add --no-cache maven

# Use spring-boot:run for HMR/devtools support
CMD ["./mvnw", "spring-boot:run", "-Dspring-boot.run.jvmArguments=-Dspring.devtools.restart.enabled=true"]
