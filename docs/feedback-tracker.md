# PermitPilot — Feedback Tracker

Paste this table into Notion or Google Sheets. One row per observation.

---

## Category Key

| Code | Meaning |
|---|---|
| `CONFUSING` | User was unsure what to do or what something meant |
| `BROKEN` | Something didn't work as expected |
| `REQUESTED` | User asked for a feature that doesn't exist yet |
| `TRUST` | User hesitated or expressed doubt before acting |
| `WORKFLOW` | The sequence of steps felt wrong or out of order |

## Priority Key

| Code | Meaning |
|---|---|
| `P0` | Blocks demo or first use — fix before next showing |
| `P1` | Mentioned unprompted or more than once |
| `P2` | Noted once, worth considering |
| `P3` | Nice to have, low urgency |

## Status Key

`OPEN` → `IN REVIEW` → `DECIDED: BUILD` / `DECIDED: SKIP` / `DECIDED: LATER`

---

## Tracker

| # | Date | Source | Who | Quote or Observation | Category | Priority | Status | Notes |
|---|------|--------|-----|----------------------|----------|----------|--------|-------|
| 1 | | | | | | | OPEN | |
| 2 | | | | | | | OPEN | |
| 3 | | | | | | | OPEN | |
| 4 | | | | | | | OPEN | |
| 5 | | | | | | | OPEN | |
| 6 | | | | | | | OPEN | |
| 7 | | | | | | | OPEN | |
| 8 | | | | | | | OPEN | |

---

## Patterns to Watch For

After 3+ sessions, look for these signals:

- **Same screen mentioned by 2+ different people** → high-priority redesign candidate
- **Same feature requested by 2+ different people** → add to roadmap backlog
- **Any P0 that wasn't caught in QA** → add to QA checklist immediately
- **Hesitation before On Hold or status transitions** → trust/wording issue, not a feature gap
- **"Does it work for [county/state] I'm in?"** → geo-expansion signal; note which county

---

## Session Notes Template

Copy one block per demo/test session:

```
## Session — [Date]
Tester: 
Role: 
Company size: 
How they manage permits today: 

Strongest reaction (positive): 
Strongest reaction (negative/confused): 
First unprompted question: 
Feature requested (if any): 
Would they use it? (Y / N / Maybe): 
Key quote: 
```
