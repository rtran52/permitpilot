import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Building2, User, Bell, MapPin } from "lucide-react";
import {
  SettingsEditForm,
  type SettingsFormState,
} from "@/components/settings/SettingsEditForm";

// ── Server actions ────────────────────────────────────────────────────────────
// Both actions accept (prevState, formData) so they are compatible with
// React 19's useActionState in the SettingsEditForm client component.

async function updateCompanyName(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  "use server";
  const user = await requireUser();
  const name = (formData.get("companyName") as string)?.trim();
  if (!name) return { success: false, error: "Company name cannot be empty." };
  try {
    await prisma.company.update({
      where: { id: user.companyId },
      data: { name },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save. Please try again." };
  }
}

async function updateUserProfile(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  "use server";
  const user = await requireUser();
  const name = (formData.get("userName") as string)?.trim();
  if (!name) return { success: false, error: "Display name cannot be empty." };
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save. Please try again." };
  }
}

// ── Notification rules (static — hardcoded in MVP) ───────────────────────────

const NOTIFICATION_RULES = [
  {
    label: "Case stale — no activity for 5+ days",
    channels: ["Email"],
    description:
      "Alerts office staff when a permit case hasn't changed status in 5 days.",
  },
  {
    label: "Document received from homeowner",
    channels: ["Email"],
    description:
      "Triggered when a homeowner completes a magic-link document upload.",
  },
  {
    label: "Correction logged on a case",
    channels: ["Email"],
    description: "Sent when a new correction note is added to a permit case.",
  },
  {
    label: "Permit approved",
    channels: ["Email"],
    description: "Notifies the team when a case status advances to Approved.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SettingsPage() {
  const user = await requireUser();

  const [company, jurisdictions] = await Promise.all([
    prisma.company.findUnique({ where: { id: user.companyId } }),
    prisma.jurisdiction.findMany({
      include: { requirements: { select: { required: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const roleLabel = user.role === "OWNER" ? "Owner" : "Office Manager";
  const memberSince = user.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Account and workspace configuration
        </p>
      </div>

      {/* ── Workspace ── */}
      <SettingsCard
        icon={<Building2 className="w-3.5 h-3.5 text-blue-600" />}
        iconBg="bg-blue-50"
        title="Workspace"
        subtitle="Company name and contact info"
      >
        <div className="divide-y divide-gray-100">
          {/* Company name — editable via SettingsEditForm */}
          <SettingsEditForm
            action={updateCompanyName}
            fieldName="companyName"
            label="Company Name"
            defaultValue={company?.name ?? ""}
            placeholder="Your company name"
          />

        </div>
        <CardFootnote>
          Support phone and email will be configurable in a future update.
        </CardFootnote>
      </SettingsCard>

      {/* ── Your Account ── */}
      <SettingsCard
        icon={<User className="w-3.5 h-3.5 text-gray-500" />}
        iconBg="bg-gray-100"
        title="Your Account"
        subtitle="Profile and workspace role"
      >
        {/* Avatar + role — static display row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 select-none">
            <span className="text-sm font-bold text-blue-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border px-2.5 py-0.5 shrink-0 ${
              user.role === "OWNER"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                user.role === "OWNER" ? "bg-blue-400" : "bg-gray-400"
              }`}
            />
            {roleLabel}
          </span>
        </div>

        {/* Display name — editable */}
        <div className="divide-y divide-gray-100">
          <SettingsEditForm
            action={updateUserProfile}
            fieldName="userName"
            label="Display Name"
            defaultValue={user.name}
            placeholder="Your full name"
          />

          {/* Email — read-only, managed by Clerk */}
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Email Address
            </p>
            <p className="text-sm text-gray-700">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Managed via your sign-in account — change it there.
            </p>
          </div>
        </div>

        <CardFootnote>Member since {memberSince}</CardFootnote>
      </SettingsCard>

      {/* ── Notifications ── */}
      <SettingsCard
        icon={<Bell className="w-3.5 h-3.5 text-gray-500" />}
        iconBg="bg-gray-100"
        title="Notifications"
        subtitle="Automated alerts sent to your workspace"
      >
        <div className="divide-y divide-gray-100">
          {NOTIFICATION_RULES.map((rule) => (
            <div
              key={rule.label}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Enabled
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {rule.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {rule.description}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {rule.channels.map((ch) => (
                  <span
                    key={ch}
                    className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <CardFootnote>
          Notifications fire automatically for all Owner and Office Manager
          accounts. Per-user preferences are coming in a future update.
        </CardFootnote>
      </SettingsCard>

      {/* ── Supported Jurisdictions ── */}
      <SettingsCard
        icon={<MapPin className="w-3.5 h-3.5 text-gray-500" />}
        iconBg="bg-gray-100"
        title="Supported Jurisdictions"
        subtitle="Active coverage areas for permit document checklists"
      >
        <div className="divide-y divide-gray-100">
          {jurisdictions.map((j) => {
            const required = j.requirements.filter((r) => r.required).length;
            const optional = j.requirements.filter((r) => !r.required).length;
            return (
              <div key={j.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800">
                      {j.name}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                      {j.state}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      Roofing
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {required} required doc{required !== 1 ? "s" : ""}
                    {optional > 0 ? ` · ${optional} optional` : ""}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Active
                </span>
              </div>
            );
          })}
        </div>
        <CardFootnote>
          Need coverage in another county?{" "}
          <span className="font-medium text-gray-600">
            Contact us to request expansion.
          </span>
        </CardFootnote>
      </SettingsCard>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingsCard({
  icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-md ${iconBg} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-xs font-medium text-gray-500 w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 text-right">{children}</div>
    </div>
  );
}

function CardFootnote({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100">
      <p className="text-xs text-gray-400">{children}</p>
    </div>
  );
}
