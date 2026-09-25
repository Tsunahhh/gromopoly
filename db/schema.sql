CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  pseudo text UNIQUE NOT NULL,
  token text UNIQUE NOT NULL,
  points integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  games integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_pseudo_lower_unique ON profiles (lower(pseudo));

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  code text PRIMARY KEY,
  host_id text NOT NULL,
  status text NOT NULL,
  state jsonb NOT NULL,
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rooms_updated_at_idx ON rooms(updated_at);
