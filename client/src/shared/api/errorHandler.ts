import type { AxiosError } from "axios";

type AppError = {
  type: "auth" | "notification";
  message: string;
};

export const errorHandler = (error: AxiosError): AppError => {
  const status = error.response?.status;

  switch (status) {
    case 401:
    case 440:
      return {
        type: "auth",
        message: "Please, log in again.",
      };
    case 404:
      return {
        type: "notification",
        message: "Resource not found.",
      };
    case 500:
      return {
        type: "notification",
        message: "Internal server error.",
      };
    default:
      return {
        type: "notification",
        message: "Something went wrong.",
      };
  }
};
