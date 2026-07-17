import { betterAuth } from 'better-auth';
import type { Auth, BetterAuthOptions } from 'better-auth';
import Database = require('better-sqlite3');
import { config } from './config/config';

export const authDatabase: Database.Database = new Database(
  config.database_path,
);

export const authOptions: BetterAuthOptions = {
  appName: '65 Passion Montagne',
  baseURL: config.better_auth_url,
  basePath: '/api/auth',
  secret: config.better_auth_secret,
  database: authDatabase,
  trustedOrigins: config.better_auth_trusted_origins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.BETTER_AUTH_ALLOW_SIGN_UP !== 'true',
  },
  user: {
    modelName: 'AuthUser',
  },
  session: {
    modelName: 'AuthSession',
  },
  account: {
    modelName: 'AuthAccount',
  },
  verification: {
    modelName: 'AuthVerification',
  },
};

export const auth: Auth = betterAuth(authOptions);
