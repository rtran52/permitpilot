import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaseStatusBadge } from "./CaseStatusBadge";
import type { CaseStatus } from "@prisma/client";
import { ChevronRight } from "lucide-react";

type CaseRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  homeownerName: string;
  status: CaseStatus;
  updatedAt: Date;
  jurisdiction: { name: string; state: string };
  corrections: { id: string }[];
};

// Short action-oriented hint for each status — tells the office manager
// what the next move is without opening the case.
const NEXT_STEP: Record<CaseStatus, string> = {
  NEW: "Request documents",
  DOCS_REQUESTED: "Awaiting homeowner",
  DOCS_COMPLETE: "Ready to submit",
  SUBMITTED: "Awaiting permit office",
  CORRECTIONS_REQUIRED: "Address corrections",
  RESUBMITTED: "Awaiting permit office",
  APPROVED: "Mark ready to start",
  READY_TO_START: "—",
  ON_HOLD: "Unblock case",
};

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function CaseTable({ cases }: { cases: CaseRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
            <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-5 w-[36%]">
              Address
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-5">
              Homeowner
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-5">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-5 text-right">
              Age
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3 px-5">
              Next Step
            </TableHead>
            <TableHead className="py-3 px-3 w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => {
            const days = daysSince(c.updatedAt);
            const isUrgent =
              c.status === "CORRECTIONS_REQUIRED" ||
              (c.corrections.length > 0 && c.status !== "READY_TO_START");

            return (
              <TableRow
                key={c.id}
                className={`border-b border-gray-100 last:border-0 transition-colors ${
                  isUrgent
                    ? "bg-red-50/40 hover:bg-red-50/60"
                    : "hover:bg-gray-50/70"
                }`}
              >
                <TableCell className="py-3.5 px-5">
                  <Link
                    href={`/cases/${c.id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {c.address}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.city}, {c.state}
                  </p>
                </TableCell>
                <TableCell className="py-3.5 px-5 text-sm text-gray-600">
                  {c.homeownerName}
                </TableCell>
                <TableCell className="py-3.5 px-5">
                  <CaseStatusBadge status={c.status} />
                </TableCell>
                <TableCell className="py-3.5 px-5 text-right">
                  <DaysInStatus days={days} />
                </TableCell>
                <TableCell className="py-3.5 px-5">
                  <NextStepHint
                    status={c.status}
                    hasOpenCorrections={c.corrections.length > 0}
                  />
                </TableCell>
                <TableCell className="py-3.5 px-3 text-right">
                  <Link
                    href={`/cases/${c.id}`}
                    className="text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 inline-block" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DaysInStatus({ days }: { days: number }) {
  if (days >= 7) {
    return (
      <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block shrink-0" />
        {days}d
      </span>
    );
  }
  if (days >= 3) {
    return (
      <span className="text-xs font-medium text-amber-600">{days}d</span>
    );
  }
  return <span className="text-xs text-gray-400">{days}d</span>;
}

function NextStepHint({
  status,
  hasOpenCorrections,
}: {
  status: CaseStatus;
  hasOpenCorrections: boolean;
}) {
  const isUrgent =
    status === "CORRECTIONS_REQUIRED" ||
    (hasOpenCorrections && status !== "READY_TO_START");

  const label = isUrgent ? "Address corrections" : NEXT_STEP[status];

  if (label === "—") {
    return <span className="text-xs text-gray-300">—</span>;
  }

  return (
    <span
      className={`text-xs ${
        isUrgent ? "text-red-600 font-semibold" : "text-gray-500"
      }`}
    >
      {label}
    </span>
  );
}
