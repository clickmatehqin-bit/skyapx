import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("[db] DATABASE_URL is not set. process.env keys:", Object.keys(process.env).filter(k => k.includes("DATA") || k.includes("DB") || k.includes("MYSQL")));
      throw new Error("DATABASE_URL is not set");
    }
    console.log("[db] Connecting to MySQL:", url.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@"));
    const parsed = new URL(url);
    pool = mysql.createPool({
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  try {
    const [rows] = await getPool().execute<T[]>(sql, params as never[]);
    return rows;
  } catch (err) {
    console.error("[db] query error:", sql.slice(0, 100), err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}
