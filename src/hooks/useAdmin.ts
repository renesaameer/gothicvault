import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getAdminRole, type AdminRole } from "@/lib/admin-role";

// Cache role per user to avoid repeated DB queries
const roleCache = new Map<string, AdminRole>();

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (userId: string): Promise<AdminRole> => {
      const cached = roleCache.get(userId);
      if (cached !== undefined) return cached;

      const r = await getAdminRole(userId);
      roleCache.set(userId, r);
      return r;
    };

    const handleUser = async (u: User | null) => {
      if (!mounted) return;
      setUser(u);
      if (u) {
        const r = await fetchRole(u.id);
        if (mounted) setRole(r);
      } else {
        setRole(null);
      }
      if (mounted) setLoading(false);
    };

    let lastUserId: string | null | undefined = undefined;
    const dispatch = (u: User | null) => {
      const id = u?.id ?? null;
      if (id === lastUserId) return; // dedupe duplicate INITIAL_SESSION + getSession
      lastUserId = id;
      handleUser(u);
    };

    // Set up listener FIRST — it fires immediately with current session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        roleCache.clear();
        lastUserId = undefined;
      }
      if (!initializedRef.current) return;
      dispatch(session?.user ?? null);
    });

    // Then do initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      initializedRef.current = true;
      dispatch(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, role, loading, isAdmin: role === "admin", isStaff: role === "staff" };
}
