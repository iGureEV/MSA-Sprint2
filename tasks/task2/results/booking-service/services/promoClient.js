const axios = require('axios');

class PromoClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000
    });
  }

  async validatePromoCode(code, userID) {
    try {
      const response = await this.client.post(`/api/promos/validate?code=${code}&userId=${userID}`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось проверить промо-код: ${error.message}`);
    }
  }
}

module.exports = PromoClient;