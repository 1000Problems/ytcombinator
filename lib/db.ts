import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

/**
 * Execute a parameterized SQL query against Neon.
 * Returns the result rows typed as T[].
 *
 * Uses the Pool class from @neondatabase/serverless —
 * works in Vercel serverless, edge, and standalone Node scripts.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { rows } = await getPool().query(sql, params);
  return rows as T[];
}

/**
 * Execute a query and return the first row, or null if no rows.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a query that returns a single scalar value.
 */
export async function queryScalar<T = number>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const row = await queryOne<Record<string, T>>(sql, params);
  if (!row) return null;
  const keys = Object.keys(row);
  return keys.length > 0 ? row[keys[0]] : null;
}
