const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load protobuf
const PROTO_PATH = path.join(__dirname, '..', 'proto', 'booking.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

// Import services
const BookingRepository = require('../services/bookingRepository');
const BookingService = require('../services/bookingService');
const UserClient = require('../services/userClient');
const HotelClient = require('../services/hotelClient');
const ReviewClient = require('../services/reviewClient');
const PromoClient = require('../services/promoClient');
const KafkaProducer = require('../services/kafkaProducer');

// Environment variables
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:8080';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
const GRPC_PORT = process.env.GRPC_PORT || '9090';

// Initialize services
const repo = new BookingRepository();
const userClient = new UserClient(MONOLITH_URL);
const hotelClient = new HotelClient(MONOLITH_URL);
const reviewClient = new ReviewClient(MONOLITH_URL);
const promoClient = new PromoClient(MONOLITH_URL);
const kafkaProducer = new KafkaProducer(KAFKA_BROKERS, 'bookings');
const bookingService = new BookingService(repo, userClient, hotelClient, reviewClient, promoClient, kafkaProducer);

// gRPC service implementations
const bookingServiceImpl = {
  CreateBooking: async (call, callback) => {
    console.log(`gRPC CreateBooking вызван: userID=${call.request.user_id}, hotelID=${call.request.hotel_id}, promoCode=${call.request.promo_code}`);
    
    try {
      const booking = await bookingService.createBooking(
        call.request.user_id,
        call.request.hotel_id,
        call.request.promo_code
      );
      console.log(`gRPC CreateBooking получен ответ:`, booking);
      
      callback(null, {
        id: booking.id,
        user_id: booking.user_id,
        hotel_id: booking.hotel_id,
        promo_code: booking.promo_code,
        discount_percent: booking.discount_percent,
        price: booking.price,
        created_at: booking.created_at
      });
    } catch (error) {
      console.error('Не удалось создать бронирование:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  },
  
  ListBookings: async (call, callback) => {
    console.log(`gRPC ListBookings вызван: userID=${call.request.user_id}`);
    
    try {
      const bookings = await bookingService.listBookings(call.request.user_id);
      
      const pbBookings = bookings.map(booking => ({
        id: booking.id,
        user_id: booking.user_id,
        hotel_id: booking.hotel_id,
        promo_code: booking.promo_code,
        discount_percent: booking.discount_percent,
        price: booking.price,
        created_at: booking.created_at
      }));

      console.log(`gRPC ListBookings получен ответ:`, pbBookings);
      
      callback(null, {
        bookings: pbBookings
      });
    } catch (error) {
      console.error('Не удалось получить список бронирований:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message
      });
    }
  }
};

// Start gRPC server
async function startServer() {
  // Initialize repository schema
  await repo.initSchema();
  
  // Connect to Kafka
  try {
    await kafkaProducer.connect();
    console.log('Подключение к Kafka установлено');
  } catch (error) {
    console.error('Не удалось подключиться к Kafka:', error);
  }
  
  // Create gRPC server
  const server = new grpc.Server();
  server.addService(bookingProto.BookingService.service, bookingServiceImpl);
  
  // Start server
  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Не удалось запустить gRPC сервер:', err);
      return;
    }
    
    server.start();
    console.log(`Сервис бронирования запущен на порту ${port}`);
    console.log(`URL монолита: ${MONOLITH_URL}`);
    console.log(`Брокеры Kafka: ${KAFKA_BROKERS.join(',')}`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Корректное завершение работы...');
    await kafkaProducer.disconnect();
    server.tryShutdown(() => {
      console.log('Сервер завершил работу');
      process.exit(0);
    });
  });
}

module.exports = { startServer };