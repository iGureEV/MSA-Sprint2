#!/bin/bash
echo "🚀 Полный тест Istio конфигурации..."

kubectl port-forward -n istio-system svc/istio-ingressgateway 9090:80 > /dev/null 2>&1 &
PID=$!
sleep 5

echo ""
echo "=== 1. ТЕСТ КАНАРЕЕЧНОГО РАЗВЕРТЫВАНИЯ ==="
./check-canary.sh

echo ""
echo "=== 2. ТЕСТ FEATURE FLAG ==="  
./check-feature-flag.sh

echo ""
echo "=== 3. ТЕСТ FALLBACK ==="
./check-fallback.sh

echo ""
echo "=== 4. ПРОВЕРКА ISTIO ==="
./check-istio.sh

kill $PID 2>/dev/null

echo ""
echo "✅ Тестирование завершено!"