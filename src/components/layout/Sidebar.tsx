"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderOpen, Archive, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

// isActive rules:
// /cases      → active for /cases and /cases/* but NOT /cases/archived/*
// /cases/archived → active only for /cases/archived and /cases/archived/*
// others      → startsWith match
function isActive(pathname: string, href: string): boolean {
  if (href === "/cases") {
    return (
      pathname === "/cases" ||
      (pathname.startsWith("/cases/") && !pathname.startsWith("/cases/archived"))
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-slate-950 flex flex-col shrink-0 border-r border-slate-900">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold leading-none">P</span>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            PermitPilot
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-5 pb-4">
        <p className="px-3 mb-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        <div className="space-y-0.5">
          {[
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/cases", label: "Cases", icon: FolderOpen },
            { href: "/cases/archived", label: "Archived", icon: Archive },
            { href: "/settings", label: "Settings", icon: Settings },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive(pathname, href)
                  ? "bg-slate-800 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom — user account only */}
      <div className="px-4 py-4 border-t border-slate-800">
        <UserButton />
      </div>
    </aside>
  );
}
