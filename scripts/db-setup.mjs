#!/usr/bin/env node
/**
 * Sky APX — Database setup / migration runner (MySQL).
 *
 * Reads the connection string from DATABASE_URL,
 * applies db/schema.sql and db/seed.sql, then ensures the admin account
 * exists with the password from ADMIN_PASSWORD (default: admin123).
 *
 * Usage:
 *   npm run db:setup
 *   ADMIN_PASSWORD=s3cret npm run db:setup
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, "..", "db");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    '✖ DATABASE_URL is not set.\n  Example: DATABASE_URL=mysql://root:password@localhost:3306/skyapx npm run db:setup',
  );
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@skyapx.com";
const ADMIN_NAME = process.env.ADMIN_NAME || "Sky APX Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const parsed = new URL(databaseUrl);
const connection = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port) || 3306,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace("/", ""),
  multipleStatements: true,
});

async function applySqlFile(file, label) {
  const sql = await readFile(file, "utf8");
  try {
    await connection.query(sql);
  } catch (err) {
    if (err.code === "ER_DUP_KEYNAME" || err.code === "ER_DUP_ENTRY") {
      console.log(`⚠ ${label} — some objects already exist, skipping duplicates`);
    } else {
      throw err;
    }
  }
  console.log(`✓ ${label}`);
}

async function ensureAdmin() {
  const [rows] = await connection.query(
    "SELECT id FROM admins WHERE email = ? LIMIT 1",
    [ADMIN_EMAIL],
  );
  if (rows.length > 0) {
    console.log(`✓ admin '${ADMIN_EMAIL}' already exists`);
    return;
  }
  const { v4: uuidv4 } = await import("uuid");
  const id = uuidv4();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await connection.query(
    "INSERT INTO admins (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
    [id, ADMIN_NAME, ADMIN_EMAIL, hash],
  );
  console.log(`✓ admin '${ADMIN_EMAIL}' created (password from ADMIN_PASSWORD env)`);
}

async function main() {
  try {
    console.log("🔌 connected to database");
    await applySqlFile(join(dbDir, "schema.sql"), "schema.sql");
    await applySqlFile(join(dbDir, "seed.sql"), "seed.sql");
    await ensureAdmin();
    console.log("✅ database ready");
  } catch (err) {
    console.error("✖ database setup failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
