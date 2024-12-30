import axios from 'axios';

class ApiClient {
  private client = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = token;
  }

  clearAuthHeader() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  async get<T>(url: string) {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const api = new ApiClient();