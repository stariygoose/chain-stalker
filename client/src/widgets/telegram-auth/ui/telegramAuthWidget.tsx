import { useRef } from "react";
import { useTelegramLogin } from "../model/useTelegramLogin";

export const TelegramAuthWidget = () => {
  const telegramBtnRef = useRef<HTMLDivElement>(null);

  useTelegramLogin(telegramBtnRef);

  return <div ref={telegramBtnRef} className="mt-5"></div>;
};
