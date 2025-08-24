import { initializeAxios } from "@/shared/api/axios";
import { useNotificationStore } from "@/features/notification";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/entities/user";

export function AxiosProvider<T extends { children: React.ReactNode }>({
  children,
}: T) {
  const navigate = useNavigate();
  const show = useNotificationStore((state) => state.show);
  const clearUser = useUserStore((state) => state.clearUser);

  initializeAxios({
    onAuthError: (msg) => {
      show(msg);
      clearUser();
      navigate("/");
    },
    onError: (msg) => {
      show(msg);
    },
  });

  return <>{children}</>;
}
