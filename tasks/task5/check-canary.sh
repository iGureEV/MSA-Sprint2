#!/bin/bash
set -e

echo "▶️ Проверка канареечного развертывания (90% v1, 10% v2)..."
echo "Отправка 50 запросов..."

V1_COUNT=0
V2_COUNT=0

for i in {1..50}
do
    RESPONSE=$(curl -s http://localhost:9090/ping)
    if echo "$RESPONSE" | grep -q "Feature X enabled"; then
        V2_COUNT=$((V2_COUNT+1))
        echo "Запрос $i: v2 ($RESPONSE)"
    else
        V1_COUNT=$((V1_COUNT+1))
        echo "Запрос $i: v1 ($RESPONSE)"
    fi
done

echo ""
echo "📊 Результаты:"
echo "v1 запросов: $V1_COUNT"
echo "v2 запросов: $V2_COUNT"
echo "Соотношение: $V1_COUNT:$V2_COUNT"
echo "Процент v2: $((V2_COUNT * 100 / 50))% (ожидается ~10%)"
