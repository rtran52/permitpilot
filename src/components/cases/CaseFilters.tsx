"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CaseStatus } from "@/lib/case-status";

const STATUS_FILTER_OPTIONS: { label: string; value: CaseStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: CaseStatus.NEW },
  { label: "Docs Requested", value: CaseStatus.DOCS_REQUESTED },
  { label: "Docs Complete", value: CaseStatus.DOCS_COMPLETE },
  { label: "Submitted", value: CaseStatus.SUBMITTED },
  { label: "Corrections", value: CaseStatus.CORRECTIONS_REQUIRED },
  { label: "Resubmitted", value: CaseStatus.RESUBMITTED },
  { label: "Approved", value: CaseStatus.APPROVED },
  { label: "Ready to Start", value: CaseStatus.READY_TO_START },
  { label: "On Hold", value: CaseStatus.ON_HOLD },
];

export function CaseFilters({
  totalCount,
  filteredCount,
}: {
  totalCount: number;
  filteredCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentStatus = (searchParams.get("status") as CaseStatus | null) ?? "ALL";

  const [inputValue, setInputValue] = useState(currentQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync when URL changes externally
  useEffect(() => {
    setInputValue(currentQ);
  }, [currentQ]);

  const pushFilter = useCallback(
    (q: string, status: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "ALL") params.set("status", status);
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilter(val, currentStatus);
    }, 350);
  }

  function clearSearch() {
    setInputValue("");
    pushFilter("", currentStatus);
  }

  function handleStatusChange(value: CaseStatus | "ALL") {
    pushFilter(currentQ, value);
  }

  const isFiltered = !!currentQ || (currentStatus !== "ALL");

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="Search by address or homeowner…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder:text-gray-400"
        />
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const active =
            opt.value === "ALL"
              ? currentStatus === "ALL"
              : currentStatus === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value as CaseStatus | "ALL")}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {isFiltered && (
          <span className="text-xs text-gray-400 ml-1">
            {filteredCount} of {totalCount} case{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
