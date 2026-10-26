-- Schéma MariaDB de 9adhiya. Idempotent : appliqué automatiquement au démarrage de l'API.
-- Pas de comptes : une seule liste de courses partagée par tous les appareils.

CREATE TABLE IF NOT EXISTS shopping_list (
  id TINYINT NOT NULL PRIMARY KEY,
  data LONGTEXT NOT NULL,
  revision BIGINT NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT UTC_TIMESTAMP(3),
  CONSTRAINT shopping_list_single CHECK (id = 1),
  CONSTRAINT shopping_list_json CHECK (JSON_VALID(data))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chaque version enregistrée est conservée (les 200 dernières) : filet de sécurité, la liste étant modifiable sans connexion.
CREATE TABLE IF NOT EXISTS shopping_list_history (
  revision BIGINT NOT NULL PRIMARY KEY,
  data LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT UTC_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
