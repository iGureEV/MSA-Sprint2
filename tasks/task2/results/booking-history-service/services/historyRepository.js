const { Pool } = require('pg');

class HistoryRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'booking_history_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async saveBookingHistory(event) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Сохранение истории бронирования
      const query = `
        INSERT INTO booking_history (booking_id, user_id, hotel_id, promo_code, discount_percent, price, created_at, event_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (booking_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          hotel_id = EXCLUDED.hotel_id,
          promo_code = EXCLUDED.promo_code,
          discount_percent = EXCLUDED.discount_percent,
          price = EXCLUDED.price,
          created_at = EXCLUDED.created_at,
          event_type = EXCLUDED.event_type
      `;
      
      const values = [
        event.booking_id,
        event.user_id,
        event.hotel_id,
        event.promo_code,
        event.discount_percent,
        event.price,
        event.created_at,
        event.event_type
      ];
      
      await client.query(query, values);
      await client.query('COMMIT');
      
      console.log(`История бронирования сохранена для ${event.booking_id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateUserStats(event) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Обновление статистики пользователя
      const query = `
        INSERT INTO user_stats (user_id, total_bookings, total_spent, last_booking_date)
        VALUES ($1, 1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET
          total_bookings = user_stats.total_bookings + 1,
          total_spent = user_stats.total_spent + EXCLUDED.total_spent,
          last_booking_date = EXCLUDED.last_booking_date
      `;
      
      const values = [
        event.user_id,
        event.price,
        event.created_at
      ];
      
      await client.query(query, values);
      await client.query('COMMIT');
      
      console.log(`Статистика пользователя обновлена для пользователя ${event.user_id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateHotelStats(event) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Обновление статистики отеля
      const query = `
        INSERT INTO hotel_stats (hotel_id, total_bookings, total_revenue, last_booking_date)
        VALUES ($1, 1, $2, $3)
        ON CONFLICT (hotel_id) DO UPDATE SET
          total_bookings = hotel_stats.total_bookings + 1,
          total_revenue = hotel_stats.total_revenue + EXCLUDED.total_revenue,
          last_booking_date = EXCLUDED.last_booking_date
      `;
      
      const values = [
        event.hotel_id,
        event.price,
        event.created_at
      ];
      
      await client.query(query, values);
      await client.query('COMMIT');
      
      console.log(`Статистика отеля обновлена для отеля ${event.hotel_id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateDailyStats(event) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Обновление ежедневной статистики
      const date = event.created_at.split('T')[0];
      const query = `
        INSERT INTO daily_stats (date, total_bookings, total_revenue)
        VALUES ($1, 1, $2)
        ON CONFLICT (date) DO UPDATE SET
          total_bookings = daily_stats.total_bookings + 1,
          total_revenue = daily_stats.total_revenue + EXCLUDED.total_revenue
      `;
      
      const values = [
        date,
        event.price
      ];
      
      await client.query(query, values);
      await client.query('COMMIT');
      
      console.log(`Ежедневная статистика обновлена для ${date}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async initSchema() {
    const client = await this.pool.connect();
    try {
      // Создание таблицы истории бронирований
      await client.query(`
        CREATE TABLE IF NOT EXISTS booking_history (
          booking_id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          hotel_id VARCHAR(255) NOT NULL,
          promo_code VARCHAR(255),
          discount_percent DECIMAL(10, 2) DEFAULT 0.00,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          event_type VARCHAR(50) NOT NULL
        )
      `);
      
      // Создание таблицы статистики пользователей
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_stats (
          user_id VARCHAR(255) PRIMARY KEY,
          total_bookings INTEGER DEFAULT 0,
          total_spent DECIMAL(12, 2) DEFAULT 0.00,
          last_booking_date TIMESTAMP
        )
      `);
      
      // Создание таблицы статистики отелей
      await client.query(`
        CREATE TABLE IF NOT EXISTS hotel_stats (
          hotel_id VARCHAR(255) PRIMARY KEY,
          total_bookings INTEGER DEFAULT 0,
          total_revenue DECIMAL(12, 2) DEFAULT 0.00,
          last_booking_date TIMESTAMP
        )
      `);
      
      // Создание таблицы ежедневной статистики
      await client.query(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          date DATE PRIMARY KEY,
          total_bookings INTEGER DEFAULT 0,
          total_revenue DECIMAL(12, 2) DEFAULT 0.00
        )
      `);
      
      console.log("Схема базы данных истории инициализирована успешно");
    } finally {
      client.release();
    }
  }
}

module.exports = HistoryRepository;