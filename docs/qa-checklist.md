# PermitPilot — QA Checklist

Run this before any demo or user test session. Check every box — do not spot-check.

---

## Case Management

- [ ] Create a new case — all fields save, page redirects to case detail
- [ ] Case reference code (`#XXXXXX`) visible in page header and in the cases list
- [ ] Edit case — all fields update, page redirects back to case detail
- [ ] Case notes — save and persist across page reload

---

## Documents

- [ ] Document checklist loads correctly for the selected jurisdiction
- [ ] Required vs. optional docs are clearly distinguished
- [ ] Progress bar reflects actual received/required count
- [ ] **Request All Missing** button appears when there are outstanding required docs
- [ ] **Request All Missing** fires and shows confirmation (or SMS sent)
- [ ] Individual **Request** on a single doc — row updates to "Requested" state
- [ ] **Re-send** on a requested doc — works without error
- [ ] **Office Upload** on a doc — doc shows as Received immediately after upload
- [ ] Homeowner upload link opens in incognito (no Clerk session) **without error or redirect**
- [ ] Homeowner completes upload — doc shows as Received in the office view
- [ ] "All required documents received" confirmation appears when checklist is complete

---

## Status Workflow

- [ ] Advancing to **Docs Complete** while docs are missing → amber warning appears
- [ ] Advancing to **Submitted** → permit number field is visible; number saves and shows in quick-stats strip
- [ ] Logging a correction while status is **Submitted** → status auto-advances to Corrections Required
- [ ] Resolving all corrections → green "All corrections resolved" prompt appears with link back to case
- [ ] **Resubmitted** transition is available from Corrections Required
- [ ] **Approved** transition is available from Resubmitted (and Submitted)
- [ ] **Ready to Start** transition shows confirmation warning before advancing
- [ ] **On Hold** → hold reason field is required; submit disabled until reason is entered
- [ ] **On Hold** hint shows the prior status by name (e.g. "Restore to Docs Complete")
- [ ] Restore from On Hold → case returns to correct prior status

---

## Search and Filter

- [ ] Search by **address** returns correct results
- [ ] Search by **homeowner name** returns correct results
- [ ] Search by **city** returns correct results
- [ ] Filter by **status** returns correct results
- [ ] Combined search + filter works
- [ ] "No matching cases" empty state appears when filters return zero results
- [ ] Clearing filters restores the full case list

---

## Dashboard

- [ ] Active permits count is accurate
- [ ] **Needs Attention** shows stale cases (5+ days, ball in our court)
- [ ] SUBMITTED / RESUBMITTED / READY_TO_START cases do **not** appear in Needs Attention when stale
- [ ] Recently Approved shows only **Approved** cases (not Ready to Start)

---

## Settings

- [ ] Company name edits and saves — success message appears
- [ ] Display name edits and saves — success message appears
- [ ] Supported jurisdictions list is visible

---

## Auth and Access

- [ ] Signing out redirects to `/sign-in`
- [ ] Accessing a protected route while signed out redirects to `/sign-in`
- [ ] Homeowner upload page (`/upload/[token]`) is accessible without a Clerk session
- [ ] Expired or invalid upload token shows a clear error (not a crash)

---

## Before Every Demo Specifically

- [ ] All demo cases are staged (see `docs/demo-data.md`)
- [ ] Case 5 (Corrections Required) has one open + one resolved correction
- [ ] Case 7 (On Hold) is in hold status with reason filled in
- [ ] Dashboard shows at least one case in Needs Attention
- [ ] Homeowner upload link for a demo doc is ready in an incognito tab
- [ ] No console errors on dashboard or case detail page
