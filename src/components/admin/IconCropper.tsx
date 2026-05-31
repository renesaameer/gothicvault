import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
}

const OUTPUT_SIZE = 128; // 2x retina at 64px display

const getCroppedBlob = async (src: string, area: Area): Promise<Blob> => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob failed"))), "image/png", 0.95));
};

const IconCropper = ({ open, imageSrc, onCancel, onCrop }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const handleSave = async () => {
    if (!imageSrc || !area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, area);
      onCrop(blob);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setCrop({ x: 0, y: 0 }); setZoom(1); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Crop icon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-black/40 rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onComplete}
              />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Zoom</span>
              <button type="button" onClick={reset} className="text-[11px] text-muted-foreground hover:text-foreground">Reset</button>
            </div>
            <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <p className="text-[11px] text-muted-foreground/60">Drag to position. Output is 128×128 PNG.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={busy || !area}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IconCropper;
