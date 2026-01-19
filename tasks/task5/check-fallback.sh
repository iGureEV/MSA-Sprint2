#!/bin/bash
set -e

echo "▶️ Тестирование fallback..."

# Сохраняем текущее количество реплик
CURRENT_REPLICAS=$(kubectl get deployment booking-service-v1 -n task4-booking-service -o jsonpath='{.spec.replicas}')

echo "Текущие реплики v1: $CURRENT_REPLICAS"

echo "1. Проверка до остановки v1:"
for i in {1..3}; do
    echo "   Запрос $i: $(curl -s http://localhost:9090/ping)"
done

echo ""
echo "2. Остановка v1..."
kubectl scale deployment booking-service-v1 --replicas=0 -n task4-booking-service

# Ждем обновления endpoints
echo "   Ожидание 10 секунд для обновления endpoints..."
sleep 10

echo ""
echo "3. Проверка после остановки v1:"
for i in {1..5}; do
    RESPONSE=$(curl -s http://localhost:9090/ping)
    echo "   Запрос $i: $RESPONSE"
    sleep 1
done

echo ""
echo "4. Восстановление v1..."
kubectl scale deployment booking-service-v1 --replicas=$CURRENT_REPLICAS -n task4-booking-service
echo "   Готово!"
