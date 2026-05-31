import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, KeyRound, Shield } from "lucide-react";
import { PageHeader, Section, EmptyState, FormRow } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";

const UserRoles = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRoles = async () => {
    const { data } = await supabase.from("user_roles").select("*");
    setRoles(data ?? []);
    if (data && data.length > 0) {
      const userIds = data.map((r) => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const addUserWithRole = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    // First try to find existing user by email
    const { data: existingProf } = await supabase.from("profiles").select("user_id").eq("email", email.trim()).maybeSingle();

    if (existingProf) {
      // User exists, just assign role
      const { error } = await supabase.from("user_roles").insert({ user_id: existingProf.user_id, role });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Role assigned to existing user" });
        setEmail(""); setPassword(""); setFullName("");
        fetchRoles();
      }
      return;
    }

    // Create new user via signUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName || email.split("@")[0] } },
    });

    if (signUpError) {
      toast({ title: "Error creating user", description: signUpError.message, variant: "destructive" });
      return;
    }

    if (!signUpData.user) {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
      return;
    }

    // Assign role
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: signUpData.user.id, role });
    if (roleError) {
      toast({ title: "User created but role assignment failed", description: roleError.message, variant: "destructive" });
    } else {
      toast({ title: "User created & role assigned" });
    }
    setEmail(""); setPassword(""); setFullName("");
    fetchRoles();
  };

  const removeRole = async (id: string) => {
    if (!confirm("Remove this role?")) return;
    await supabase.from("user_roles").delete().eq("id", id);
    toast({ title: "Role removed" });
    fetchRoles();
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="User roles" subtitle="Add admins or staff to manage the storefront." />

      <Section title="Add user with role">
        <div className="space-y-3">
          <FormRow label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" className="h-10" />
          </FormRow>
          <FormRow label="Email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-10" />
          </FormRow>
          <FormRow label="Password" required hint="Minimum 6 characters">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
          </FormRow>
          <div className="flex gap-2 pt-1">
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "staff")}>
              <SelectTrigger className="w-[140px] h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-10 flex-1" onClick={addUserWithRole}><Plus size={14} className="mr-1.5" /> Add user</Button>
          </div>
        </div>
      </Section>

      {roles.length === 0 ? (
        <EmptyState icon={<Shield size={18} />} title="No team members yet" description="Add an admin or staff member to get started." />
      ) : (
        <div className="space-y-2">
          {roles.map((r) => (
            <div key={r.id} className="bg-background rounded-2xl border border-border/60 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{profiles[r.user_id]?.full_name || profiles[r.user_id]?.email || r.user_id}</p>
                  <p className="text-[11px] text-muted-foreground/70 truncate">{profiles[r.user_id]?.email} · <span className="capitalize">{r.role}</span></p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setChangingPassword(changingPassword === r.user_id ? null : r.user_id)} title="Change password">
                    <KeyRound size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeRole(r.id)} title="Remove">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              {changingPassword === r.user_id && (
                <p className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground/70">
                  Password changes require admin API access. For now, users can reset their password via the login page.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRoles;
