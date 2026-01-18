# Task 4: Автоматизация развёртывания и тестирования

## Автор
Гуреев Евгений  
**Дата:** 17.01.2026

## Проект
task4/
├── booking-service/          # Исходный код приложения (Go)
│   ├── Dockerfile           # Docker образ
│   ├── main.go              # Исходный код
│   ├── values-prod.yaml     # Values для prod (не используется напрямую)
│   └── values-staging.yaml  # Values для staging (не используется напрямую)
├── helm/                    # Helm chart
│   └── booking-service/
│       ├── Chart.yaml       # Метаданные chart
│       ├── templates/       # Шаблоны Kubernetes
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       ├── values-prod.yaml    # Values для prod
│       ├── values-staging.yaml # Values для staging
│       └── values.yaml         # Default values
├── check-status.sh          # Скрипт проверки
└── check-dns.sh            # Дополнительные проверки

## Установка ПО

1. Установить minikube  
```
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb  
sudo dpkg -i minikube_latest_amd64.deb
```

2. Установить kubectl (Kubernetes CLI)  
```
sudo snap install kubectl --classic
```

3. Установить Helm  
```
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## Запуск minikube

```
# Запустить minikube кластер
minikube start --driver=docker

# Проверить статус
minikube status

# Настроить kubectl для работы с minikube
kubectl config use-context minikube
```

## Сборка образа Docker

```
# Перейти в директорию с исходным кодом
cd tasks/task4/booking-service

# Проверить содержимое
ls -la
# Dockerfile, main.go, values-*.yaml

# Собрать Docker образ
docker build -t booking-service:latest .

# Проверить собранный образ
docker images | grep booking-service

# Загрузить образ в minikube
minikube image load booking-service:latest

# Проверить образ в minikube
minikube image ls | grep booking-service
```

## Развертывание через Helm

```
# Перейти в директорию Helm chart
cd ../helm/booking-service

# Проверить структуру chart
ls -la
# Chart.yaml, templates/, values-*.yaml

# Установить Helm release (staging версия)
helm install booking-service . --values values-staging.yaml

# ИЛИ для production версии
helm install booking-service . --values values-prod.yaml
```

**Важно**: В values-staging.yaml используется pullPolicy: Never, поэтому образ должен быть уже загружен в minikube.

## Проверка развертывания

```
# 1. Проверить Helm release
helm list

# 2. Проверить deployment
kubectl get deployment booking-service

# 3. Проверить pods
kubectl get pods -l app=booking-service

# 4. Проверить service
kubectl get service booking-service

# 5. Проверить endpoints
kubectl get endpoints booking-service

# 6. Проверить логи приложения
kubectl logs -l app=booking-service --tail=20
```
