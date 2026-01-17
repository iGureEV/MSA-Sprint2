const axios = require('axios');

class ReviewClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000
    });
  }

  async isHotelTrusted(hotelID) {
    try {
      const response = await this.client.get(`/api/reviews/hotel/${hotelID}/trusted`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось проверить статус доверия к отелю: ${error.message}`);
    }
  }
}

module.exports = ReviewClient;