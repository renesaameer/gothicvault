import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Crop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageCropper, { type CropAspect } from "./ImageCropper";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
  hint?: string;
  /**
   * When set, every uploaded image MUST be cropped to this aspect before save.
   * Existing images can be re-cropped via a "Re-crop" button.
   */
  cropAspect?: CropAspect;
}

const ImageUpload = ({ value, onChange, multiple = true, label = "Images", hint, cropAspect }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Crop queue: when cropAspect is set we crop one file at a time.
  const [cropQueue, setCropQueue] = useState<string[]>([]); // object URLs awaiting crop
  const [recropIndex, setRecropIndex] = useState<number | null>(null); // re-crop existing image
  const [recropSrc, setRecropSrc] = useState<string | null>(null);

  const uploadBlob = async (blob: Blob, ext: string): Promise<string> => {
    const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(fileName, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const describeError = (err: any): string => {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    const msg = err.message || err.error || err.statusText || "";
    const code = err.statusCode || err.status || err.code;
    if (code === 401 || code === 403 || /unauthor|jwt|policy/i.test(msg))
      return "Permission denied — please sign in to the admin panel and try again.";
    if (/payload|too large|413/i.test(msg))
      return "File too large. Try a smaller image (under 5 MB).";
    if (code === 404 || /bucket/i.test(msg))
      return "Storage bucket missing. Contact support.";
    return msg || `Upload failed (${code ?? "unknown"})`;
  };

  const bulkUploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(fileName, file, {
          contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: false,
          cacheControl: "3600",
        });
        if (error) {
          console.error("[ImageUpload] storage error", error);
          throw error;
        }
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
      onChange(multiple ? [...value, ...newUrls] : newUrls.slice(0, 1));
      toast({ title: `${newUrls.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: describeError(err), variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      if (bulkInputRef.current) bulkInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Crop-required path: queue object URLs and let the cropper handle uploads one-by-one.
    if (cropAspect) {
      const urls = Array.from(files).map((f) => URL.createObjectURL(f));
      setCropQueue(urls);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    await bulkUploadFiles(Array.from(files));
  };

  const handleBulkSkipCrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await bulkUploadFiles(Array.from(files));
  };

  const handleCropComplete = async (blob: Blob) => {
    setUploading(true);
    try {
      // Re-crop of an existing image
      if (recropIndex != null) {
        const url = await uploadBlob(blob, "jpg");
        const next = [...value];
        next[recropIndex] = url;
        onChange(next);
        toast({ title: "Image re-cropped" });
        setRecropIndex(null);
        setRecropSrc(null);
        return;
      }
      // Queued upload crop
      const url = await uploadBlob(blob, "jpg");
      const remaining = cropQueue.slice(1);
      // Revoke processed object URL
      try { URL.revokeObjectURL(cropQueue[0]); } catch {}
      onChange(multiple ? [...value, url] : [url]);
      setCropQueue(remaining);
      if (remaining.length === 0) toast({ title: "Image uploaded" });
    } catch (err: any) {
      console.error("[ImageUpload] crop upload error", err);
      toast({ title: "Upload failed", description: describeError(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const cancelCrop = () => {
    if (recropIndex != null) {
      setRecropIndex(null);
      setRecropSrc(null);
      return;
    }
    // Skip current queued image (do not save it). Move to next.
    if (cropQueue.length > 0) {
      try { URL.revokeObjectURL(cropQueue[0]); } catch {}
      setCropQueue(cropQueue.slice(1));
    }
  };

  const startRecrop = async (i: number) => {
    if (!cropAspect) return;
    try {
      // Fetch existing image into a blob URL so the cropper can read pixels.
      const res = await fetch(value[i], { mode: "cors" });
      const blob = await res.blob();
      setRecropSrc(URL.createObjectURL(blob));
      setRecropIndex(i);
    } catch {
      toast({ title: "Cannot load image for cropping", variant: "destructive" });
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const cropperOpen = (cropQueue.length > 0 || recropIndex != null) && !!cropAspect;
  const cropperSrc = recropIndex != null ? recropSrc : cropQueue[0] || null;

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {value.map((url, i) => (
            <div
              key={i}
              className={`relative group rounded-lg overflow-hidden border border-border ${
                cropAspect === "4:5" ? "w-16 h-20" : cropAspect === "16:9" ? "w-28 h-[63px]" : "w-20 h-20"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {cropAspect && (
                  <button
                    type="button"
                    onClick={() => startRecrop(i)}
                    className="w-6 h-6 bg-background/90 text-foreground rounded-full flex items-center justify-center hover:bg-background"
                    title="Re-crop"
                  >
                    <Crop size={11} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                  title="Remove"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleUpload}
        className="hidden"
      />
      <input
        ref={bulkInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleBulkSkipCrop}
        className="hidden"
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
          {uploading ? "Uploading..." : cropAspect ? "Upload & crop" : "Upload image"}
        </Button>
        {cropAspect && multiple && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => bulkInputRef.current?.click()}
            title="Upload many images at once without cropping"
          >
            <Upload size={14} className="mr-1" />
            Bulk Upload (skip crop)
          </Button>
        )}
        {cropQueue.length > 0 && (
          <span className="text-xs text-muted-foreground">{cropQueue.length} image(s) waiting to crop…</span>
        )}
      </div>

      {cropAspect && (
        <ImageCropper
          open={cropperOpen}
          aspect={cropAspect}
          imageSrc={cropperSrc}
          onCancel={cancelCrop}
          onCrop={handleCropComplete}
        />
      )}
    </div>
  );
};

export default ImageUpload;
