import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminCustomers, adminKeys } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Save, Users } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { PageHeader, Section, Toolbar, DataList, EmptyState, FormRow } from "@/components/admin/ui";

const Customers = () => {
  const { data: customers = [], isLoading } = useAdminCustomers();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c: any) =>
      [c.name, c.email, c.phone].some((v: string | null) => v?.toLowerCase().includes(q)),
    );
  }, [customers, search]);

  const addCustomer = async () => {
    if (!form.name || !form.email) {
      toast({ title: "Name and email required", variant: "destructive" });
      return;
    }
    const tempId = crypto.randomUUID();
    const optimistic = {
      id: tempId, name: form.name, email: form.email, phone: form.phone || null,
      total_orders: 0, total_spent: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    qc.setQueryData(adminKeys.customers, (old: any[]) => [optimistic, ...(old ?? [])]);
    setForm({ name: "", email: "", phone: "" });
    setAdding(false);
    toast({ title: "Customer added" });

    const { error } = await supabase.from("customers").insert({
      name: form.name, email: form.email, phone: form.phone || null,
    });
    if (error) {
      qc.setQueryData(adminKeys.customers, (old: any[]) => old?.filter((c) => c.id !== tempId));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: adminKeys.customers });
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} total`}
        actions={
          <Button size="sm" onClick={() => setAdding((v) => !v)}>
            {adding ? <><X size={14} className="mr-1" /> Cancel</> : <><Plus size={14} className="mr-1" /> Add</>}
          </Button>
        }
      />

      {adding && (
        <Section title="New customer" className="mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormRow label="Full name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
            </FormRow>
            <FormRow label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
            </FormRow>
            <FormRow label="Phone" hint="Optional">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" inputMode="tel" />
            </FormRow>
          </div>
          <div className="mt-4">
            <Button size="sm" onClick={addCustomer}><Save size={14} className="mr-1" /> Save</Button>
          </div>
        </Section>
      )}

      <Toolbar search={{ value: search, onChange: setSearch, placeholder: "Search by name, email, or phone…" }} />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-background rounded-2xl border border-border/60 p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      ) : (
        <DataList
          rows={filtered}
          rowKey={(c: any) => c.id}
          empty={
            <EmptyState
              icon={<Users size={18} />}
              title={search ? "No matches" : "No customers yet"}
              description={search ? "Try a different search term." : "Customers appear here automatically when they place an order."}
            />
          }
          columns={[
            { key: "name", label: "Name", render: (c: any) => <span className="font-medium text-foreground">{c.name}</span> },
            { key: "email", label: "Email", render: (c: any) => <span className="text-muted-foreground">{c.email}</span> },
            { key: "phone", label: "Phone", render: (c: any) => <span className="text-muted-foreground">{c.phone || "—"}</span> },
            { key: "orders", label: "Orders", align: "right", render: (c: any) => <span className="tabular-nums">{c.total_orders}</span> },
            { key: "spent", label: "Lifetime", align: "right", render: (c: any) => <span className="tabular-nums font-medium">{CURRENCY_SYMBOL}{Number(c.total_spent).toFixed(0)}</span> },
          ]}
          mobileCard={(c: any) => (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-medium text-foreground truncate">{c.name}</span>
                <span className="text-[14px] font-semibold text-foreground tabular-nums shrink-0">{CURRENCY_SYMBOL}{Number(c.total_spent).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span className="truncate">{c.email}</span>
                <span className="tabular-nums shrink-0 ml-2">{c.total_orders} orders</span>
              </div>
              {c.phone && <p className="text-[11px] text-muted-foreground/70 mt-1">{c.phone}</p>}
            </div>
          )}
        />
      )}
    </div>
  );
};

export default Customers;
