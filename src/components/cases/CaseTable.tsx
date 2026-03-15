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

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function CaseTable({ cases }: { cases: CaseRow[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-medium text-gray-500">Address</TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Homeowner</TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Jurisdiction</TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Days in Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => (
            <TableRow key={c.id} className="hover:bg-gray-50">
              <TableCell>
                <Link
                  href={`/cases/${c.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {c.address}
                </Link>
                <p className="text-xs text-gray-400">
                  {c.city}, {c.state}
                </p>
              </TableCell>
              <TableCell className="text-sm text-gray-700">
                {c.homeownerName}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {c.jurisdiction.name}
              </TableCell>
              <TableCell>
                <CaseStatusBadge status={c.status} />
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                <DaysInStatus days={daysSince(c.updatedAt)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DaysInStatus({ days }: { days: number }) {
  if (days >= 7) {
    return <span className="text-red-600 font-medium">{days}d</span>;
  }
  if (days >= 3) {
    return <span className="text-yellow-600">{days}d</span>;
  }
  return <span>{days}d</span>;
}
