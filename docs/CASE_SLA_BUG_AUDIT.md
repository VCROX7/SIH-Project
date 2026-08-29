# SIH26024 — Case Management, SLA & Evidence Upload Bug Audit

> **Audit Date:** 2026-08-29
> **Component:** Case Lifecycle, SLA Engine, Evidence Service, Field Inspection & Resolution Workflow

---

## Executive Summary

A comprehensive technical audit of the case management, SLA tracking, evidence upload, and case resolution pipeline was conducted. While core service files existed in prototype form, the user interface and state machine exhibited significant functional and architectural gaps:
1. "View Case" did not actually select or load dynamic case data; the case workspace was hard-coded to a static mockup of Case #2048.
2. Evidence upload lacked real `<input type="file">` file reading, validation (file type, file size), image previewing, and per-case isolation.
3. Case state transitions and resolution were unvalidated (cases could jump straight to `RESOLVED` without required inspection, evidence verification, corrective actions, or re-inspections).
4. SLA calculations were not centralized in a dedicated SLA engine, lacked `DUE_SOON` / `ON_TRACK` / `OVERDUE` states, and lacked deterministic countdown formatting.

---

## Detailed Audit & Root Cause Analysis

### 1. "View Case" Navigation & Case Workspace Data Binding
- **Issue:** Clicking "View" or "View Case" in the case registry or alert center only toasted a message and failed to render the selected case's details.
- **Root Cause:**
  - `app.js` had `renderCases()` with an inline button: `onclick="toast('Viewing case ' + c.id)"`.
  - Pane 1 and Pane 2 in `#cases` contained static HTML hard-coded to `Case #2048`.
  - No active state variable `selectedCaseId` or `viewCase(caseId)` controller existed to bind dynamic case properties (Title, Zone, Tunnel, Assignee, SLA, Severity, Risk, Evidence, Corrective Actions).
- **Affected Files:** `c:/VS CODE/SIH/app.js`, `c:/VS CODE/SIH/index.html`, `c:/VS CODE/SIH/src/services/caseService.js`
- **Proposed Fix:**
  - Add `activeCaseId` management in `CaseService` / `app.js`.
  - Implement unified `viewCase(caseId)` function that highlights the selected case in the list, populates all case fields, renders the 8-stage lifecycle tracker for that specific case, and loads its attached evidence and corrective actions.
- **Test Required:** `View Case opens correct case`, `Wrong case ID handled`, `Case detail data rendered correctly`.

---

### 2. Evidence / Photo Upload & Preview
- **Issue:** "Upload Picture / Evidence" was non-functional; no file picker existed, no image preview was rendered, and no file validation was performed.
- **Root Cause:**
  - `index.html` contained static text and placeholder hashes rather than a functional file upload component with `<input type="file">`.
  - `EvidenceService.uploadEvidence()` only accepted mock data without handling real image files or FileReader Data URLs.
  - No validation for file types (`image/jpeg`, `image/png`, `image/webp`) or maximum file size limits (5 MB).
  - No per-case evidence filtering in the Case Workspace (Case A evidence was not isolated from Case B).
- **Affected Files:** `c:/VS CODE/SIH/src/services/evidenceService.js`, `c:/VS CODE/SIH/index.html`, `c:/VS CODE/SIH/app.js`, `c:/VS CODE/SIH/styles.css`
- **Proposed Fix:**
  - Implement dynamic Evidence Upload Modal / Drawer in Case Workspace with file input, drag-and-drop dropzone, live image preview, file size/type validation, remove/replace buttons, and instant SHA-256 hash generation.
  - Ensure `EvidenceService.getEvidenceForCase(caseId)` strictly isolates items by `caseId`.
- **Test Required:** `Valid image accepted`, `Invalid type rejected`, `Empty file rejected`, `Oversized file rejected`, `Preview works`, `Evidence associated with correct case`, `Case isolation verified`.

---

### 3. SLA System, Countdown & Escalation Logic
- **Issue:** SLA timers were static text or simple difference checks without `ON_TRACK`, `DUE_SOON`, `OVERDUE`, and `ESCALATED` status derivation.
- **Root Cause:**
  - `CaseService.checkSLAs()` ran a simple `now > dueDate` check that immediately transitioned status to `ESCALATED` and would spam alerts on every timer tick.
  - No dedicated SLA helper calculating remaining time (`02h 14m`), overdue time (`Overdue by 00h 12m`), and configurable thresholds (`DUE_SOON` when `<= 1h`).
- **Affected Files:** `c:/VS CODE/SIH/src/services/caseService.js`, `c:/VS CODE/SIH/app.js`
- **Proposed Fix:**
  - Create robust `SlaEngine` / `CaseService.getSlaStatus(caseId, currentTime)` module supporting deterministic clock timestamps for automated testing.
  - Ensure escalation events are dispatched only once per case when breaching statutory SLA.
- **Test Required:** `SLA ON_TRACK calculation`, `SLA DUE_SOON calculation`, `SLA OVERDUE calculation`, `SLA ESCALATED calculation`, `SLA Countdown formatting`, `No duplicate escalation spam`.

---

### 4. Case State Machine, Actions & Validation Pipeline
- **Issue:** Case transitions could skip mandatory statutory steps; cases could be marked `CLOSED` directly from `OPEN` without inspection, evidence, corrective action, or re-inspection.
- **Root Cause:**
  - `VALID_TRANSITIONS` in `caseService.js` permitted `OPEN -> RESOLVED` and lacked the full 9-state pipeline (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `INSPECTION_REQUIRED`, `CORRECTIVE_ACTION`, `RE_INSPECTION`, `VERIFICATION`, `RESOLVED`, `CLOSED`, `ESCALATED`).
  - No validation gate `canResolve(caseId)` ensuring that:
    1. Assigned officer exists
    2. Field inspection is completed
    3. Verified evidence is attached
    4. Corrective action is marked `COMPLETED`
    5. Re-inspection passed with improved telemetry
    6. Final verification sign-off is completed
- **Affected Files:** `c:/VS CODE/SIH/src/services/caseService.js`, `c:/VS CODE/SIH/app.js`
- **Proposed Fix:**
  - Implement strict state machine in `CaseService` with `canTransition(caseId, newState)` and `validateResolution(caseId)`.
  - Display clear diagnostic messages when resolution is blocked (e.g., *"Case cannot be resolved because re-inspection has not been completed."*).
- **Test Required:** `Valid transitions pass`, `Invalid transitions fail`, `Blocked resolution without inspection`, `Blocked resolution without evidence`, `Blocked resolution without corrective action`, `Blocked resolution without re-inspection`, `Valid resolution succeeds`.

---

### 5. Corrective Action & Re-Inspection Telemetry Comparison
- **Issue:** Corrective actions were simple strings without structured state (`PENDING`, `IN_PROGRESS`, `COMPLETED`), and re-inspections lacked Before vs After telemetry comparisons.
- **Root Cause:**
  - No data model for corrective action records (`actionId`, `caseId`, `description`, `assignedTo`, `status`, `completedAt`, `evidenceId`).
  - Re-inspection did not record or display BEFORE telemetry (Methane 0.62%, Airflow 2.1 m/s, Risk 87) vs AFTER telemetry (Methane 0.38%, Airflow 3.4 m/s, Risk 34).
- **Affected Files:** `c:/VS CODE/SIH/src/services/caseService.js`, `c:/VS CODE/SIH/app.js`, `c:/VS CODE/SIH/index.html`
- **Proposed Fix:**
  - Add structured corrective action and re-inspection methods to `CaseService`.
  - Add visual BEFORE / AFTER telemetry comparison widget in Case Workspace.
- **Test Required:** `Corrective action creation & completion`, `Re-inspection telemetry delta verified`.

---

### 6. Audit Trail Traceability
- **Issue:** Actions taken in the UI did not consistently log structured audit events linked to the specific case ID.
- **Root Cause:**
  - Various button handlers in `index.html` only altered DOM styling without invoking `AuditService.log()`.
- **Affected Files:** `c:/VS CODE/SIH/app.js`, `c:/VS CODE/SIH/src/audit/auditService.js`
- **Proposed Fix:**
  - Ensure every case action (`CASE_OPENED`, `CASE_ASSIGNED`, `INSPECTION_REQUESTED`, `EVIDENCE_ATTACHED`, `CORRECTIVE_ACTION_CREATED`, `CORRECTIVE_ACTION_COMPLETED`, `RE_INSPECTION_PASSED`, `CASE_RESOLVED`, `CASE_CLOSED`, `SLA_ESCALATED`) logs an immutable audit event with `entityId = caseId`.
- **Test Required:** `All 8 lifecycle actions log audit events with correct case ID`.

---

## Action Plan & Implementation Sequence

1. **Step 1:** Upgrade `src/services/caseService.js` with full state machine, structured corrective actions, re-inspection telemetry, SLA calculations, resolution validator, and seed cases.
2. **Step 2:** Upgrade `src/services/evidenceService.js` with real image file handling (FileReader Data URL), mime-type and size validation, SHA-256 hash generation, and case isolation.
3. **Step 3:** Update `index.html` with the dynamic 3-pane Case Workspace (Case Info, Evidence & Corrective Action Workshop, Re-inspection Before/After, 8-Stage Lifecycle, Evidence Upload Modal).
4. **Step 4:** Update `app.js` with full `viewCase(caseId)` controller, dynamic case rendering, live SLA countdown timer, evidence upload modal triggers, corrective action forms, and re-inspection triggers.
5. **Step 5:** Enhance `tests/testSuite.js` with all 44 unit/integration tests and complete E2E integration test.
6. **Step 6:** Create `docs/CASE_WORKFLOW.md` and update `docs/SIH_IMPLEMENTATION_STATUS.md`.
7. **Step 7:** Run all test suites and verify 100% pass.
