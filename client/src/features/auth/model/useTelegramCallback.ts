import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/entities/user";
import { useCallback } from "react";

export const useTelegramCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useUserStore((store) => store.setUser);

  const handleCallback = useCallback(() => {
    const userId = searchParams.get("userId") ?? "0";
    const username = searchParams.get("username") ?? "";
    const firstName = searchParams.get("firstName") ?? "";
    const pfp = searchParams.get("pfp") ?? "";

    setUser({
      userId: Number(userId),
      username,
      firstName,
      pfp,
    });

    navigate("/dashboard");
  }, [searchParams, setUser, navigate]);

  return { handleCallback };
};
