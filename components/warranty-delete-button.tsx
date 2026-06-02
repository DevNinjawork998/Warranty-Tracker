"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function WarrantyDeleteButton({ warrantyId }: { warrantyId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/warranties/${warrantyId}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-sm font-medium text-red-700 text-center">Delete this warranty record?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white rounded-2xl py-4 font-semibold text-sm hover:bg-red-700 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Delete Warranty Record
    </button>
  );
}
