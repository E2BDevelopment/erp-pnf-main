# 10x Analysis: ERP PNF
Session 1 | Date: 2026-11-04

## Current Value

ERP PNF is a multi-company operating system for Mexican construction firms. Its core promise is to keep the job's authorized budget, field requests, approvals, purchasing, receipts, payroll, subcontractors, small cash, payments, and weekly close connected to the job and the people who acted. Its strongest product decisions are structural: the job is the unit of work, the week is the operating cadence, Mexican construction vocabulary is native, and permissions are enforced on the server.

The primary users are Directors coordinating multiple jobs, Residents and Auxiliaries recording field activity on mobile, Supervisors approving work, and Administrators converting approved needs into purchases and payments. The system already has broad workflow coverage and a mature database model, but repository evidence says it runs on local demo data and has no real construction company or production usage yet. Several corporate routes also remain placeholders. The product has breadth; its next step is proving and delivering dependable outcomes in the workflows that protect margin and cash.

**Evidence:** `PRODUCT.md` (personas, operating cadence, product principles, evidence limits); `docs/procesos-modulos.md` (implemented flows, current placeholder routes, and unresolved operating rules); `README.md` (demo seed and local-only setup).

## The Question

What would make ERP PNF the place a construction company trusts to answer, every day: **Which jobs are drifting from budget, what is causing it, and what decision should we make now?**

---

## Massive Opportunities

### 1. Job Margin Control Tower — Protect the forecast, not just record the past
**What**: Build a live forecast per job and budget line that combines authorized budget, commitments (approved requisitions and purchase orders), receipts, payroll/destajos, subcontractors, rentals, fuel, small cash, payments, and measured progress. Surface projected cost at completion, expected margin, cash needs, and the top causes of variance. Every warning links to its source records and a concrete next action.
**Why 10x**: A ledger tells a Director what was entered. A control tower helps them intervene before overruns become irreversible. It turns the ERP from a set of modules into a system for protecting profit.
**Unlocks**: Portfolio prioritization, reliable weekly review, earlier change-order action, and eventually learning which types of work or suppliers create risk.
**Effort**: Very High
**Risk**: Forecasts will damage trust if budget, commitment, progress, and actual-cost definitions are inconsistent. Begin with transparent arithmetic and source links; label estimates and expose assumptions. Do not present the result as formal accounting.
**Score**: 🔥

### 2. Field-to-Forecast Capture — Turn evidence from the jobsite into the control tower
**What**: Let the Resident capture daily progress, labor, deliveries, blockers, and evidence (photo, voice note, or short text) in a quick mobile flow. Match entries to budget lines, requisitions, and tasks, then flag gaps such as work reported without a material receipt or a delivery without a corresponding need.
**Why 10x**: The jobsite is where the facts that explain cost drift first appear. Low-friction capture closes the gap between office records and field reality.
**Unlocks**: Better forecasts, searchable job history, evidence-backed approvals, and a dependable daily-to-weekly operating rhythm.
**Effort**: High
**Risk**: Connectivity, noisy data, and added reporting burden. Design for intermittent connectivity and make each capture immediately useful to the person in the field.
**Score**: 👍

### 3. Construction Operations Network — Share trusted counterparties and commercial history
**What**: With explicit company consent, build a network layer for suppliers, subcontractors, and crews: reusable verified profiles and documents, response times, price history by region and unit, delivery reliability, and job performance. Each company retains control of private terms and records.
**Why 10x**: Repeated supplier onboarding and opaque pricing slow every project. A trusted network makes ERP PNF more useful with every participating company and gives the product a defensible data advantage.
**Unlocks**: Faster sourcing, credible benchmarks, supplier discovery, and lower friction when companies start a new job.
**Effort**: Very High
**Risk**: Requires real adoption, careful privacy boundaries, data quality, and enough regional density. Do not build before validating demand with pilot users.
**Score**: 🤔

## Medium Opportunities

### 1. Weekly Close as a Guided Operating Ritual
**What**: Convert the weekly close and condensado into a guided checklist per job: pending receipts, payroll/destajos, cash vouchers, approvals, unlinked costs, and reconciliation. Show owner, due date, missing evidence, and what blocks closing; prepare a review packet for Director/Administration.
**Why 10x**: The week is already the product's natural cadence. A shared, reliable close makes disparate modules feel like one operating system and reduces end-of-week reconstruction.
**Impact**: Faster close, fewer surprises, and a trustworthy weekly picture across jobs.
**Effort**: Medium
**Score**: 🔥

### 2. One Approval Inbox Across Jobs
**What**: Give each approver one prioritized queue for decisions across their assigned jobs, with amount, budget impact, age, evidence, prior decisions, and approve/reject/request-correction actions. Preserve the existing rule that Supervisor authorization happens in job context by making each item open directly into that context.
**Why 10x**: Role-specific navigation is not the same as managing work. Approval work is fragmented across module pages, which makes delays hard to see and easy to miss.
**Impact**: Shorter approval cycles, fewer stalled purchases, clearer accountability.
**Effort**: Medium
**Score**: 🔥

### 3. Reliable Purchase-to-Payment Completion
**What**: Make the whole requisition → quote comparison → purchase order → receipt → payable → payment path visible as one traceable timeline, with partial fulfillment, exceptions, and next owner clearly called out. Complete the administrative views that are still placeholders, starting with the steps that block a real end-to-end purchase.
**Why 10x**: The chain is a core differentiator in `PRODUCT.md`, but `docs/procesos-modulos.md` notes that administrative requisitions and central warehouse routes remain placeholders. Closing this gap turns the stated promise into an operable one.
**Impact**: Fewer dropped handoffs and a defensible record from field need through cash outflow.
**Effort**: Medium/High
**Score**: 🔥

### 4. Exception-First Portfolio Review
**What**: Replace passive top-level summaries with a company view that ranks only decisions needing intervention: forecast variance, overdue approvals, unreceived commitments, missing weekly close items, and unusual cost movement. Let Directors delegate an owner and due date.
**Why 10x**: Directors need to manage by exception across simultaneous jobs, not open each module to assemble the same picture.
**Impact**: More time on decisions, less time searching and consolidating.
**Effort**: Medium
**Score**: 👍

## Small Gems

### 1. “What is waiting on me?”
**What**: A role-aware, cross-module action list with aging and a direct link to the next action.
**Why powerful**: Converts existing pending counts and notifications into a daily starting point.
**Effort**: Low/Medium
**Score**: 🔥

### 2. Unlinked Cost Finder
**What**: Flag costs, receipts, and payments that lack a job, budget line, source document, or approval link.
**Why powerful**: Finds leakage and cleanup work while the context is still fresh.
**Effort**: Low/Medium
**Score**: 👍

### 3. “Why did this number change?”
**What**: On every job total and budget variance, show the records and transactions that caused the movement, with links to audit history.
**Why powerful**: Reduces spreadsheet reconciliation and builds trust in rollups.
**Effort**: Low/Medium
**Score**: 🔥

### 4. Approve from the notification
**What**: Put the amount, job, reason, evidence, and safe action path directly in an approval alert; resume at the exact approval state.
**Why powerful**: Removes navigation friction at the moment work is waiting.
**Effort**: Low
**Score**: 👍

## Recommended Priority

### Do Now
1. **Run a focused pilot around purchase-to-payment and weekly close.** Pick one or two real jobs; observe a Resident, Supervisor, and Administrator completing the weekly cycle. The repo's demo environment is not evidence of fit. Measure cycle time, missing links, corrections, and close effort before broadening scope.
2. **Ship the shared “waiting on me” queue and cross-document trace.** Start with approvals and the requisition-to-payment chain. This makes the current system coherent while surfacing exactly where operations stall.
3. **Define and complete the highest-blocking placeholder routes.** Prioritize the administrative steps needed to finish purchasing, receiving, and financial close; validate what “almacén central” means before treating it as a known process.

### Do Next
1. **Guided weekly close.** Use the week already present across payroll, warehouse, small cash, and condensado to establish a single accountable ritual.
2. **Transparent job forecast.** Start with deterministic committed-cost and actual-cost rollups by budget line; show source records and assumptions before adding predictive claims.
3. **Exception-first Director dashboard.** Rank actionable risk across jobs and assign ownership.

### Explore
1. **Field evidence capture with intermittent connectivity.** Prototype with Residents on actual job sites; keep capture faster than the current paper/WhatsApp workaround.
2. **Supplier and subcontractor network.** Interview multiple companies about sharing profiles, response times, and price history; verify that enough users would contribute useful data.
3. **Later: predictive risk alerts.** Only after real data has enough quality and volume; start with explainable rules such as committed cost exceeding remaining authorized budget.

## Assumptions and Questions

### Answered from the repository
- **Q**: Who is the product for and what is the core operating unit? **A**: Five roles across multiple jobs; job is the unit for costs and approvals, and the week is the main close cadence (`PRODUCT.md`).
- **Q**: What end-to-end value is promised? **A**: A traceable path from authorized budget through requisition, purchasing, receipt, payable, payment, payroll, field expenses, and weekly close (`PRODUCT.md`).
- **Q**: Is product-market fit demonstrated? **A**: No. The repository describes a local demo, with no real operating companies or production users yet (`PRODUCT.md`).
- **Q**: Where are known flow gaps? **A**: Some admin routes, including requisitions and central warehouse, remain placeholders; several other routes also need completion (`docs/procesos-modulos.md`, section 9).

### Blockers to validate with users
- Which outcome would win adoption first: reduced budget overrun, faster weekly close, fewer approval delays, or better cash planning?
- Which budget baseline and earned-progress method do target companies trust for projected margin?
- How are field updates captured today (paper, WhatsApp, spreadsheets), and what evidence is realistic to collect on a phone?
- Who owns the official weekly close, what must reconcile, and what constitutes an acceptable exception?
- What does “almacén central” mean in actual operations, and how does it relate to jobsite receiving and inventory?

## Next Steps
- [ ] Validate the top adoption outcome in interviews with Directors, Residents, Supervisors, and Administrators at real Mexican construction firms.
- [ ] Observe one full weekly cycle at a live job and map where information is recreated, delayed, or lost.
- [ ] Establish baseline measures: approval time, requisition-to-receipt time, weekly close hours, unlinked spend, and forecast variance.
- [ ] Prototype the approval queue and guided close with real workflow data before expanding the prediction layer.
- [ ] Select one pilot company and one job; agree data ownership, permission boundaries, and success criteria.
