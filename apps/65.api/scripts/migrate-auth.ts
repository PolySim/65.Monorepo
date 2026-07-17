import { getMigrations } from 'better-auth/db/migration';
import { authDatabase, authOptions } from '../src/auth';

async function migrateAuth(): Promise<void> {
  const userColumns = authDatabase
    .prepare("PRAGMA table_info('User')")
    .all() as Array<{ name: string }>;

  if (userColumns.length > 0) {
    if (userColumns.some((column) => column.name === 'subId')) {
      authDatabase.exec('ALTER TABLE User RENAME COLUMN subId TO authUserId');
    }

    authDatabase.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_auth_user_id ON User(authUserId)',
    );
  }

  const { runMigrations } = await getMigrations(authOptions);
  await runMigrations();

  console.info('Migration Better Auth terminée.');
}

void migrateAuth().catch((error: unknown) => {
  console.error('Échec de la migration Better Auth', error);
  process.exitCode = 1;
});
