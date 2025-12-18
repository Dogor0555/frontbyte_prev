export const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
