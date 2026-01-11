FROM alpine:latest
RUN apk add --no-cache openjdk17

WORKDIR /app

COPY hotelio-monolith-1.0.0.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]