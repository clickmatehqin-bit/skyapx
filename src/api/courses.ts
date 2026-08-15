import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "./core/db";
import { generateId, requireAdmin } from "./core/auth";
import { sendFeedbackEmail } from "./core/email";

export interface CourseRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  cover_image_url: string;
  original_price: string;
  offer_price: string;
  discount_percentage: string;
  modules_count: string;
  lessons_count: string;
  duration_hours: string;
  languages: string;
  description: string;
  is_published: boolean;
  sort_order: number;
}

const COURSE_COLUMNS = `id, slug, title, category, cover_image_url, original_price, offer_price,
  discount_percentage, modules_count, lessons_count, duration_hours, languages, description,
  is_published, sort_order`;

export interface CourseFeedbackRecord {
  id: string;
  name: string;
  text: string;
  date: string;
}

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  cover_image_url: string;
  original_price: string;
  offer_price: string;
  discount_percentage: string;
  modules_count: string;
  lessons_count: string;
  duration_hours: string;
  languages: string;
  description: string;
  is_published: boolean;
  sort_order: number;
}

function mapCourse(row: CourseRow): CourseRecord {
  return { ...row };
}

const slugSchema = z.object({ slug: z.string().trim().min(1).max(160) });

/** Public: published courses, ordered for the site. */
export const listCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<CourseRecord[]> => {
    try {
      const rows = await query<CourseRow>(
        `SELECT ${COURSE_COLUMNS} FROM courses
          WHERE is_published = 1
          ORDER BY sort_order ASC, created_at ASC`,
      );
      return rows.map(mapCourse);
    } catch {
      return [];
    }
  },
);

/** Admin: all courses including drafts. */
export const listAllCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<CourseRecord[]> => {
    await requireAdmin();
    try {
      const rows = await query<CourseRow>(
        `SELECT ${COURSE_COLUMNS} FROM courses ORDER BY sort_order ASC, created_at ASC`,
      );
      return rows.map(mapCourse);
    } catch {
      return [];
    }
  },
);

/** Public: single course by slug (404 fallback handled by the UI). */
export const getCourseBySlug = createServerFn({ method: "GET" })
  .validator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }): Promise<CourseRecord | null> => {
    try {
      const row = await queryOne<CourseRow>(
        `SELECT ${COURSE_COLUMNS} FROM courses WHERE slug = ?`,
        [data.slug],
      );
      return row ? mapCourse(row) : null;
    } catch {
      return null;
    }
  });

/** Public: approved feedback for a course, newest first. */
export const listCourseFeedbacks = createServerFn({ method: "GET" })
  .validator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }): Promise<CourseFeedbackRecord[]> => {
    try {
      const rows = await query<{ id: string; name: string; text: string; created_at: Date | string }>(
        `SELECT f.id, f.name, f.text, f.created_at
             FROM course_feedbacks f
             JOIN courses c ON c.id = f.course_id
            WHERE c.slug = ? AND f.is_approved = 1
            ORDER BY f.created_at DESC`,
        [data.slug],
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        text: r.text,
        date: new Date(r.created_at).toISOString(),
      }));
    } catch {
      return [];
    }
  });

const submitFeedbackSchema = z.object({
  slug: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1, "Name is required").max(120),
  text: z.string().trim().min(1, "Feedback is required").max(500),
});

/** Public: submit feedback. Stored unapproved, visible after admin approval. */
export const submitCourseFeedback = createServerFn({ method: "POST" })
  .validator((input: unknown) => submitFeedbackSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    try {
      const course = await queryOne<{ id: string }>("SELECT id FROM courses WHERE slug = ?", [
        data.slug,
      ]);
      if (!course) return { ok: false, message: "Course not found" };
      const id = generateId();
      await query(
        "INSERT INTO course_feedbacks (id, course_id, name, text, is_approved) VALUES (?, ?, ?, ?, 0)",
        [id, course.id, data.name, data.text],
      );
      const courseRow = await queryOne<{ title: string }>("SELECT title FROM courses WHERE id = ?", [course.id]);
      sendFeedbackEmail({ courseName: courseRow?.title ?? data.slug, studentName: data.name, feedback: data.text }).catch(() => {});
      return { ok: true };
    } catch (err) {
      console.error("submit feedback failed:", err);
      return { ok: false, message: "Could not submit feedback, please try again later." };
    }
  });

/** Admin: list every feedback (including unapproved). */
export const listAllFeedbacks = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    Array<CourseFeedbackRecord & { course_slug: string; is_approved: boolean }>
  > => {
    await requireAdmin();
    const rows = await query<{
      id: string;
      name: string;
      text: string;
      course_slug: string;
      is_approved: boolean;
      created_at: Date | string;
    }>(
      `SELECT f.id, f.name, f.text, c.slug AS course_slug, f.is_approved, f.created_at
         FROM course_feedbacks f
         JOIN courses c ON c.id = f.course_id
        ORDER BY f.created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      text: r.text,
      course_slug: r.course_slug,
      is_approved: r.is_approved,
      date: new Date(r.created_at).toISOString(),
    }));
  },
);

const approveFeedbackSchema = z.object({
  id: z.string(),
  is_approved: z.boolean(),
});

export const setFeedbackApproval = createServerFn({ method: "POST" })
  .validator((input: unknown) => approveFeedbackSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    await requireAdmin();
    await query("UPDATE course_feedbacks SET is_approved = ? WHERE id = ?", [
      data.is_approved ? 1 : 0,
      data.id,
    ]);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Admin — course CRUD (used by the "Create New Course" screen)
// ---------------------------------------------------------------------------

const courseInputSchema = z.object({
  title: z.string().trim().min(1, "Course title is required").max(200),
  category: z.string().trim().min(1).max(120).default("Medical Coding"),
  cover_image: z.string().trim().max(3_000_000).optional().default(""),
  original_price: z.string().trim().max(40).optional().default(""),
  offer_price: z.string().trim().max(40).optional().default(""),
  discount: z.string().trim().max(40).optional().default(""),
  modules: z.string().trim().max(40).optional().default("0"),
  lessons: z.string().trim().max(40).optional().default("0"),
  duration: z.string().trim().max(40).optional().default("0"),
  languages: z.string().trim().max(120).optional().default("English"),
  description: z.string().trim().max(20_000).optional().default(""),
  is_published: z.boolean().optional().default(true),
});

export type CourseInput = z.infer<typeof courseInputSchema>;

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "course"
  );
}

export const createCourse = createServerFn({ method: "POST" })
  .validator((input: unknown) => courseInputSchema.parse(input))
  .handler(
    async ({ data }): Promise<{ ok: boolean; message?: string; id?: string; slug?: string }> => {
      await requireAdmin();
      try {
        const baseSlug = slugify(data.title);
        const existing = await queryOne<{ slug: string }>(
          "SELECT slug FROM courses WHERE slug = ?",
          [baseSlug],
        );
        const slug = existing ? `${baseSlug}-${Date.now().toString(36).slice(-5)}` : baseSlug;

        const id = generateId();
        await query(
          `INSERT INTO courses
             (id, slug, title, category, cover_image_url, original_price, offer_price,
              discount_percentage, modules_count, lessons_count, duration_hours,
              languages, description, is_published, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 999)`,
          [
            id,
            slug,
            data.title,
            data.category,
            data.cover_image,
            data.original_price,
            data.offer_price,
            data.discount,
            data.modules,
            data.lessons,
            data.duration,
            data.languages,
            data.description,
            data.is_published ? 1 : 0,
          ],
        );
        return { ok: true, id, slug };
      } catch (err) {
        console.error("create course failed:", err);
        return { ok: false, message: "Could not create the course, please try again." };
      }
    },
  );

const courseIdSchema = z.object({ id: z.string().trim().min(1) });

export const deleteCourse = createServerFn({ method: "POST" })
  .validator((input: unknown) => courseIdSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    await requireAdmin();
    try {
      await query("DELETE FROM course_feedbacks WHERE course_id = ?", [data.id]);
      await query("DELETE FROM courses WHERE id = ?", [data.id]);
      return { ok: true };
    } catch (err) {
      console.error("delete course failed:", err);
      return { ok: false, message: "Delete failed" };
    }
  });

const updateCourseSchema = courseInputSchema.extend({ id: z.string().trim().min(1) });

export const updateCourse = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateCourseSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    await requireAdmin();
    try {
      await query(
        `UPDATE courses
            SET title = ?, category = ?, cover_image_url = ?, original_price = ?, offer_price = ?,
                discount_percentage = ?, modules_count = ?, lessons_count = ?, duration_hours = ?,
                languages = ?, description = ?, is_published = ?
          WHERE id = ?`,
        [
          data.title,
          data.category,
          data.cover_image,
          data.original_price,
          data.offer_price,
          data.discount,
          data.modules,
          data.lessons,
          data.duration,
          data.languages,
          data.description,
          data.is_published ? 1 : 0,
          data.id,
        ],
      );
      return { ok: true };
    } catch (err) {
      console.error("update course failed:", err);
      return { ok: false, message: "Update failed" };
    }
  });
