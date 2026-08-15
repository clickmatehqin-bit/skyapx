import { randomBytes } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { query } from "./db";

export const SESSION_COOKIE = "skyapx_admin";
const SESSION_TTL_DAYS = 30;

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
};

function getToken(): string | undefined {
  return getCookie(SESSION_COOKIE);
}

export function generateId(): string {
  return uuidv4();
}

async function createSessionToken(adminId: string): Promise<string> {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const id = generateId();
  await query("INSERT INTO admin_sessions (id, admin_id, token, expires_at) VALUES (?, ?, ?, ?)", [
    id,
    adminId,
    token,
    expiresAt,
  ]);
  setCookie(SESSION_COOKIE, token, cookieOptions);
  return token;
}

interface SessionAdminRow extends AdminIdentity {
  password_hash: string;
}

/**
 * Return the currently authenticated admin (if any), looking up the session
 * token from the request cookie. Returns null when unauthenticated or when the
 * database is unreachable.
 */
export async function getAdminFromSession(): Promise<AdminIdentity | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const rows = await query<SessionAdminRow>(
      `SELECT a.id, a.name, a.email, a.role
         FROM admin_sessions s
         JOIN admins a ON a.id = s.admin_id
        WHERE s.token = ? AND s.expires_at > NOW()
        LIMIT 1`,
      [token],
    );
    const admin = rows[0];
    if (!admin) return null;
    return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
  } catch {
    return null;
  }
}

/**
 * Throw when the request is not authenticated as an admin.
 * Returns the admin identity when authenticated.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdminFromSession();
  if (!admin) {
    throw new Error("Unauthorized");
  }
  return admin;
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AdminIdentity | null> {
  const rows = await query<SessionAdminRow>(
    "SELECT id, name, email, role, password_hash FROM admins WHERE email = ? LIMIT 1",
    [email],
  );
  const admin = rows[0];
  if (!admin) return null;
  const bcrypt = (await import("bcryptjs")).default;
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return null;
  await createSessionToken(admin.id);
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
}

export async function logoutCurrentSession(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await query("DELETE FROM admin_sessions WHERE token = ?", [token]);
    } catch {
      // ignore db errors on logout
    }
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
