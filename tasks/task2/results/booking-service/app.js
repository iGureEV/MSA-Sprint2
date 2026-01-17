const { startServer } = require('./grpc/server');

console.log('Запуск сервиса бронирования...');

// Start the gRPC server
startServer().catch(error => {
  console.error('Не удалось запустить сервис бронирования:', error);
  process.exit(1);
});
