"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Scan, Lock } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { BottomNav } from "@/components/bottom-nav";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("receipt", file);

    const res = await fetch("/api/ocr", { method: "POST", body: formData });
    if (!res.ok) {
      setError("Failed to process receipt. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json();

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
      });
      data.receipt_preview = dataUrl;
    } catch {
      // Preview generation failed — proceed without it
    }

    try {
      sessionStorage.setItem("ocr_result", JSON.stringify(data));
    } catch {
      delete data.receipt_preview;
      sessionStorage.setItem("ocr_result", JSON.stringify(data));
    }

    router.push("/upload/review");
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold select-none">
          U
        </div>
        <h1 className="font-semibold text-lg flex-1">Upload Receipt</h1>
        <NotificationBell />
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 space-y-6">

        {/* Drop zone */}
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-card pt-20 pb-16 flex flex-col items-center gap-10 hover:bg-primary/5 transition-colors"
          >
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <Scan className="w-9 h-9 text-foreground" />
            </div>
            <div className="space-y-2 text-center">
              <p className="font-bold text-xl leading-tight">Take photo or choose<br />file</p>
              <p className="text-sm text-muted-foreground">JPEG, PNG, WEBP, or PDF up to 10MB</p>
            </div>
          </button>
        ) : file.type === "application/pdf" ? (
          <div className="space-y-3">
            <iframe
              src={preview!}
              className="w-full rounded-2xl border bg-muted"
              style={{ height: "480px" }}
              title="Receipt preview"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Change file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full rounded-2xl overflow-hidden border aspect-[3/4]">
              <Image src={preview!} alt="Receipt preview" fill className="object-contain bg-muted" />
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Change image
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <button
          type="button"
          disabled={!file || loading}
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-4 text-sm font-semibold disabled:opacity-50 transition-opacity"
        >
          {loading ? "Extracting details…" : "Extract warranty details"}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
          <span>Securely encrypted and processed locally.</span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
