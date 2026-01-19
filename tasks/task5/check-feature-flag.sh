#!/bin/bash
set -e

echo "▶️ Проверка Feature Flag..."

echo "1. Запрос БЕЗ заголовка (должен следовать канареечным правилам):"
curl -s http://localhost:9090/ping
echo ""

echo "2. Запрос С заголовком X-Feature-Enabled: true (должен идти на v2):"
curl -s -H "X-Feature-Enabled: true" http://localhost:9090/ping
echo ""

echo "3. Проверка endpoint /feature (только на v2):"
echo "   Без заголовка:"
curl -s -w " (status: %{http_code})" http://localhost:9090/feature
echo ""
echo "   С заголовком:"
curl -s -H "X-Feature-Enabled: true" -w " (status: %{http_code})" http://localhost:9090/feature
echo ""
