import { useEffect } from "react";
import { useNotificationStore } from "../model/notification.store";

export const Notification = () => {
  const message = useNotificationStore((state) => state.message);
  const isOpen = useNotificationStore((state) => state.isOpen);
  const hide = useNotificationStore((state) => state.hide);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      hide();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, hide]);

  return (
    isOpen && (
      <div className="bg-red-500 absolute top-1 right-50">
        <p>Notification</p> <p>{message}</p>
      </div>
    )
  );
};
