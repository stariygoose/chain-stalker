import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useJwtTokensStore } from "../model/store";

export const TelegramCallbackWidget = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setTokens = useJwtTokensStore((s) => s.setTokensExpirationTime);

  useEffect(() => {
    console.log("here");
    const accessExp = Number(searchParams.get("accessExp"));
    const refreshExp = Number(searchParams.get("refreshExp"));
    setTokens(accessExp, refreshExp);
    navigate("/dashboard");
  });

  return <div>Loading...</div>;
};
