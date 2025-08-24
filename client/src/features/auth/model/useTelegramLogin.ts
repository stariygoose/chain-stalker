import { useEffect, type RefObject } from "react";

const TELEGRAM_WIDGET_CONFIG = {
  src: "https://telegram.org/js/telegram-widget.js?22",
  botName: import.meta.env.VITE_TG_BOT_NAME || "my_test_dev_super_bot",
  authUrl:
    import.meta.env.VITE_TG_AUTH_URL ||
    "https://gecko-special-dinosaur.ngrok-free.app/api/v1/auth/telegram-login",
} as const;

export const useTelegramLogin = (ref: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    if (document.querySelector("script[data-telegram-login]") || !ref.current) {
      return;
    }

    const script = Object.assign(document.createElement("script"), {
      src: TELEGRAM_WIDGET_CONFIG.src,
      async: true,
    });

    [
      ["data-telegram-login", TELEGRAM_WIDGET_CONFIG.botName],
      ["data-size", "large"],
      ["data-auth-url", TELEGRAM_WIDGET_CONFIG.authUrl],
      ["data-request-access", "write"],
    ].forEach(([key, value]) => script.setAttribute(key, value));

    ref.current.appendChild(script);

    return () => {
      document.querySelector("script[data-telegram-login]")?.remove();
    };
  }, [ref]);
};
