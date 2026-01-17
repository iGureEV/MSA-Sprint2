const HistoryRepository = require('./services/historyRepository');
const BookingConsumer = require('./services/kafkaConsumer');

console.log('Запуск сервиса истории бронирований...');

// Environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'booking_history';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'booking-history-group';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'bookings';

console.log(`Брокеры Kafka: ${KAFKA_BROKERS.join(',')}`);
console.log(`База данных: host=${DB_HOST} port=${DB_PORT} name=${DB_NAME}`);

// Initialize repository
const repo = new HistoryRepository();
repo.initSchema();

// Initialize Kafka consumer
const bookingConsumer = new BookingConsumer(KAFKA_BROKERS, KAFKA_GROUP_ID, KAFKA_TOPIC, repo);

// Start consumer
async function startConsumer() {
  try {
    await bookingConsumer.connect();
    await bookingConsumer.start();
    console.log('Сервис истории бронирований успешно запущен');
  } catch (error) {
    console.error('Не удалось запустить сервис истории бронирований:', error);
    process.exit(1);
  }
}

startConsumer().catch(error => {
  console.error('Не удалось запустить потребителя:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Корректное завершение работы...');
  try {
    await bookingConsumer.disconnect();
    console.log('Потребитель отключен');
  } catch (error) {
    console.error('Ошибка при завершении работы:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Получен сигнал SIGTERM, корректное завершение работы...');
  try {
    await bookingConsumer.disconnect();
    console.log('Потребитель отключен');
  } catch (error) {
    console.error('Ошибка при завершении работы:', error);
  }
  process.exit(0);
});