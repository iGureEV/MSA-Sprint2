const axios = require('axios');

class UserClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000
    });
  }

  async getUser(userID) {
    try {
      const response = await this.client.get(`/api/users/${userID}`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось получить пользователя: ${error.message}`);
    }
  }

  async isUserActive(userID) {
    try {
      const response = await this.client.get(`/api/users/${userID}/active`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось проверить статус активности пользователя: ${error.message}`);
    }
  }

  async isUserBlacklisted(userID) {
    try {
      const response = await this.client.get(`/api/users/${userID}/blacklisted`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось проверить статус блокировки пользователя: ${error.message}`);
    }
  }

  async getUserStatus(userID) {
    try {
      const response = await this.client.get(`/api/users/${userID}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось получить статус пользователя: ${error.message}`);
    }
  }
}

module.exports = UserClient;