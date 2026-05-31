import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "staff" | null;

export async function getAdminRole(userId: string): Promise<AdminRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "staff"]);

  if (error) {
    throw error;
  }

  if (data?.some(({ role }) => role === "admin")) return "admin";
  if (data?.some(({ role }) => role === "staff")) return "staff";
  return null;
}