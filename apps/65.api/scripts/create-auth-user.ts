import { auth, authDatabase } from '../src/auth';

async function createAuthUser(): Promise<void> {
  const email = process.env.AUTH_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.AUTH_USER_PASSWORD;
  const name = process.env.AUTH_USER_NAME?.trim() || email?.split('@')[0];

  if (!email || !password || !name) {
    throw new Error(
      'AUTH_USER_EMAIL et AUTH_USER_PASSWORD sont obligatoires (AUTH_USER_NAME est optionnel)',
    );
  }

  const applicationUser = authDatabase
    .prepare('SELECT id FROM User WHERE lower(email) = ?')
    .get(email) as { id: string } | undefined;

  if (!applicationUser) {
    throw new Error(`Aucun utilisateur métier préautorisé pour ${email}`);
  }

  const existingAuthUser = authDatabase
    .prepare('SELECT id FROM AuthUser WHERE lower(email) = ?')
    .get(email) as { id: string } | undefined;

  if (existingAuthUser) {
    authDatabase
      .prepare('UPDATE User SET authUserId = ? WHERE id = ?')
      .run(existingAuthUser.id, applicationUser.id);
    console.info(`Le compte Better Auth de ${email} est déjà relié.`);
    return;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  authDatabase
    .prepare('UPDATE User SET authUserId = ? WHERE id = ?')
    .run(result.user.id, applicationUser.id);

  console.info(`Compte Better Auth créé et relié pour ${email}.`);
}

void createAuthUser().catch((error: unknown) => {
  console.error('Échec de la création du compte Better Auth', error);
  process.exitCode = 1;
});
