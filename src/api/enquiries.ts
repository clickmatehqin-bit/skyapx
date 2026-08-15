import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query } from "./core/db";
import { generateId, requireAdmin } from "./core/auth";
import { sendEnquiryEmail } from "./core/email";

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: z.string().trim().min(1, "Phone number is required").max(40),
  subject: z.string().trim().min(1, "Please select a subject").max(120),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export interface EnquiryRecord {
  id: string;
  ref: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: string;
  notes: string;
}

function mapRow(row: {
  id: string;
  ref_no: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  notes: string;
  created_at: Date | string;
}): EnquiryRecord {
  return {
    id: row.id,
    ref: `ENQ-${String(row.ref_no).padStart(4, "0")}`,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    date: new Date(row.created_at).toISOString(),
    status: row.status,
    notes: row.notes,
  };
}

export const createEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => enquirySchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string; id?: string }> => {
    try {
      const id = generateId();
      await query(
        `INSERT INTO enquiries (id, name, email, phone, subject, message)
           VALUES (?, ?, ?, ?, ?, ?)`,
        [id, data.name, data.email, data.phone, data.subject, data.message],
      );
      sendEnquiryEmail(data).catch(() => {});
      return { ok: true, id };
    } catch (err) {
      console.error("create enquiry failed:", err);
      return { ok: false, message: "Could not save your enquiry, please try again later." };
    }
  });

export const listEnquiries = createServerFn({ method: "GET" }).handler(
  async (): Promise<EnquiryRecord[]> => {
    await requireAdmin();
    const rows = await query<{
      id: string;
      ref_no: number;
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
      status: string;
      notes: string;
      created_at: Date | string;
    }>(
      `SELECT id, ref_no, name, email, phone, subject, message, status, notes, created_at
         FROM enquiries ORDER BY created_at DESC`,
    );
    return rows.map(mapRow);
  },
);

const updateEnquirySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(1).max(120),
  status: z.enum(["New", "Contacted", "Interested", "Joined", "Closed"]),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const updateEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateEnquirySchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    await requireAdmin();
    try {
      await query(
        `UPDATE enquiries
              SET name = ?, email = ?, phone = ?, subject = ?, status = ?, notes = ?, updated_at = NOW()
            WHERE id = ?`,
        [data.name, data.email, data.phone, data.subject, data.status, data.notes, data.id],
      );
      return { ok: true };
    } catch (err) {
      console.error("update enquiry failed:", err);
      return { ok: false, message: "Update failed" };
    }
  });

const deleteEnquirySchema = z.object({ id: z.string() });

export const deleteEnquiryFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => deleteEnquirySchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    await requireAdmin();
    try {
      await query("DELETE FROM enquiries WHERE id = ?", [data.id]);
      return { ok: true };
    } catch (err) {
      console.error("delete enquiry failed:", err);
      return { ok: false, message: "Delete failed" };
    }
  });
