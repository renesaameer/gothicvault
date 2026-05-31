import { supabase } from "@/integrations/supabase/client";

export type EcomDriveAction =
  | "test_connection"
  | "sync_delivery_methods"
  | "push_order"
  | "bulk_push"
  | "sync_tracking"
  | "bulk_sync_tracking"
  | "retry_failed"
  | "location";

export async function callEcomDrive(action: EcomDriveAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("ecomdrive-proxy", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}
