const axios = require('axios');

class HotelClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000
    });
  }

  async getHotel(hotelID) {
    try {
      const response = await this.client.get(`/api/hotels/${hotelID}`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось получить отель: ${error.message}`);
    }
  }

  async isHotelOperational(hotelID) {
    try {
      const response = await this.client.get(`/api/hotels/${hotelID}/operational`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось проверить операционный статус отеля: ${error.message}`);
    }
  }

  async isHotelFullyBooked(hotelID) {
    try {
      const response = await this.client.get(`/api/hotels/${hotelID}/fully-booked`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось проверить статус бронирования отеля: ${error.message}`);
    }
  }
}

module.exports = HotelClient;