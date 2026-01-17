const { v4: uuidv4 } = require('uuid');

class BookingService {
  constructor(repo, userClient, hotelClient, reviewClient, promoClient, kafkaProducer) {
    this.repo = repo;
    this.userClient = userClient;
    this.hotelClient = hotelClient;
    this.reviewClient = reviewClient;
    this.promoClient = promoClient;
    this.kafkaProducer = kafkaProducer;
  }

  async createBooking(userID, hotelID, promoCode) {
    console.log(`Создание бронирования: userID=${userID}, hotelID=${hotelID}, promoCode=${promoCode}`);

    await this.validateUser(userID);

    await this.validateHotel(hotelID);

    const basePrice = await this.resolveBasePrice(userID);
    let discount = 0;
    
    try {
      discount = await this.resolvePromoDiscount(promoCode, userID);
    } catch (error) {
      console.log(`Не удалось получить скидку по промо-коду: ${error.message}`);
    }

    const finalPrice = basePrice - discount;
    console.log(`Финальная цена рассчитана: базовая=${basePrice}, скидка=${discount}, итоговая=${finalPrice}`);

    const booking = {
      user_id: userID,
      hotel_id: hotelID,
      promo_code: promoCode,
      discount_percent: discount,
      price: finalPrice,
      created_at: new Date().toISOString()
    };

    const bookingCreated = await this.repo.create(booking);

    try {
      await this.kafkaProducer.publishBookingCreated(bookingCreated);
    } catch (error) {
      console.log(`Не удалось опубликовать событие бронирования в Kafka: ${error.message}`);
    }

    console.log('Бронирование успешно создано:', booking);

    return bookingCreated;
  }

  async listBookings(userID) {
    if (userID) {
      return await this.repo.getByUserID(userID);
    }
    return await this.repo.getAll();
  }

  async validateUser(userID) {
    try {
      const active = await this.userClient.isUserActive(userID);
      if (!active) {
        throw new Error(`Пользователь ${userID} неактивен`);
      }

      const blacklisted = await this.userClient.isUserBlacklisted(userID);
      if (blacklisted) {
        throw new Error(`Пользователь ${userID} заблокирован`);
      }
    } catch (error) {
      console.log('Проверка пользователя не удалась:', error);
      throw new Error(`Проверка пользователя не удалась: ${error.message}`);
    }
  }

  async validateHotel(hotelID) {
    try {
      const operational = await this.hotelClient.isHotelOperational(hotelID);
      if (!operational) {
        throw new Error(`Отель ${hotelID} не работает`);
      }

      const trusted = await this.reviewClient.isHotelTrusted(hotelID);
      if (!trusted) {
        throw new Error(`Отель ${hotelID} не является доверенным`);
      }

      const fullyBooked = await this.hotelClient.isHotelFullyBooked(hotelID);
      if (fullyBooked) {
        throw new Error(`Отель ${hotelID} полностью забронирован`);
      }
    } catch (error) {
      console.log('Проверка отеля не удалась:', error);
      throw new Error(`Проверка отеля не удалась: ${error.message}`);
    }
  }

  async resolveBasePrice(userID) {
    try {
      const status = await this.userClient.getUserStatus(userID);
      if (status === "VIP") {
        return 80.0;
      }
      return 100.0;
    } catch (error) {
      console.log(`Не удалось получить статус пользователя ${userID}, используется цена по умолчанию: ${error.message}`);
      return 100.0;
    }
  }

  async resolvePromoDiscount(promoCode, userID) {
    if (!promoCode) {
      return 0.0;
    }

    try {
      const promo = await this.promoClient.validatePromoCode(promoCode, userID);
      return promo.discount || 0.0;
    } catch (error) {
      console.log(`Неверный промо-код:`, error);
      throw new Error(`Неверный промо-код: ${error.message}`);
    }
  }
}

module.exports = BookingService;