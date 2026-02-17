import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const emailFrom = process.env.EMAIL_FROM || "Gundamaxing <noreply@gundamaxing.com>";
