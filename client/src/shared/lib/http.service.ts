import axios from "axios";

export class HttpService {
  private readonly BASE_URL: string =
    "https://gecko-special-dinosaur.ngrok-free.app/api/v1";

  public async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.get<T>(`${this.BASE_URL}${endpoint}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (e) {
      throw e;
    }
  }
}
