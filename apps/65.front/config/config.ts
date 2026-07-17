export const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;
