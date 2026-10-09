-- ROCAS: autenticación y datos de investigación para PostgreSQL/Neon.
-- Ejecutar en la base Neon antes de habilitar cuentas. Es idempotente para tablas existentes.
-- No contiene usuarios, contraseñas, datos reales ni claves de conexión.

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  email TEXT NOT NULL UNIQUE CHECK (
    char_length(email) BETWEEN 3 AND 254 AND email = lower(email)
  ),
  password_hash TEXT NOT NULL CHECK (password_hash LIKE '$2%'),
  role TEXT NOT NULL CHECK (role IN ('tutor', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  -- Solo se persiste el SHA-256 del token opaco; el valor original vive en una cookie HttpOnly.
  session_token_hash CHAR(64) NOT NULL UNIQUE CHECK (session_token_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS auth_sessions_active_lookup_idx
  ON auth_sessions(session_token_hash)
  WHERE revoked_at IS NULL;

-- Las respuestas quedan asociadas al tutor autenticado en el servidor.
-- El JSON contiene solo campos del instrumento; actor, UUID, código y marcas de tiempo
-- se mantienen en columnas controladas por el servidor.
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE RESTRICT,
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('OBS', 'GF', 'E')),
  instrument_code TEXT NOT NULL UNIQUE CHECK (char_length(instrument_code) BETWEEN 8 AND 40),
  application_date DATE NOT NULL,
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS research_sessions_owner_created_idx
  ON research_sessions(owner_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS research_sessions_created_idx
  ON research_sessions(created_at DESC, id DESC);

-- Un único documento de trabajo analítico por proyecto. El API lo entrega y modifica
-- exclusivamente a administradores y aplica control de versión optimista.
CREATE TABLE IF NOT EXISTS rocas_project_state (
  project_key TEXT PRIMARY KEY CHECK (project_key = 'rocas'),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  state JSONB NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  updated_by UUID NOT NULL REFERENCES auth_users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bitácora sin rutas de edición o borrado en la aplicación.
CREATE TABLE IF NOT EXISTS researcher_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 60),
  entity_type TEXT NOT NULL CHECK (char_length(entity_type) BETWEEN 1 AND 60),
  entity_id TEXT NOT NULL CHECK (char_length(entity_id) BETWEEN 1 AND 120),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  details JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS researcher_audit_log_created_idx
  ON researcher_audit_log(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS researcher_audit_log_actor_created_idx
  ON researcher_audit_log(actor_id, created_at DESC);

-- Crea rocas_runtime_app y rocas_provisioner_app desde SQL, no desde la consola/API de Neon,
-- que otorgan membresía en neon_superuser. Luego ejecuta db/least-privilege.sql.
-- Define las contraseñas de forma privada; nunca las escribas en este archivo.
