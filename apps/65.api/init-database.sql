-- Script d'initialisation de la base de données pour 65.API

-- Création de la table user
CREATE TABLE IF NOT EXISTS User (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  roleId INTEGER NOT NULL,
  subId VARCHAR(255) NOT NULL,
  FOREIGN KEY (roleId) REFERENCES UserRole(id)
);

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

-- Création d'un index sur l'email pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON User(email);

INSERT INTO UserRole (id, name) VALUES (0, 'user');
INSERT INTO UserRole (id, name) VALUES (1, 'admin');