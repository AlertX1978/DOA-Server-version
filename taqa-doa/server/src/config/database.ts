import { Pool, QueryResult, QueryResultRow } from 'pg';

// ---------------------------------------------------------------------------
// Connection pool
// ---------------------------------------------------------------------------

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                   // maximum number of clients in the pool
  idleTimeoutMillis: 30_000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 5_000, // fail fast if DB is unreachable
});

// Log pool-level errors so they don't crash the process silently
pool.on('error', (err) => {
  console.error('[database] Unexpected error on idle client:', err.message);
});

// ---------------------------------------------------------------------------
// Query helper
// ---------------------------------------------------------------------------

/**
 * Execute a parameterised SQL query against the connection pool.
 *
 * @example
 *   const { rows } = await query('SELECT * FROM users WHERE id = $1', [42]);
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('[database] query', { text: text.slice(0, 80), duration: `${duration}ms`, rows: result.rowCount });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

/**
 * Run a lightweight query to verify the database is reachable.
 * Used by the /health endpoint.
 */
export async function testConnection(): Promise<QueryResult> {
  return pool.query('SELECT NOW()');
}

// ---------------------------------------------------------------------------
// Graceful shutdown helper
// ---------------------------------------------------------------------------

export async function closePool(): Promise<void> {
  await pool.end();
  console.log('[database] Connection pool closed');
}

export { pool };
