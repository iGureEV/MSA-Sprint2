const { Kafka } = require('kafkajs');

class BookingConsumer {
  constructor(brokers, groupId, topic, repo) {
    this.topic = topic;
    this.repo = repo;
    
    this.kafka = new Kafka({
      clientId: 'booking-history-service',
      brokers: brokers
    });
    
    this.consumer = this.kafka.consumer({
      groupId: groupId
    });
  }

  async connect() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
  }

  async start() {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Получено сообщение: topic=${topic} partition=${partition} offset=${message.offset}`);
        
        try {
          const event = JSON.parse(message.value.toString());
          await this.processBookingEvent(event);
        } catch (error) {
          console.error('Не удалось обработать сообщение:', error);
        }
      },
    });
    
    console.log(`Потребитель запущен для топика '${this.topic}'`);
  }

  async processBookingEvent(event) {
    console.log(`Обработка события бронирования: ${event.event_type} для пользователя ${event.user_id} и отеля ${event.hotel_id}`);
    
    try {
      // Сохранение истории бронирования
      await this.repo.saveBookingHistory(event);
      
      // Обновление статистики пользователя
      await this.repo.updateUserStats(event);
      
      // Обновление статистики отеля
      await this.repo.updateHotelStats(event);
      
      // Обновление ежедневной статистики
      await this.repo.updateDailyStats(event);
      
      console.log(`Событие бронирования успешно обработано: ${event.booking_id}`);
    } catch (error) {
      console.error(`Не удалось обработать событие бронирования: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}

module.exports = BookingConsumer;