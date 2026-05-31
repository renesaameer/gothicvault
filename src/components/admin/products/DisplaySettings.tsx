import React from "react";
import { Switch } from "@/components/ui/switch";

interface Props {
  showShippingInfo: boolean;
  showStockStatus: boolean;
  showOffers: boolean;
  onChange: (patch: Partial<{ showShippingInfo: boolean; showStockStatus: boolean; showOffers: boolean }>) => void;
}

const DisplaySettings: React.FC<Props> = ({ showShippingInfo, showStockStatus, showOffers, onChange }) => {
  return (
    <div className="bg-background rounded-2xl border border-border/30 p-5 space-y-4">
      <div>
        <h3 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
          Display options
        </h3>
        <p className="text-[11px] text-muted-foreground/40 mt-0.5">
          Toggle what shows on the product details page.
        </p>
      </div>

      <Row
        label="Show shipping info"
        hint="Display the shipping/delivery line on this product."
        checked={showShippingInfo}
        onChange={(v) => onChange({ showShippingInfo: v })}
      />
      <Row
        label="Show stock status"
        hint="Display in-stock / low-stock messaging."
        checked={showStockStatus}
        onChange={(v) => onChange({ showStockStatus: v })}
      />
      <Row
        label="Show offers"
        hint="Display attached offers and Buy-X-Get-Y badges."
        checked={showOffers}
        onChange={(v) => onChange({ showOffers: v })}
      />
    </div>
  );
};

const Row: React.FC<{ label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  hint,
  checked,
  onChange,
}) => (
  <div className="flex items-start justify-between gap-4 py-2 border-t border-border/15 first:border-t-0">
    <div className="min-w-0">
      <p className="text-[13px] text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground/40 mt-0.5">{hint}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default DisplaySettings;