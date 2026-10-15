ALTER TABLE beto_revisions ADD COLUMN request_hash TEXT;
ALTER TABLE beto_revisions ADD COLUMN receipt_id TEXT;
CREATE TABLE beto_users (
 id TEXT PRIMARY KEY NOT NULL,
 email TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','operador')),
 password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1,
 created TEXT NOT NULL
);
CREATE TABLE beto_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX idx_beto_sessions_user ON beto_sessions(user_id);
CREATE TABLE beto_auth_attempts (
 key TEXT PRIMARY KEY NOT NULL,
 attempts INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
