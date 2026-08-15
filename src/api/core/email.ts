import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "kamaleshk085@gmail.com";
const FROM_EMAIL = process.env.SMTP_USER || NOTIFICATION_EMAIL;

export interface EnquiryEmailData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface FeedbackEmailData {
  courseName: string;
  studentName: string;
  feedback: string;
}

export async function sendEnquiryEmail(data: EnquiryEmailData): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[email] SMTP not configured, skipping enquiry email");
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Sky APX Website" <${FROM_EMAIL}>`,
      to: NOTIFICATION_EMAIL,
      replyTo: data.email,
      subject: `[Sky APX] New Enquiry: ${data.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px">New Enquiry Received</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;width:120px">Name</td><td style="padding:8px">${data.name}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${data.phone}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Subject</td><td style="padding:8px">${data.subject}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Message</td><td style="padding:8px">${data.message}</td></tr>
          </table>
          <p style="margin-top:16px;color:#64748b;font-size:12px">Log in to <a href="http://127.0.0.1:3000/admin-login">admin dashboard</a> to manage this enquiry.</p>
        </div>
      `,
    });
    console.log(`[email] Enquiry notification sent to ${NOTIFICATION_EMAIL}`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send enquiry email:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendFeedbackEmail(data: FeedbackEmailData): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[email] SMTP not configured, skipping feedback email");
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Sky APX Website" <${FROM_EMAIL}>`,
      to: NOTIFICATION_EMAIL,
      subject: `[Sky APX] New Feedback on "${data.courseName}"`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px">New Course Feedback</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;width:120px">Course</td><td style="padding:8px">${data.courseName}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Student</td><td style="padding:8px">${data.studentName}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Feedback</td><td style="padding:8px">${data.feedback}</td></tr>
          </table>
        </div>
      `,
    });
    console.log(`[email] Feedback notification sent to ${NOTIFICATION_EMAIL}`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send feedback email:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendContactReplyEmail(to: string, name: string): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Sky APX Medical Academy" <${FROM_EMAIL}>`,
      to,
      subject: "Thank you for contacting Sky APX!",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb">Hi ${name},</h2>
          <p>Thank you for reaching out to Sky APX Medical Coding Academy!</p>
          <p>We have received your enquiry and our team will get back to you within 24 hours.</p>
          <p>In the meantime, feel free to explore our <a href="http://127.0.0.1:3000/#courses">courses</a>.</p>
          <br/>
          <p>Best regards,<br/><strong>Sky APX Team</strong></p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send reply email:", err instanceof Error ? err.message : err);
    return false;
  }
}
