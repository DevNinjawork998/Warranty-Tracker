"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URLs when they change or the component unmounts to free memory.
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
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
    sessionStorage.setItem("ocr_result", JSON.stringify(data));
    router.push("/upload/review");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <h1 className="font-semibold text-lg">Upload Receipt</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {!file ? (
          <Card
            className="border-dashed cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">📄</div>
              <p className="font-medium">Take photo or choose file</p>
              <p className="text-sm text-muted-foreground">JPEG, PNG, WEBP, or PDF</p>
            </CardContent>
          </Card>
        ) : file.type === "application/pdf" ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center w-full rounded-lg border bg-muted aspect-[3/4] gap-3">
              <div className="text-5xl">📄</div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
              Change file
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full rounded-lg overflow-hidden border aspect-[3/4]">
              <Image src={preview!} alt="Receipt preview" fill className="object-contain bg-muted" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
              Change image
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button
          className="w-full"
          disabled={!file || loading}
          onClick={handleSubmit}
        >
          {loading ? "Extracting details…" : "Extract warranty details"}
        </Button>
      </main>
    </div>
  );
}
