# Используем официальный минимальный образ Go
FROM golang:alpine AS builder

# Установка необходимых пакетов
RUN apk add --no-cache ca-certificates git
WORKDIR /src
# Копирование исходников
COPY main.go .
# Сборка
RUN CGO_ENABLED=0 GOOS=linux go build -o booking-service main.go

# Финальный минимальный образ
FROM alpine

RUN apk add --no-cache ca-certificates curl
# Установка рабочей директории
WORKDIR /app

# Копирование бинарника из билд-стадии
COPY --from=builder /src/booking-service .

# Открытие порта
EXPOSE 8080
# По-умолчанию запуск бинарник
CMD ["./booking-service"]
