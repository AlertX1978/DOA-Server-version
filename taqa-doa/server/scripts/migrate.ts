/**
 * Migration runner — executes SQL migration files in order against the database.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts          # Run all migrations
 *   npx tsx scripts/migrate.ts --seed   # Run schema + seed migrations
 *   npx tsx scripts/migrate.ts --reset  # Drop all tables and re-run
 *
 * Migration files are read from server/migrations/ in alphabetical order.
 * A `schema_migrations` table tracks which files have already been applied.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

// Load env from server/.env or project root .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[migrate] DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return new Set(rows.map((r: { filename: string }) => r.filename));
}

async function getMigrationFiles(): Promise<string[]> {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

async function runMigration(filename: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`[migrate] Applying: ${filename}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`[migrate] Applied:  ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[migrate] FAILED:   ${filename}`);
    throw error;
  } finally {
    client.release();
  }
}

async function resetDatabase(): Promise<void> {
  console.log('[migrate] Resetting database — dropping all tables...');

  const client = await pool.connect();
  try {
    // Drop all tables in the public schema
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Drop custom types
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace) LOOP
          EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log('[migrate] All tables and types dropped.');
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  try {
    // Test connection
    const { rows } = await pool.query('SELECT NOW()');
    console.log(`[migrate] Connected to database at ${new Date(rows[0].now).toISOString()}`);

    // Reset if requested
    if (shouldReset) {
      await resetDatabase();
    }

    // Ensure tracking table
    await ensureMigrationsTable();

    // Get state
    const applied = await getAppliedMigrations();
    const files = await getMigrationFiles();

    // Filter to pending
    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('[migrate] All migrations are up to date.');
    } else {
      console.log(`[migrate] ${pending.length} migration(s) to apply:`);
      for (const file of pending) {
        await runMigration(file);
      }
      console.log(`[migrate] Done — ${pending.length} migration(s) applied successfully.`);
    }
  } catch (error) {
    console.error('[migrate] Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
