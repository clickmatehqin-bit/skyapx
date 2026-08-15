import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "./core/db";
import {
  getAdminFromSession,
  loginWithCredentials,
  logoutCurrentSession,
  requireAdmin,
  generateId,
  type AdminIdentity,
} from "./core/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string; admin?: AdminIdentity }> => {
    try {
      const admin = await loginWithCredentials(data.email, data.password);
      if (!admin) return { ok: false, message: "Invalid credentials" };
      return { ok: true, admin };
    } catch (err) {
      console.error("login failed:", err);
      return { ok: false, message: "Login unavailable, please try again later" };
    }
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  await logoutCurrentSession();
  return { ok: true };
});

export const getCurrentAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminIdentity | null> => {
    return getAdminFromSession();
  },
);

interface AdminStats {
  totalEnquiries: number;
  newEnquiries: number;
  contactedEnquiries: number;
  interestedEnquiries: number;
  joinedEnquiries: number;
  closedEnquiries: number;
  recentEnquiries: Array<{
    id: string;
    ref: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    date: string;
    status: string;
  }>;
  monthlyEnquiries: Array<{ month: string; count: number }>;
  courseDistribution: Array<{ name: string; count: number }>;
  courseCount: number;
  feedbackCount: number;
  subscriberCount: number;
}

export const getAdminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminStats> => {
    await requireAdmin();

    const [total, byStatus, recent, monthly, courses] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM enquiries"),
      query<{ status: string; count: number }>(
        "SELECT status, COUNT(*) AS count FROM enquiries GROUP BY status",
      ),
      query<{
        id: string;
        ref_no: number;
        name: string;
        email: string;
        phone: string;
        subject: string;
        created_at: Date | string;
        status: string;
      }>(
        "SELECT id, ref_no, name, email, phone, subject, created_at, status FROM enquiries ORDER BY created_at DESC LIMIT 6",
      ),
      query<{ month_key: string; month: string; count: number }>(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key,
                DATE_FORMAT(created_at, '%b') AS month,
                COUNT(*) AS count
           FROM enquiries
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY month_key, month
          ORDER BY month_key ASC`,
      ),
      query<{ category: string; count: number }>(
        "SELECT category, COUNT(*) AS count FROM courses GROUP BY category ORDER BY count DESC",
      ),
    ]);

    const statusMap = new Map(byStatus.map((r) => [r.status, Number(r.count)]));
    const num = (s: unknown) => Number(s ?? 0);

    const counts = {
      newEnquiries: statusMap.get("New") ?? 0,
      contactedEnquiries: statusMap.get("Contacted") ?? 0,
      interestedEnquiries: statusMap.get("Interested") ?? 0,
      joinedEnquiries: statusMap.get("Joined") ?? 0,
      closedEnquiries: statusMap.get("Closed") ?? 0,
    };

    const [courseCountRow, feedbackRow, subscriberRow] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM courses"),
      queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM course_feedbacks"),
      queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM newsletter_subscribers"),
    ]);

    return {
      totalEnquiries: num(total?.count),
      ...counts,
      recentEnquiries: recent.map((r) => ({
        id: r.id,
        ref: `ENQ-${String(r.ref_no).padStart(4, "0")}`,
        name: r.name,
        email: r.email,
        phone: r.phone,
        subject: r.subject,
        date: new Date(r.created_at).toISOString(),
        status: r.status,
      })),
      monthlyEnquiries: monthly.map((r) => ({ month: r.month, count: Number(r.count) })),
      courseDistribution: courses.map((r) => ({ name: r.category, count: Number(r.count) })),
      courseCount: num(courseCountRow?.count),
      feedbackCount: num(feedbackRow?.count),
      subscriberCount: num(subscriberRow?.count),
    };
  },
);

export const checkAdminHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: boolean; message: string }> => {
    try {
      await queryOne("SELECT 1 AS ok");
      return { ok: true, message: "database ok" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "db unavailable" };
    }
  },
);

export interface SubscriberRecord {
  id: string;
  email: string;
  created_at: string;
}

export const listSubscribers = createServerFn({ method: "GET" }).handler(
  async (): Promise<SubscriberRecord[]> => {
    await requireAdmin();
    const rows = await query<{ id: string; email: string; created_at: Date | string }>(
      "SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC",
    );
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      created_at: new Date(r.created_at).toISOString(),
    }));
  },
);

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const getAdminProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminProfile | null> => {
    const identity = await requireAdmin();
    return { id: identity.id, name: identity.name, email: identity.email, role: identity.role };
  },
);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
});

export const updateAdminProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateProfileSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    const admin = await requireAdmin();
    try {
      await query("UPDATE admins SET name = ?, email = ? WHERE id = ?", [
        data.name,
        data.email,
        admin.id,
      ]);
      return { ok: true };
    } catch {
      return { ok: false, message: "Update failed" };
    }
  });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(120),
});

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => changePasswordSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    const admin = await requireAdmin();
    try {
      const row = await queryOne<{ password_hash: string }>(
        "SELECT password_hash FROM admins WHERE id = ?",
        [admin.id],
      );
      if (!row) return { ok: false, message: "Admin not found" };
      const bcrypt = (await import("bcryptjs")).default;
      const valid = await bcrypt.compare(data.currentPassword, row.password_hash);
      if (!valid) return { ok: false, message: "Current password is incorrect" };
      const newHash = await bcrypt.hash(data.newPassword, 10);
      await query("UPDATE admins SET password_hash = ? WHERE id = ?", [newHash, admin.id]);
      return { ok: true };
    } catch {
      return { ok: false, message: "Failed to change password" };
    }
  });

// ---------------------------------------------------------------------------
// Admin User Management (list / create / update / delete admin users)
// ---------------------------------------------------------------------------

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
}

export const listAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminUserRecord[]> => {
    await requireAdmin();
    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: string;
      permissions: string;
      created_at: Date | string;
    }>("SELECT id, name, email, role, permissions, created_at FROM admins ORDER BY created_at ASC");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      permissions: r.permissions ? r.permissions.split(",").map((p) => p.trim()) : [],
      created_at: new Date(r.created_at).toISOString(),
    }));
  },
);

const createAdminUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(120),
  role: z.string().trim().min(1).max(50).default("admin"),
  permissions: z.array(z.string()).default(["enquiries", "courses"]),
});

export const createAdminUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => createAdminUserSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    await requireAdmin();
    try {
      const existing = await queryOne<{ id: string }>("SELECT id FROM admins WHERE email = ?", [
        data.email,
      ]);
      if (existing) return { ok: false, message: "Email already registered" };
      const id = generateId();
      const bcrypt = (await import("bcryptjs")).default;
      const hash = await bcrypt.hash(data.password, 10);
      await query(
        "INSERT INTO admins (id, name, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?, ?)",
        [id, data.name, data.email, hash, data.role, data.permissions.join(",")],
      );
      return { ok: true };
    } catch (err) {
      console.error("create admin user failed:", err);
      return { ok: false, message: "Could not create user" };
    }
  });

const updateAdminUserSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  role: z.string().trim().min(1).max(50),
  permissions: z.array(z.string()),
});

export const updateAdminUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateAdminUserSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    const currentAdmin = await requireAdmin();
    try {
      if (data.id === currentAdmin.id) {
        await query(
          "UPDATE admins SET name = ?, email = ?, role = ?, permissions = ? WHERE id = ?",
          [data.name, data.email, data.role, data.permissions.join(","), data.id],
        );
      } else {
        const existing = await queryOne<{ id: string }>(
          "SELECT id FROM admins WHERE email = ? AND id != ?",
          [data.email, data.id],
        );
        if (existing) return { ok: false, message: "Email already used by another user" };
        await query(
          "UPDATE admins SET name = ?, email = ?, role = ?, permissions = ? WHERE id = ?",
          [data.name, data.email, data.role, data.permissions.join(","), data.id],
        );
      }
      return { ok: true };
    } catch (err) {
      console.error("update admin user failed:", err);
      return { ok: false, message: "Update failed" };
    }
  });

const deleteAdminUserSchema = z.object({ id: z.string().trim().min(1) });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => deleteAdminUserSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    const currentAdmin = await requireAdmin();
    if (data.id === currentAdmin.id)
      return { ok: false, message: "Cannot delete your own account" };
    try {
      await query("DELETE FROM admins WHERE id = ?", [data.id]);
      return { ok: true };
    } catch (err) {
      console.error("delete admin user failed:", err);
      return { ok: false, message: "Delete failed" };
    }
  });

const resetPasswordSchema = z.object({
  id: z.string().trim().min(1),
  newPassword: z.string().min(6).max(120),
});

export const resetAdminPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => resetPasswordSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    await requireAdmin();
    try {
      const bcrypt = (await import("bcryptjs")).default;
      const hash = await bcrypt.hash(data.newPassword, 10);
      await query("UPDATE admins SET password_hash = ? WHERE id = ?", [hash, data.id]);
      return { ok: true };
    } catch {
      return { ok: false, message: "Failed to reset password" };
    }
  });
