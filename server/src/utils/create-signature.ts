import { createHmac } from "crypto";

export const createSignature = (
  timestamp: string,
  userId: string,
  method: string,
  url: string,
  secretKey: string,
) => {
  const payload = `${timestamp}:${userId}:${method}:${url}`;
  return createHmac("sha256", secretKey).update(payload).digest("hex");
};
