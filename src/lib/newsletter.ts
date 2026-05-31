import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Please enter a valid email address" })
  .max(255, { message: "Email is too long" });

export interface NewsletterResult {
  ok: boolean;
  email?: string;
  reason?: "invalid" | "network";
  message?: string;
}

/**
 * Subscribe an email to the newsletter.
 * The RPC uses ON CONFLICT DO NOTHING so duplicates are silently ignored —
 * we treat the operation as successful regardless. Only real errors (network,
 * RLS, validation) surface as failures.
 */
export async function subscribeToNewsletter(rawEmail: string): Promise<NewsletterResult> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return { ok: false, reason: "invalid", message: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const email = parsed.data;
  const { error } = await supabase.rpc("subscribe_newsletter", { _email: email });
  if (error) {
    return { ok: false, reason: "network", message: error.message || "Could not subscribe. Please try again." };
  }
  return { ok: true, email };
}
