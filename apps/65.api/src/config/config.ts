/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
require('dotenv').config();

const splitOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ??
  (process.env.NODE_ENV === 'production'
    ? undefined
    : 'development-only-better-auth-secret-change-me');

if (!betterAuthSecret) {
  throw new Error('BETTER_AUTH_SECRET est obligatoire en production');
}

export const config = {
  port: process.env.PORT || 3001,
  database_path: process.env.DATABASE_PATH || 'db.sqlite',
  image_path: process.env.IMAGE_PATH || 'images',
  gpx_path: process.env.GPX_PATH || 'gpx',
  better_auth_url: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  better_auth_secret: betterAuthSecret,
  better_auth_trusted_origins: splitOrigins(
    process.env.BETTER_AUTH_TRUSTED_ORIGINS || 'http://localhost:3000',
  ),
} as const;
