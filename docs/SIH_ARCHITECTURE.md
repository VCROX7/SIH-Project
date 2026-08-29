# SIH26024 — Architecture Document

> AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
> SIH Problem Statement ID: SIH26024
> Deployed Frontend: https://euphonious-elf-2c56cd.netlify.app

---

## 1. Current Architecture

The project is currently a **single-page vanilla web application** — no build step, no bundler, no backend server.

```
SIH/
 index.html          <- Single HTML file containing all 8 page sections
 app.js              <- All JS logic: routing, state, sensor simulation, case handling
 styles.css          <- Complete CSS: design tokens, layout, components, responsive
 src/                <- Foundation layer (added during technical audit 2026-08-29)
   types/
     domain.ts       <- TypeScript domain interfaces (design-time reference only)
   data/
     demoData.js     <- Centralised synthetic demo data (clearly labelled SIMULATED)
   services/
     services.js     <- Service boundary stubs (all return null / NOT_IMPLEMENTED)
 docs/
   SIH_ARCHITECTURE.md           <- This file
   SIH_IMPLEMENTATION_STATUS.md  <- Implementation progress tracker
```

---

## 2. Current Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Language | HTML5 / Vanilla JavaScript / CSS3 | No TypeScript compilation yet |
| Framework | None | Pure DOM manipulation |
| Routing | Custom showPage() function | SPA-style section visibility toggle |
| State | Global JS variables | isDangerMode, isSynced, pageTitles, userRoles |
| Styling | Custom CSS with CSS Variables | Design tokens in :root |
| Fonts | Google Fonts: Inter + Space Grotesk | Loaded via CDN |
| Charts | Pure CSS bars | div.bar with inline height percentages |
| Maps | Pure CSS positioned divs | .mine-zone + .map-marker overlay — NOT a real GIS map |
| Sensors | setInterval random simulation | Updates every 3 seconds |
| Backend | None | No API, no database, no auth server |
| Auth | None | Role switching is UI-only demo (dropdown select) |
| Deployment | Netlify (static) | CI from git push |
| Testing | None | No test suite exists |
| Build | None | Files are served directly |
| Package Manager | None | No package.json |
| TypeScript | Not compiled | domain.ts added as design-time reference only |

---

## 3. Existing Routes / Pages

All pages live inside index.html as section elements.
Navigation is handled by showPage(pageId) in app.js.

| Page ID | Nav Label | Description |
|---|---|---|
| dashboard | Dashboard | Overview: KPI cards, trend chart, safety alerts |
| sensors | Live Sensors | 6 sensor cards with simulated live readings |
| ai | Risk and Repeated Issues | Risk score breakdown + recurrence detection |
| cases | Solve Cases | Case table + Case #2048 workspace |
| accountability | Department Scores | 3 dept score cards + DGMS rules compliance table |
| inspection | New Inspection | Form: area, notes, checklist, submit |
| map | Mine Map | CSS-based zone layout with clickable markers |
| reports | Safety Reports | Report form + pre-rendered sample report output |

---

## 4. Existing Reusable Components (CSS Classes)

The following CSS classes form the informal component library:

| Class | Description |
|---|---|
| .card | KPI metric card (white, rounded, border) |
| .panel | Content section panel |
| .pill | Status badge: .pill.high, .pill.medium, .pill.low, .pill.done |
| .btn / .btn.primary / .btn-sm | Button variants |
| .sensor-card / .sensor-card.danger | Live sensor display card |
| .table | Data table: cases list |
| .alert | Dashboard alert item (dot + text) |
| .chart / .bar | CSS bar chart |
| .map / .mine-zone / .map-marker | Mine map overlay elements |
| .case-step | Numbered step in case workspace |
| .history-item / .history-box | Audit log display |
| .rule-box / .rule-box.overdue / .rule-box.ok | Compliance rule display |
| .toast | Fixed bottom-right notification |
| .tag | Section label tag (green uppercase) |

**Design tokens (CSS variables in :root):**

| Variable | Value | Purpose |
|---|---|---|
| --green | #2f7d4b | Primary / safe / OK |
| --green-light | #e8f4eb | Background for green items |
| --amber | #c98a22 | Warning / medium risk |
| --amber-light | #fbf3e3 | Background for amber items |
| --red | #b94b43 | Danger / high risk |
| --red-light | #f8e9e7 | Background for red items |
| --bg-color | #f6f7f4 | Page background |
| --white | #ffffff | Cards / panels |
| --border-color | #d9ded7 | Borders |
| --text-dark | #222522 | Primary text |
| --text-muted | #6f766f | Secondary / caption text |

---

## 5. Existing Data Flow

```
User Action (click / select)
  -> app.js handler (inline onclick or named function)
    -> DOM mutation (textContent, className, innerHTML)
      -> toast() notification
```

Sensor simulation:
```
setInterval (3000ms)
  -> Math.random() values for CH4, CO, O2, airflow, temp
    -> Direct DOM innerHTML updates (val-ch4, val-co, etc.)
```

Role switching:
```
roleSelector.onchange -> changeRole(key)
  -> userRoles[key] object lookup
    -> DOM updates (avatar, name, title)
      -> showPage(role.defaultPage)
```

There is **no data layer, no API, and no persistent state** in the current running app.
src/data/demoData.js and src/services/services.js are foundation files that
are not yet imported by index.html or used by app.js.

---

## 6. Domain Entities

Defined in src/types/domain.ts. All entities are TypeScript interfaces (design-time reference only, not compiled).

| Entity | File | Notes |
|---|---|---|
| Mine | domain.ts | Top-level mine unit (e.g., CCL Unit 04) |
| Zone | domain.ts | Named area within a mine (ventilation, shaft, etc.) |
| Tunnel | domain.ts | Underground roadway with dimensions |
| Worker | domain.ts | Employee or contractor worker with role |
| Equipment | domain.ts | Machinery with status and location |
| Sensor | domain.ts | Gas/environmental sensor with readings |
| SensorReading | domain.ts | Historical reading with alert flag |
| Location | domain.ts | Unified location model (surface + underground) |
| Inspection | domain.ts | Field inspection with checklist and evidence |
| ChecklistItem | domain.ts | Individual checklist entry |
| Case | domain.ts | Full lifecycle safety case |
| CorrectiveAction | domain.ts | Action taken to resolve a case |
| Evidence | domain.ts | Attached photo/video/document proof |
| Contractor | domain.ts | External contractor company |
| Document | domain.ts | Regulatory/operational document |
| RiskAssessment | domain.ts | Computed zone risk score with factors |
| RiskFactor | domain.ts | Individual contributing factor to risk score |
| AuditEvent | domain.ts | Immutable audit log entry |
| Notification | domain.ts | Alert sent to a worker |
| DepartmentScore | domain.ts | Team compliance performance metric |

---

## 7. Planned Service Boundaries

Defined as stubs in src/services/services.js. All methods return null currently.

| Service | Responsibility |
|---|---|
| locationService | GPS (surface) + UWB/RFID/BLE (underground) positioning |
| riskService | AI/ML risk scoring, recurrence detection, anomaly alerts |
| inspectionService | Inspection CRUD, offline save, sync |
| caseService | Full case lifecycle: open, assign, proof, close, escalate, reopen |
| evidenceService | Evidence upload, retrieval, authenticity verification |
| ocrService | OCR extraction from scanned documents |
| contractorService | Contractor registry, worker onboarding, document compliance |
| analyticsService | Trend analysis, department reporting, predictive scoring |
| notificationService | In-app, SMS, push notifications for critical events |

---

## 8. Planned Location Architecture

The Location interface (in domain.ts) is the canonical model.

### Key Design Rules

| Rule | Reason |
|---|---|
| GPS is SURFACE-only | GPS signals do not penetrate underground mine workings |
| Underground: use UWB, RFID, BLE | These are the accepted underground positioning standards |
| SIMULATED method = demo data ONLY | Must never be shown to users as live operational data |
| latitude/longitude = null when underground | Prevents confusion with surface coordinates |
| x/y/z = local mine coordinate system | Referenced from a fixed mine origin point (metres) |

### Future Integration Points

```
Surface workers / vehicles
  -> GPS (standard GNSS receiver)
       -> locationService.getSurfaceLocations()

Underground workers
  -> UWB tag on helmet/belt
       -> Mine UWB infrastructure -> gateway -> locationService
     OR
  -> RFID checkpoint scan at tunnel intersections
       -> locationService (last-seen zone, not continuous)

Equipment
  -> BLE beacon or UWB anchor tag
       -> locationService.getUndergroundLocations()

All locations
  -> Geofence check
       -> locationService.isInZone() -> alert if breach
```

Hardware integration is NOT implemented. No real GPS or UWB hardware is connected.

---

## 8.1 Simulated Mine Digital Twin

A fully interactive synthetic underground mine map (`src/map/mineMap.js`) has been built for the SIH demonstration.

- **Synthetic Layout:** Fictional mine layout (Main Tunnel, Panels A-C, Shaft, Exits) drawn entirely in SVG.
- **Simulated Entities:** Workers, equipment, sensors, incidents, and inspections are loaded from static demo arrays.
- **Simulated Locations:** Workers move along predefined paths via a 2-second simulation ticker.
- **Provider Abstraction:** The map requests locations from `SimulatedLocationProvider`. In the future, this will be swapped for `RealUWBProvider` or `RealRFIDProvider` without changing the map logic.
- **Visuals & Interactivity:** Fully zoomable/pannable. Includes layer toggles, entity search, filtering, detail panels, and an Emergency Mode overlay.

Everything in the Digital Twin is strictly labelled **SIMULATED** and operates independently of any real hardware.

---

## 8.2 Geofencing and Safety Event Architecture

A deterministic geofence engine evaluates continuous entity locations against known zones to detect safety breaches.

**Flow:**
Location Update → Geofence Engine → Safety Event → Alert → Case

1. **Geofence Engine:** (`src/geofence/geofenceEngine.js`) Checks location updates against zone boundaries. Generates events like `ENTITY_ENTERED_ZONE`, `ENTITY_LEFT_ZONE`, or `UNAUTHORIZED_ZONE_ENTRY`. Features built-in deduplication to avoid event spam.
2. **Alert System:** (`src/alerts/alertSystem.js`) Promotes high-severity safety events into Alerts. Maintains status (`NEW`, `ACKNOWLEDGED`, `RESOLVED`).
3. **Alert Center:** Provides a unified UI to monitor all active alerts.
4. **Case Integration:** Critical or high alerts can be escalated directly into tracked safety cases.

## 9. Planned Future Implementation Phases

### P0 — Core Safety Infrastructure (Critical Path)
1. GIS Mine Map — Replace CSS div map with Leaflet.js or Mapbox; load real mine layout GeoJSON
2. Worker/Equipment Localization — Integrate UWB/RFID positioning for underground tracking
3. Geofencing — Alert when worker enters hazardous zone without clearance
4. AI Anomaly / Risk Engine — Real-time sensor analysis + ML-based hazard scoring
5. Offline Field Inspection — Service Worker + IndexedDB for underground form submission
6. Evidence Verification — AI/timestamp check to prevent fake/old photo submissions
7. Complete Case Lifecycle — Full open -> assign -> proof -> verify -> close workflow
8. Audit Trail — Immutable, tamper-evident log of all case actions

### P1 — Extended Platform
9. Multi-Mine Corporate Dashboard — Aggregate view across multiple mine units
10. Contractor Management — Contractor registry, worker onboarding, permit tracking
11. OCR Document Intelligence — Scan and parse DGMS permits and inspection forms
12. Predictive Analytics — Forecast hazard probability from historical data
13. AI Assistant — Natural-language query interface for mine safety officers

---

## 10. Known Architectural Issues and Risks

| # | Issue | Severity | Notes |
|---|---|---|---|
| 1 | index.html referenced styles.css but file was named style.css | FIXED | Resolved 2026-08-29: file renamed to styles.css |
| 2 | All app state is in-memory DOM; page refresh resets everything | MEDIUM | Acceptable for demo; must change before pilot |
| 3 | No authentication or authorisation system | HIGH | Role switcher is UI-only; any user can switch roles |
| 4 | Sensor readings are Math.random(); no real sensor integration | HIGH | Must replace with actual SCADA / IoT data before pilot |
| 5 | No backend / database | HIGH | All data is lost on page reload |
| 6 | No offline capability (Service Worker) | MEDIUM | syncOfflineData() function is a UI toast only |
| 7 | CSS-based mine map is not GIS | HIGH | No spatial accuracy; cannot support real zone coordinates |
| 8 | No test suite | MEDIUM | No unit, integration, or E2E tests exist |
| 9 | TypeScript types not compiled | LOW | domain.ts is reference-only until a build system is added |
| 10 | src/data/demoData.js and src/services/services.js not loaded by app | LOW | Foundation files exist but are not script-included in index.html yet |

---

*Document created: 2026-08-29*
*Last updated: 2026-08-29 — Technical Audit + CSS filename fix*
