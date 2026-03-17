# PermitPilot — Demo Data Setup

**Goal:** 5–8 cases that together show every status in the pipeline and tell a coherent story.
Create these manually through the UI so they look real, or seed them directly via Prisma Studio.

---

## Recommended Case Set

### Case 1 — "The Fresh Open" (Status: New)
**Purpose:** Show case creation and the document request flow live during the demo.

| Field | Value |
|---|---|
| Address | 4821 Cypress Hill Dr, Tampa, FL 33624 |
| Homeowner | Maria Santos |
| Phone | (813) 555-0142 |
| Jurisdiction | Hillsborough County |
| Job # | RR-2024-0891 |
| Documents | 0 received (all missing) |
| Notes | — |

> Use this case to walk through creating a case and requesting docs live.

---

### Case 2 — "Waiting on Homeowner" (Status: New, docs partially received)
**Purpose:** Show a realistic in-progress doc collection state.

| Field | Value |
|---|---|
| Address | 1103 Bayside Terrace, Clearwater, FL 33755 |
| Homeowner | James & Karen Whitfield |
| Phone | (727) 555-0209 |
| Jurisdiction | Pinellas County |
| Job # | RR-2024-0876 |
| Documents | 3 of 7 required received; 2 requested (amber clock showing) |
| Notes | "Waiting on signed NOC — homeowner is out of town until next week." |

---

### Case 3 — "Ready to Submit" (Status: Docs Complete)
**Purpose:** Show what a case looks like when the office has everything and is ready to go.

| Field | Value |
|---|---|
| Address | 7750 Mango Ave, Sarasota, FL 34231 |
| Homeowner | David Okonkwo |
| Phone | (941) 555-0317 |
| Jurisdiction | Sarasota County |
| Job # | RR-2024-0854 |
| Documents | All 6 required received |
| Notes | "Packet ready. Submitting Thursday." |

---

### Case 4 — "At the Permit Office" (Status: Submitted)
**Purpose:** Show a case that's been submitted and is in the permit office's hands.

| Field | Value |
|---|---|
| Address | 2234 Pelican Bay Blvd, Naples, FL 34108 |
| Homeowner | Susan Tremblay |
| Phone | (239) 555-0448 |
| Jurisdiction | Collier County |
| Job # | RR-2024-0831 |
| Permit # | COL-2024-18847 |
| Documents | All received |
| Notes | "Submitted 3/10. Avg turnaround is 8–10 business days." |

---

### Case 5 — "Correction in Progress" (Status: Corrections Required)
**Purpose:** Show the corrections flow — the most impressive part of the demo.

| Field | Value |
|---|---|
| Address | 518 Brickell Key Dr, Miami, FL 33131 |
| Homeowner | Roberto & Ana Fuentes |
| Phone | (305) 555-0561 |
| Jurisdiction | Miami-Dade County |
| Job # | RR-2024-0807 |
| Permit # | MDC-2024-77341 |
| Documents | All received |

**Corrections to pre-log:**

1. *(Open — log this one, leave unresolved)*
   > "Product approval for underlayment does not match the installed product listed on the permit application. Resubmit with updated product approval sheet for Titanium PSU-30."

2. *(Resolved — resolve this one before the demo)*
   > "Contractor license number missing from page 2 of the permit application."
   > Resolution: "Added license # CAC1820477 to page 2. Resubmitted corrected application."

> **Demo move:** Show one resolved, one open. Click Resolve on the open one → green "All corrections resolved" banner appears → link back to case to advance status.

---

### Case 6 — "Approved and Scheduling" (Status: Ready to Start)
**Purpose:** Show the finish line — permit in hand, job ready to schedule.

| Field | Value |
|---|---|
| Address | 9901 Orange Blossom Trail, Orlando, FL 32837 |
| Homeowner | Patricia Huang |
| Phone | (407) 555-0673 |
| Jurisdiction | Orange County |
| Job # | RR-2024-0789 |
| Permit # | ORA-2024-55219 |
| Documents | All received |
| Notes | "Approved 3/8. Scheduling crew week of 3/24." |

---

### Case 7 — "On Hold" (Status: On Hold)
**Purpose:** Show the hold + restore flow, and that holds don't disappear from the pipeline.

| Field | Value |
|---|---|
| Address | 3345 Gandy Blvd, St. Petersburg, FL 33702 |
| Homeowner | Michael Ostrowski |
| Phone | (727) 555-0784 |
| Jurisdiction | Pinellas County |
| Job # | RR-2024-0762 |
| Hold reason | "Homeowner financing fell through — job paused pending resolution." |
| Prior status | Docs Complete |

> **Demo move:** Hit Restore → hint shows "Restore to Docs Complete" → advance.

---

### Case 8 — "Recently Approved" (Status: Approved)
**Purpose:** Populates the "Recently Approved" dashboard card; shows the transition before Ready to Start.

| Field | Value |
|---|---|
| Address | 6610 Osprey Ridge Ln, Bradenton, FL 34203 |
| Homeowner | Theresa Kowalski |
| Phone | (941) 555-0895 |
| Jurisdiction | Manatee County |
| Job # | RR-2024-0748 |
| Permit # | MAN-2024-29103 |
| Documents | All received |

---

## What This Setup Shows on the Dashboard

| Status | Count | Dashboard Section |
|---|---|---|
| New (0 docs) | 1 | Active Permits |
| New (partial docs) | 1 | Active Permits + Needs Attention if stale |
| Docs Complete | 1 | Active Permits |
| Submitted | 1 | Active Permits |
| Corrections Required | 1 | **Needs Attention** |
| Ready to Start | 1 | Active Permits |
| On Hold | 1 | Active Permits |
| Approved | 1 | Recently Approved |

> Set case 5 (Corrections Required) creation date to 6+ days ago so it shows in **Needs Attention** on the dashboard.

---

## Permit Numbers to Use

Pre-formatted to look real for each county:

| County | Format | Example |
|---|---|---|
| Hillsborough | HIL-YYYY-##### | HIL-2024-44021 |
| Pinellas | PIN-YYYY-##### | PIN-2024-38874 |
| Sarasota | SAR-YYYY-##### | SAR-2024-21103 |
| Collier | COL-YYYY-##### | COL-2024-18847 |
| Miami-Dade | MDC-YYYY-##### | MDC-2024-77341 |
| Orange | ORA-YYYY-##### | ORA-2024-55219 |
| Manatee | MAN-YYYY-##### | MAN-2024-29103 |
