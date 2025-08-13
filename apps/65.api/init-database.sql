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

-- Création d'un index sur l'email pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON User(email);

INSERT INTO UserRole (id, name) VALUES (0, 'user');
INSERT INTO UserRole (id, name) VALUES (1, 'admin');