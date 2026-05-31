import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface FaqRow {
  id?: string;
  product_id?: string;
  question: string;
  answer: string;
  sort_order: number;
  _isNew?: boolean;
  _deleted?: boolean;
}

interface Props {
  faqs: FaqRow[];
  onChange: (f: FaqRow[]) => void;
}

const FaqsEditor: React.FC<Props> = ({ faqs, onChange }) => {
  const add = () =>
    onChange([...faqs, { question: "", answer: "", sort_order: faqs.length, _isNew: true }]);
  const update = (idx: number, field: "question" | "answer", value: string) =>
    onChange(faqs.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  const remove = (idx: number) => {
    const f = faqs[idx];
    if (f._isNew) onChange(faqs.filter((_, i) => i !== idx));
    else onChange(faqs.map((x, i) => (i === idx ? { ...x, _deleted: true } : x)));
  };

  const visible = faqs.filter((f) => !f._deleted);

  return (
    <div className="bg-background rounded-2xl border border-border/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            FAQs
          </h3>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">Common questions about this product.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add} className="rounded-xl text-[11px] h-8 px-3">
          <Plus size={13} className="mr-1" /> Add FAQ
        </Button>
      </div>

      {visible.length === 0 && (
        <div className="text-center py-8 text-muted-foreground/40 text-[12px]">No FAQs yet</div>
      )}

      {visible.map((faq) => {
        const realIndex = faqs.indexOf(faq);
        return (
          <div key={realIndex} className="border border-border/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={faq.question}
                onChange={(e) => update(realIndex, "question", e.target.value)}
                placeholder="Question"
                className="flex-1 h-9 text-[13px] font-medium"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(realIndex)} className="text-muted-foreground/30 hover:text-destructive h-8 w-8 p-0">
                <Trash2 size={13} />
              </Button>
            </div>
            <Textarea
              value={faq.answer}
              onChange={(e) => update(realIndex, "answer", e.target.value)}
              placeholder="Answer"
              rows={3}
              className="resize-none text-[13px]"
            />
          </div>
        );
      })}
    </div>
  );
};

export default FaqsEditor;