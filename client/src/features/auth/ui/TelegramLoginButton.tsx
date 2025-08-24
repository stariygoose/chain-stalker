import { useRef } from "react";
import { useTelegramLogin } from "../model/useTelegramLogin";

export const TelegramLoginButton = () => {
  const telegramBtnRef = useRef<HTMLDivElement>(null);

  useTelegramLogin(telegramBtnRef);

  return (
    <>
      <div ref={telegramBtnRef} className="mt-5"></div>
      <noscript> You must enable javascript to connect your telegram</noscript>
    </>
  );
};
