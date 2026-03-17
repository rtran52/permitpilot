"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArchiveButtonProps {
  caseId: string;
  archived: boolean;
  /** If set, the router will push to this path after a successful archive (not unarchive). */
  redirectAfterArchive?: string;
}

export function ArchiveButton({
  caseId,
  archived,
  redirectAfterArchive = "/cases",
}: ArchiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });
      if (!res.ok) throw new Error("Request failed");

      if (!archived) {
        // Just archived — send them to the cases list
        router.push(redirectAfterArchive);
      } else {
        // Just unarchived — refresh in place so the banner clears
        router.refresh();
      }
    } catch {
      setLoading(false);
    }
  }

  if (archived) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className="h-7 text-xs gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ArchiveRestore className="w-3 h-3" />
        )}
        Unarchive
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className="h-7 text-xs gap-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Archive className="w-3 h-3" />
      )}
      Archive
    </Button>
  );
}
