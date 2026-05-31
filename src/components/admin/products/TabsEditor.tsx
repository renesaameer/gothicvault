import React, { useRef } from "react";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TabRow {
  id?: string;
  product_id?: string;
  title: string;
  content: string;
  display_style: "text" | "list" | "highlight";
  sort_order: number;
  _isNew?: boolean;
  _deleted?: boolean;
}

interface Props {
  tabs: TabRow[];
  onChange: (t: TabRow[]) => void;
}

const TabsEditor: React.FC<Props> = ({ tabs, onChange }) => {
  const listInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const addTab = () =>
    onChange([
      ...tabs,
      { title: "", content: "", display_style: "text", sort_order: tabs.length, _isNew: true },
    ]);

  const updateTab = (
    index: number,
    field: "title" | "content" | "display_style",
    value: string
  ) => onChange(tabs.map((t, i) => (i === index ? { ...t, [field]: value } : t)));

  const deleteTab = (index: number) => {
    const tab = tabs[index];
    if (tab._isNew) onChange(tabs.filter((_, i) => i !== index));
    else onChange(tabs.map((t, i) => (i === index ? { ...t, _deleted: true } : t)));
  };

  const visibleTabs = tabs.filter((t) => !t._deleted);

  return (
    <div className="bg-background rounded-2xl border border-border/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Product Tabs
          </h3>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">
            Description, Features, Specs, etc.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addTab} className="rounded-xl text-[11px] h-8 px-3">
          <Plus size={13} className="mr-1" /> Add tab
        </Button>
      </div>

      {visibleTabs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground/40 text-[12px]">No tabs yet</div>
      )}

      {visibleTabs.map((tab) => {
        const realIndex = tabs.indexOf(tab);
        const style = tab.display_style || "text";
        const isListType = style === "list" || style === "highlight";
        const lines = isListType ? (tab.content || "").split(/\n/) : [];

        return (
          <div key={realIndex} className="border border-border/30 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-muted/15 border-b border-border/20">
              <GripVertical size={12} className="text-muted-foreground/20 flex-shrink-0" />
              <Input
                value={tab.title}
                onChange={(e) => updateTab(realIndex, "title", e.target.value)}
                placeholder="Tab title"
                className="flex-1 font-medium h-8 text-[13px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
              />
              <Select value={style} onValueChange={(v) => updateTab(realIndex, "display_style", v)}>
                <SelectTrigger className="w-[130px] h-7 text-[11px] border-border/30 bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="list">Simple list</SelectItem>
                  <SelectItem value="highlight">Highlight list</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={() => deleteTab(realIndex)} className="text-muted-foreground/30 hover:text-destructive h-7 w-7 p-0">
                <Trash2 size={12} />
              </Button>
            </div>

            <div className="p-3.5">
              {style === "text" ? (
                <Textarea
                  value={tab.content}
                  onChange={(e) => updateTab(realIndex, "content", e.target.value)}
                  placeholder="Write your content..."
                  rows={4}
                  className="resize-none text-[13px]"
                />
              ) : (
                <div className="space-y-1">
                  {lines.map((line, li) => (
                    <div key={li} className="flex items-center gap-1.5 group">
                      <span className="text-[10px] text-muted-foreground/20 w-3.5 text-right tabular-nums select-none">
                        {li + 1}
                      </span>
                      <div
                        className={cn(
                          "flex-1 flex items-center rounded-lg",
                          style === "highlight" ? "border-l-2 border-primary/20 pl-2" : ""
                        )}
                      >
                        {style === "list" && (
                          <span className="w-[3px] h-[3px] rounded-full bg-primary/30 mr-2 flex-shrink-0" />
                        )}
                        <Input
                          ref={(el) => {
                            const key = `${realIndex}-${li}`;
                            if (el) listInputRefs.current.set(key, el);
                            else listInputRefs.current.delete(key);
                          }}
                          value={line}
                          onChange={(e) => {
                            const newLines = [...lines];
                            newLines[li] = e.target.value;
                            updateTab(realIndex, "content", newLines.join("\n"));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const newLines = [...lines];
                              newLines.splice(li + 1, 0, "");
                              updateTab(realIndex, "content", newLines.join("\n"));
                              setTimeout(() => {
                                listInputRefs.current
                                  .get(`${realIndex}-${li + 1}`)
                                  ?.focus();
                              }, 0);
                            }
                            if (e.key === "Backspace" && line === "" && lines.length > 1) {
                              e.preventDefault();
                              const newLines = lines.filter((_, i) => i !== li);
                              updateTab(realIndex, "content", newLines.join("\n"));
                              setTimeout(() => {
                                const prevIdx = Math.max(0, li - 1);
                                listInputRefs.current
                                  .get(`${realIndex}-${prevIdx}`)
                                  ?.focus();
                              }, 0);
                            }
                          }}
                          className="flex-1 h-8 text-[12px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
                          placeholder="Type here..."
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newLines = lines.filter((_, i) => i !== li);
                          updateTab(realIndex, "content", newLines.length > 0 ? newLines.join("\n") : "");
                        }}
                        className="text-muted-foreground/15 hover:text-destructive/60 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TabsEditor;