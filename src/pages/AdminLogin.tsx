import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BrandMark from "@/components/brand/BrandMark";
import { getAdminRole } from "@/lib/admin-role";


const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in with admin/staff role
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        try {
          const role = await getAdminRole(session.user.id);
          if (mounted && role) {
            navigate("/admin", { replace: true });
            return;
          }
        } catch {
          await supabase.auth.signOut();
        }
        if (mounted) setChecking(false);
        return;
      }
      if (mounted) setChecking(false);
    });
    return () => { mounted = false; };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const role = await getAdminRole(user.id);
      if (!role) {
        await supabase.auth.signOut();
        throw new Error("You don't have admin access.");
      }

      toast({ title: "Welcome back!" });
      navigate("/admin");
    } catch (err: any) {
      if (err?.message?.includes("permission denied for function has_role")) {
        toast({
          title: "Sign in failed",
          description: "Admin role verification is unavailable right now. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="mb-5"><BrandMark size="xl" /></div>
          <h1 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-foreground/55">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-3">Sign in to manage your store</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
