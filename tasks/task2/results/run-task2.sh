#!/bin/bash
set -euo pipefail

# Функция очистки
cleanup() {
    echo "Очистка..."
    docker compose -f ../docker-compose.yml down -v 2>/dev/null || true
}

# Перехват сигнала выхода для обеспечения очистки
trap cleanup EXIT

# Создание сети, если она не существует
docker network create hotelio-net 2>/dev/null || true

# 1. Сборка монолитного приложения с помощью Gradle
echo "Сборка монолитного приложения..."
cd hotelio-monolith
chmod +x ./gradlew
./gradlew clean bootJar

# Копирование JAR-файла в директорию monolith
echo "Копирование JAR-файла в директорию monolith..."
cp build/libs/hotelio-monolith-1.0.0.jar ../monolith/
cd ..

# 2. Запуск среды docker-compose
echo "Запуск среды docker-compose..."
docker compose -f ../docker-compose.yml up -d

# 3. Ожидание готовности сервисов
echo "Ожидание готовности сервисов..."

# Ожидание готовности БД монолита
timeout 60 bash -c "until docker exec hotelio-db pg_isready -U hotelio; do sleep 2; done" || {
    echo "БД монолита не готова"
    exit 1
}
echo "БД монолита готова"

# Ожидание готовности БД сервиса бронирования
timeout 30 bash -c "until docker exec booking-db pg_isready -U booking_user; do sleep 2; done" || {
    echo "БД сервиса бронирования не готова"
    exit 1
}
echo "БД сервиса бронирования готова"

# Ожидание готовности БД сервиса истории бронирования
timeout 30 bash -c "until docker exec booking-history-db pg_isready -U history_user; do sleep 2; done" || {
    echo "БД сервиса истории бронирования не готова"
    exit 1
}
echo "БД сервиса истории бронирования готова"

# Ожидание готовности Kafka
timeout 30 bash -c "until docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1; do sleep 2; done" || {
    echo "Kafka не готова"
    exit 1
}
echo "Kafka готова"

# Ожидание доступности сервиса монолита
timeout 60 bash -c "until curl -s http://localhost:8084/api/bookings >/dev/null; do sleep 2; done" || {
    echo "Сервис монолита не готов"
    exit 1
}
echo "Сервис монолита готов"

# Ожидание доступности сервиса бронирования через API монолита
timeout 30 bash -c "until curl -s 'http://localhost:8084/api/bookings?ms=true' >/dev/null; do sleep 2; done" && {
    echo "Сервис бронирования готов через API монолита"
} || {
    echo "Сервис бронирования не готов через API монолита, продолжаем..."
}

# 4. Запуск тестов
echo "Запуск тестов..."
cd test

# Сборка контейнера для тестов
docker build -t hotelio-test .

# Запуск регрессионных тестов в контейнере
docker run --network hotelio-net --rm -e DB_HOST=hotelio-db -e DB_HOST_BOOKING=booking-db -e  DB_HOST_BOOKING_HISTORY=booking-history-db -e DB_PORT=5432 -e DB_PORT_BOOKING=5432 -e DB_USER=hotelio -e DB_USER_BOOKING=booking_user -e DB_PASSWORD=hotelio -e DB_PASSWORD_BOOKING=booking_pass -e DB_NAME=hotelio -e DB_NAME_BOOKING=bookings -e API_URL=http://monolith-task2:8080 hotelio-test ./regress.sh

echo "Все тесты пройдены!"

# 5. Очистка
echo "Очистка..."
cd ../..
#docker compose -f docker-compose.yml down -v
echo "Очистка завершена"

echo "Задание 2 протестировано успешно!"
