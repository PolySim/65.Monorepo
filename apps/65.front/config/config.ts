export const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
  CLERK_PUBLISHABLE_KEY: process.env
    .NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
} as const;
