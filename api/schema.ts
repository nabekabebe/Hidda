import type { Sql } from "./db.js";

export async function ensureSchema(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL DEFAULT '',
      middle_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      nickname TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT 'unknown',
      birth_date TEXT NOT NULL DEFAULT '',
      death_date TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      occupation TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      source_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      target_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS atlas_meta (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Untitled atlas',
      inscriptions JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `;
  await sql`
    INSERT INTO atlas_meta (id, name, inscriptions)
    VALUES ('default', 'Untitled atlas', '[]'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS shares (
      token TEXT PRIMARY KEY,
      permission TEXT NOT NULL,
      scope TEXT NOT NULL,
      root_person_id TEXT,
      snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
