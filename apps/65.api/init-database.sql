-- Script d'initialisation de la base de données pour 65.API

-- Création de la table user
CREATE TABLE IF NOT EXISTS User (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  roleId INTEGER NOT NULL,
  authUserId VARCHAR(255) UNIQUE NOT NULL,
  FOREIGN KEY (roleId) REFERENCES UserRole(id)
);

CREATE TABLE IF NOT EXISTS AuthUser (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL,
  image TEXT,
  createdAt DATE NOT NULL,
  updatedAt DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS AuthSession (
  id TEXT PRIMARY KEY NOT NULL,
  expiresAt DATE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt DATE NOT NULL,
  updatedAt DATE NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES AuthUser(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AuthAccount (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt DATE,
  refreshTokenExpiresAt DATE,
  scope TEXT,
  password TEXT,
  createdAt DATE NOT NULL,
  updatedAt DATE NOT NULL,
  FOREIGN KEY (userId) REFERENCES AuthUser(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AuthVerification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATE NOT NULL,
  createdAt DATE NOT NULL,
  updatedAt DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS AuthSession_userId_idx ON AuthSession(userId);
CREATE INDEX IF NOT EXISTS AuthAccount_userId_idx ON AuthAccount(userId);
CREATE INDEX IF NOT EXISTS AuthVerification_identifier_idx ON AuthVerification(identifier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_auth_user_id ON User(authUserId);

CREATE TABLE IF NOT EXISTS UserRole (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS State (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_path VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Category (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_path VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS J_Category_State (
  categoryId VARCHAR(255) NOT NULL,
  stateId VARCHAR(255) NOT NULL,
  PRIMARY KEY (categoryId, stateId),
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (stateId) REFERENCES State(id)
);

CREATE TABLE IF NOT EXISTS Image (
  id VARCHAR(255) PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  hikeId VARCHAR(255) NOT NULL,
  ordered INTEGER NOT NULL,
  rotate INTEGER DEFAULT 0,
  FOREIGN KEY (hikeId) REFERENCES Hike(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Difficulty (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Hike (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  indication TEXT,
  categoryId VARCHAR(255) NOT NULL,
  stateId VARCHAR(255) NOT NULL,
  mainImageId VARCHAR(255),
  mainImagePosition INTEGER NOT NULL,
  difficultyId VARCHAR(255) NOT NULL,
  distance INTEGER,
  duration VARCHAR(255),
  elevation INTEGER,
  FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE CASCADE,
  FOREIGN KEY (stateId) REFERENCES State(id) ON DELETE CASCADE,
  FOREIGN KEY (mainImageId) REFERENCES Image(id),
  FOREIGN KEY (difficultyId) REFERENCES Difficulty(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HikeGPX (
  id VARCHAR(255) PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  hikeId VARCHAR(255) NOT NULL,
  FOREIGN KEY (hikeId) REFERENCES Hike(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Favorite (
  userId VARCHAR(255) NOT NULL,
  hikeId VARCHAR(255) NOT NULL,
  PRIMARY KEY (userId, hikeId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (hikeId) REFERENCES Hike(id) ON DELETE CASCADE
);

-- Création d'un index sur l'email pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_hikes_name ON Hike(title);

INSERT INTO UserRole (id, name) VALUES (0, 'user');
INSERT INTO UserRole (id, name) VALUES (1, 'admin');
