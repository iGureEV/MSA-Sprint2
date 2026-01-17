const { Pool } = require('pg');

class BookingRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'booking_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async create(booking) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO bookings (user_id, hotel_id, promo_code, discount_percent, price, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        booking.user_id,
        booking.hotel_id,
        booking.promo_code,
        booking.discount_percent,
        booking.price,
        booking.created_at
      ];
      
      const result = await client.query(query, values);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getByUserID(userID) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM bookings 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userID]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getAll() {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM bookings
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async initSchema() {
    const client = await this.pool.connect();
    try {
      // Создание таблицы бронирований, если она не существует
      await client.query(`
        CREATE SEQUENCE IF NOT EXISTS bookings_id_seq;
        CREATE TABLE IF NOT EXISTS bookings (
          id BIGINT DEFAULT nextval('bookings_id_seq') PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          hotel_id VARCHAR(255) NOT NULL,
          promo_code VARCHAR(255),
          discount_percent DECIMAL(10, 2) DEFAULT 0.00,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
      `);
      
      console.log("Схема базы данных инициализирована успешно");
    } finally {
      client.release();
    }
  }
}

module.exports = BookingRepository;