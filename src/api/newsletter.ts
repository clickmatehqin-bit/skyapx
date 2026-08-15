import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query } from "./core/db";
import { generateId } from "./core/auth";

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(200),
});

/**
 * Public: subscribe a visitor to the newsletter. Duplicate emails are ignored
 * (INSERT IGNORE), so repeated clicks never error.
 */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((input: unknown) => subscribeSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message?: string }> => {
    try {
      const id = generateId();
      await query(
        `INSERT IGNORE INTO newsletter_subscribers (id, email) VALUES (?, ?)`,
        [id, data.email],
      );
      return { ok: true };
    } catch (err) {
      console.error("newsletter subscribe failed:", err);
      return { ok: false, message: "Could not subscribe, please try again later." };
    }
  });
