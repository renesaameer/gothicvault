import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export type CropAspect = "4:5" | "16:9" | "1:1";

interface Props {
  open: boolean;
  imageSrc: string | null;
  aspect: CropAspect;
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
  /** Output longest-edge in px. Defaults match the recommended sizes per aspect. */
  outputMaxEdge?: number;
}

const ASPECT_RATIO: Record<CropAspect, number> = {
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "1:1": 1,
};

const DEFAULT_OUT: Record<CropAspect, { w: number; h: number }> = {
  "4:5": { w: 2000, h: 2500 },
  "16:9": { w: 1920, h: 1080 },
  "1:1": { w: 1600, h: 1600 },
};

const HINT: Record<CropAspect, string> = {
  "4:5": "Output 2000 × 2500 · 4:5 (portrait)",
  "16:9": "Output 1920 × 1080 · 16:9 (landscape)",
  "1:1": "Output 1600 × 1600 · 1:1 (square)",
};

const getCroppedBlob = async (src: string, area: Area, out: { w: number; h: number }): Promise<Blob> => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const canvas = document.createElement("canvas");
  canvas.width = out.w;
  canvas.height = out.h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, out.w, out.h);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob failed"))), "image/jpeg", 0.92)
  );
};

const ImageCropper = ({ open, imageSrc, aspect, onCancel, onCrop, outputMaxEdge }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const handleSave = async () => {
    if (!imageSrc || !area) return;
    setBusy(true);
    try {
      const out = outputMaxEdge
        ? aspect === "4:5"
          ? { w: outputMaxEdge, h: Math.round(outputMaxEdge * 1.25) }
          : aspect === "16:9"
          ? { w: outputMaxEdge, h: Math.round(outputMaxEdge * 9 / 16) }
          : { w: outputMaxEdge, h: outputMaxEdge }
        : DEFAULT_OUT[aspect];
      const blob = await getCroppedBlob(imageSrc, area, out);
      onCrop(blob);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setCrop({ x: 0, y: 0 }); setZoom(1); };

  // Frame height for the cropper canvas — keep it visually balanced per aspect
  const frameClass =
    aspect === "4:5" ? "aspect-[4/5] max-h-[60vh] mx-auto"
    : aspect === "16:9" ? "aspect-[16/9]"
    : "aspect-square max-h-[60vh] mx-auto";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Crop image · {aspect}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className={`relative w-full bg-black/50 rounded-xl overflow-hidden ${frameClass}`}>
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT_RATIO[aspect]}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onComplete}
                restrictPosition
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
          <p className="text-[11px] text-muted-foreground/60">{HINT[aspect]} · Drag to position.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={busy || !area}>{busy ? "Cropping…" : "Crop & Use"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;