import _axios from "axios";
import { errorHandler } from "./errorHandler";

type InterceptorCallbacks = {
  onAuthError: (msg: string) => void;
  onError: (msg: string) => void;
};

export const axios = _axios.create({
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  baseURL: "https://gecko-special-dinosaur.ngrok-free.app/api/v1",
});

const registerInterceptors = (callbacks: InterceptorCallbacks) => {
  axios.interceptors.response.use(
    (r) => r,
    (e) => {
      const { type, message } = errorHandler(e);
      switch (type) {
        case "auth":
          callbacks.onAuthError(message);
          break;
        case "notification":
          callbacks.onError(message);
          break;
        default:
          break;
      }
      return Promise.reject(e);
    },
  );
};

export const initializeAxios = (callbacks: InterceptorCallbacks) => {
  registerInterceptors(callbacks);
};
