import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";

export class ApiService {
  private client: AxiosInstance;

  constructor(baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl ?? "http://localhost:25001/api/v1",
      timeout: 3000,
      withCredentials: true,
    });
  }

  private registerInterceptors() {
    this.client.interceptors.request.use();
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
