const { Kafka, Partitioners } = require('kafkajs');

class KafkaProducer {
  constructor(brokers, topic) {
    this.topic = topic;
    this.kafka = new Kafka({
      clientId: 'booking-service',
      brokers: brokers,
      connectionTimeout: 10000,
      requestTimeout: 1000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner
    });
  }

  async connect() {
    await this.producer.connect();
  }

  async publishBookingCreated(booking) {
    try {
      const event = {
        booking_id: booking.id,
        user_id: booking.user_id,
        hotel_id: booking.hotel_id,
        promo_code: booking.promo_code,
        discount_percent: booking.discount_percent,
        price: booking.price,
        created_at: booking.created_at,
        event_type: 'BOOKING_CREATED'
      };

      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: booking.id,
            value: JSON.stringify(event)
          }
        ]
      });

      console.log(`Сообщение отправлено в топик ${this.topic} для бронирования ${booking.id}`);
    } catch (error) {
      console.error('Не удалось отправить сообщение в Kafka:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}

module.exports = KafkaProducer;