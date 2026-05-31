import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Download, Eye, Trash2, Users } from "lucide-react";
import { PageHeader, DataList, EmptyState, Section } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";

const InquiriesManager = () => {
  const [tab, setTab] = useState<"inquiries" | "subscribers">("inquiries");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    const [subRes, nlRes] = await Promise.all([
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
    ]);
    setSubmissions(subRes.data ?? []);
    setSubscribers(nlRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id: string) => {
    await supabase.from("contact_submissions").update({ read: true }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, read: true } : s));
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    await supabase.from("contact_submissions").delete().eq("id", id);
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Deleted" });
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Removed" });
  };

  const exportCSV = (data: any[], filename: string, columns: string[]) => {
    const header = columns.join(",");
    const rows = data.map((row) => columns.map((col) => `"${String(row[col] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${data.length} records` });
  };

  const unreadCount = submissions.filter((s) => !s.read).length;

  return (
    <div>
      <PageHeader
        title="Inquiries & Emails"
        subtitle={`${unreadCount} unread · ${subscribers.length} subscribers`}
      />

      <div className="flex items-center gap-1.5 mb-4 p-1 bg-muted/40 rounded-xl w-fit">
        <button
          onClick={() => setTab("inquiries")}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-medium transition ${
            tab === "inquiries" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail size={13} /> Inquiries
          {unreadCount > 0 && <Badge variant="destructive" className="text-[9px] px-1 py-0 ml-0.5">{unreadCount}</Badge>}
        </button>
        <button
          onClick={() => setTab("subscribers")}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-medium transition ${
            tab === "subscribers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={13} /> Subscribers
          <span className="text-[10px] text-muted-foreground/70 ml-0.5">{subscribers.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : tab === "inquiries" ? (
        <>
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => exportCSV(submissions, "inquiries", ["name", "email", "phone", "message", "created_at"])}>
              <Download size={12} /> Export CSV
            </Button>
          </div>
          {submissions.length === 0 ? (
            <Section><EmptyState icon={<Mail size={18} />} title="No inquiries yet" description="Customer messages from the contact form will appear here." /></Section>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <div key={s.id} className={`bg-background rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${s.read ? "border-border/60" : "border-primary/40 bg-primary/5"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-medium text-foreground">{s.name}</span>
                        {!s.read && <Badge variant="default" className="text-[9px] px-1 py-0">New</Badge>}
                      </div>
                      <p className="text-[12px] text-muted-foreground">{s.email}{s.phone ? ` · ${s.phone}` : ""}</p>
                      <p className="text-[13px] text-foreground mt-1.5 whitespace-pre-wrap">{s.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!s.read && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead(s.id)} title="Mark read">
                          <Eye size={14} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSubmission(s.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => exportCSV(subscribers, "subscribers", ["email", "created_at"])}>
              <Download size={12} /> Export CSV
            </Button>
          </div>
          <DataList
            rows={subscribers}
            rowKey={(s: any) => s.id}
            empty={<EmptyState icon={<Users size={18} />} title="No subscribers yet" description="Newsletter signups will appear here." />}
            columns={[
              { key: "email", label: "Email", render: (s: any) => <span className="text-foreground">{s.email}</span> },
              { key: "date", label: "Subscribed", render: (s: any) => <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span> },
              { key: "actions", label: "", align: "right", render: (s: any) => (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSubscriber(s.id)}><Trash2 size={12} /></Button>
              ) },
            ]}
            mobileCard={(s: any) => (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] text-foreground truncate">{s.email}</p>
                  <p className="text-[11px] text-muted-foreground/70">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => deleteSubscriber(s.id)}><Trash2 size={13} /></Button>
              </div>
            )}
          />
        </>
      )}
    </div>
  );
};

export default InquiriesManager;
