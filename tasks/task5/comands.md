Согласно задания, из task4 скопированы папки helm и booking-service

## Установка istioctl
```shell
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.*
export PATH=$PWD:$PATH
sudo cp bin/istioctl /usr/local/bin/
```

Проверить статус minikube
```
# Проверить статус minikube
minikube status

# Если minikube не запущен (дождаться полного запуска)
minikube start --driver=docker

# Проверить конфигурацию kubectl
kubectl cluster-info
```

Проверить версию Istio без подключения к кластеру
```
# Проверить только клиентскую версию
istioctl version --remote=false

# Показало:
# client version: 1.28.2
```

Проверка, что istioctl установлено
```shell
istioctl version

# Показало
# client version: 1.28.2
# control plane version: 1.28.2
# data plane version: 1.28.2 (2 proxies)
```
Установка в minikube
```shell
istioctl install --set profile=demo -y
```

Переустановка (если требуется):
```
# Удалить Istio если был установлен
istioctl uninstall --purge -y

# Очистка namespace
kubectl delete namespace istio-system --wait=true

# Переустановка
istioctl install --set profile=demo -y
```

Проверка установки
```
kubectl get pods -n istio-system

# Показало
# NAME                                    READY   STATUS    RESTARTS   AGE
# istio-egressgateway-7dcdbd74c5-krbxm    1/1     Running   0          3m59s
# istio-ingressgateway-69cfc6566f-xfkwt   1/1     Running   0          3m59s
# istiod-6c844b7969-wr4jk                 1/1     Running   0          4m4s
```

В каталоге установленного Istio есть примеры аддонов:
```shell
kubectl apply -f samples/addons/prometheus.yaml	# Мониторинг и метрики
kubectl apply -f samples/addons/grafana.yaml	# Визуализация метрик
kubectl apply -f samples/addons/kiali.yaml		# Визуализация service mesh
kubectl apply -f samples/addons/jaeger.yaml		# Трассировка
```
```
# observability стек
Запрос → Tracing (Jaeger) → Metrics (Prometheus) → Visualization (Grafana/Kiali)
```
Использование после установки:
```
# Kiali (визуализация mesh)
istioctl dashboard kiali

# Grafana (дашборды)
istioctl dashboard grafana

# Prometheus (метрики)
istioctl dashboard prometheus

# Jaeger (трассировка)
istioctl dashboard jaeger

# или через порт-форвардинг
kubectl port-forward svc/kiali 20001:20001 -n istio-system
# Открыть http://localhost:20001
```
Эти аддоны превращают Istio из "просто service mesh" в полноценную платформу с полной observability,
что критически важно для управления микросервисной архитектурой.

Сборка докер образа из предыдущей задачи
```
# поиск нужного образа в списке доступных
docker images | grep booking-service

# если нет, то сборка
cd booking-service
docker build -t task4-booking-service:latest .

# проверка образа в minikube
minikube image ls | grep booking-service
```

Проверка для каких namespace включен sidecar
```shell
kubectl get namespace --show-labels | grep istio-injection=enabled
```
```shell
kubectl get pods -n istio-system
```
Другой способ проверки включения sidecar
```shell
kubectl get namespace task4-booking-service -o json | jq '.metadata.labels."istio-injection"'
```

включите инъекции istio в каждый под в неймспейсе.
Делается для namespace task4-booking-service, т.к. используется результат прошлого задания.
```shell
kubectl label namespace task4-booking-service istio-injection=enabled --overwrite
```
Дашборд kiali
```shell
istioctl dashboard kiali
```
Дашборд jaeger
```shell
istioctl dashboard jaeger
```
Выполнение тестового запроса (трафик можно мосмотреть с дашбордах)
```
kubectl run test-curl --image=alpine/curl:latest --rm -it --restart=Never -n task4-booking-service -- sh -c "curl -v http://task4-booking-service/ping && echo ''"
```

Для удобства дебага можно использовать access_log — в demo он включён по умолчанию
```shell
kubectl logs -l app=task4-booking-service -n task4-booking-service
```

Сборка двух версий образа
```shell
docker build -t task4-booking-service:1.0 ./booking-service
```
```shell
docker build -t task4-booking-service:2.0 ./booking-service
```

Деплой приложения
```shell
helm install task4-booking-service ./helm/booking-service --debug
```

```shell
helm upgrade --install task4-booking-service ./helm/booking-service --debug
```

```shell
helm uninstall task4-booking-service ./helm/booking-service --debug
```


поиск порта Istio
```shell
kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{range .spec.ports[?(@.name=="http2")]}{.nodePort}{end}'
```

Разворачивание через helm
```
# Перейти в директорию с Helm chart
cd helm/booking-service

# Установить версию v1 с отдельным именем релиза
helm install booking-service-v1 . \
  --namespace task4-booking-service \
  --values ../../results/v_helm/values-v1.yaml \
  --set deployment.name=booking-service-v1 \
  --set service.create=false  # Не создавать service, он будет отдельно

# Установить версию v2 с отдельным именем релиза
helm install booking-service-v2 . \
  --namespace task4-booking-service \
  --values ../../results/v_helm/values-v2.yaml \
  --set deployment.name=booking-service-v2 \
  --set service.create=false

# Применить service манифест
kubectl apply -f ../../results/booking-service-svc.yaml -n task4-booking-service

# Проверка (1)
kubectl get svc -n task4-booking-service
# Показало:
# NAME                    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
# booking-service         ClusterIP   10.106.81.10     <none>        80/TCP    3m4s
# booking-service-v1      ClusterIP   10.111.154.231   <none>        80/TCP    4m2s
# booking-service-v2      ClusterIP   10.104.177.16    <none>        80/TCP    3m44s
# task4-booking-service   ClusterIP   10.100.48.22     <none>        80/TCP    34m

# Проверка (2)
kubectl get pods -n task4-booking-service --show-labels
# Показало:
# NAME                                     READY   STATUS    RESTARTS   AGE     LABELS
# booking-service-v1-76b6975966-n986f      2/2     Running   0          5m6s    app=booking-service-v1,pod-template-hash=76b6975966,security.istio.io/tlsMode=istio,service.istio.io/canonical-name=booking-service-v1,service.istio.io/canonical-revision=latest
# booking-service-v2-56dfcf9848-6srqz      2/2     Running   0          4m48s   app=booking-service-v2,pod-template-hash=56dfcf9848,security.istio.io/tlsMode=istio,service.istio.io/canonical-name=booking-service-v2,service.istio.io/canonical-revision=latest
# task4-booking-service-56fb8fb767-bgwd7   2/2     Running   0          35m     app=task4-booking-service,pod-template-hash=56fb8fb767,security.istio.io/tlsMode=istio,service.istio.io/canonical-name=task4-booking-service,service.istio.io/canonical-revision=latest
```

Разворачивание через кубер (альтернативное, или более правильное, как посмотреть)
```
kubectl apply -f results/v_kube/deployment-v1.yaml -f results/v_kube/deployment-v2.yaml -f results/booking-service-svc.yaml

# проверка
kubectl get all -n task4-booking-service
# показало
# NAME                                      READY   STATUS    RESTARTS   AGE
# pod/booking-service-v1-85674b99c7-pp6c8   2/2     Running   0          11s
# pod/booking-service-v2-679c57fd97-qtb5d   2/2     Running   0          11s
#
# NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
# deployment.apps/booking-service-v1   1/1     1            1           11s
# deployment.apps/booking-service-v2   1/1     1            1           11s
#
# NAME                                            DESIRED   CURRENT   READY   AGE
# replicaset.apps/booking-service-v1-85674b99c7   1         1         1       11s
# replicaset.apps/booking-service-v2-679c57fd97   1         1         1       11s
```

Создание Istio ресурсов
```
cd results/istio

# создание ресурсов
kubectl apply -f destination-rule.yaml -f virtual-service.yaml -f gateway.yaml -n task4-booking-service

# Проверить
kubectl get virtualservice,destinationrule,gateway -n task4-booking-service

# проверка ресурсов
kubectl get destinationrule,virtualservice,gateway -n task4-booking-service
# показало
# NAME                                                  HOST              AGE
# destinationrule.networking.istio.io/booking-service   booking-service   48s
#
# NAME                                                 GATEWAYS   HOSTS                 AGE
# virtualservice.networking.istio.io/booking-service              ["booking-service"]   48s
#
# NAME                                          AGE
# gateway.networking.istio.io/booking-gateway   48s
```



