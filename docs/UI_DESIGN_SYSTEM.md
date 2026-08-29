# CoalGov — Enterprise UI Design System & Visual Guidelines

> **SIH26024 — AI-Based Smart Governance & Compliance Monitoring System for Coal Mines**
> **Theme:** Enterprise Light Operations & Command Center
> **Version:** 2.0 (Light Mode + Authentication Pass)

---

## 1. Design Philosophy

The CoalGov interface is built on **Enterprise Operational Intelligence** principles:
* **Trustworthy & Authoritative:** High-contrast, clean typography and understated structural borders designed for statutory compliance audits.
* **Minimalist & Purposeful:** Avoids gaming UI, cyberpunk neon, or excessive glassmorphism. Color and motion communicate state rather than decoration.
* **High Information Density:** Dense without being cluttered, allowing mine safety officers, general managers, and DGMS auditors to immediately scan critical safety telemetry.

---

## 2. Color System & Design Tokens

### 2.1 Surfaces & Backgrounds (Light Theme)
```css
--bg-app:          #f8fafc;  /* App canvas backdrop */
--bg-sidebar:      #ffffff;  /* Left navigation rail */
--bg-card:         #ffffff;  /* Primary surface for data panels & cards */
--bg-secondary:    #f1f5f9;  /* Secondary containers, table headers, demo chips */
--bg-subtle:       #f8fafc;  /* Subtle panel backgrounds */
--border-subtle:   #e2e8f0;  /* Standard card and container borders */
--border-medium:   #cbd5e1;  /* Interactive inputs and control borders */
```

### 2.2 Typography Colors
```css
--text-primary:    #0f172a;  /* Dark graphite for primary headlines & data */
--text-secondary:  #475569;  /* Neutral slate for body text & descriptions */
--text-muted:      #64748b;  /* Neutral gray for captions, units, and timestamps */
--text-dim:        #94a3b8;  /* Dim gray for placeholders & decorative lines */
```

### 2.3 Restrained Brand Accent
```css
--color-brand:        #0f766e;  /* Deep Technical Teal / Forest Green */
--color-brand-hover:  #115e59;  /* Darker teal for button hovers */
--color-brand-light:  #f0fdfa;  /* Light teal tint for active nav & selected pills */
--color-brand-border: #ccfbf1;  /* Subtle teal border for selected states */
```

### 2.4 Semantic Operational Indicators
Color is strictly reserved for communicating severity, statutory rule violations, and system state:

| Severity Level | Base Color | Background Tint | Border Color | Text Color | Usage Example |
|---|---|---|---|---|---|
| **SUCCESS / SAFE** | `#15803d` | `#f0fdf4` | `#bbf7d0` | `#166534` | Compliant rule check, normal gas readings (&lt; 0.75%), closed case |
| **WARNING / MEDIUM** | `#b45309` | `#fffbeb` | `#fde68a` | `#92400e` | Air speed falling, roof convergence watch, 2–4 hour SLA |
| **HIGH RISK** | `#c2410c` | `#fff7ed` | `#fed7aa` | `#9a3412` | Repeated violations, restricted zone entry breach |
| **CRITICAL / EMERGENCY** | `#b91c1c` | `#fef2f2` | `#fecaca` | `#991b1b` | Methane surge (&gt; 1.0%), 4-Hour statutory SLA breach, evacuation |
| **INFO / TELEMETRY** | `#0369a1` | `#f0f9ff` | `#bae6fd` | `#075985` | IoT stream node status, offline synchronization |

---

## 3. Typography Hierarchy

CoalGov pairs three specialized typography families to balance scannability with precision:
1. **Space Grotesk (Headings & Metrics):** Modern geometric grotesk for dashboard metrics, page titles, and case IDs.
2. **Inter (Interface & Body):** High legibility at small sizes for labels, checklists, and forms.
3. **JetBrains Mono (Telemetry & Codes):** Monospaced precision for sensor readings (`0.42%`, `3.2 m/s`), coordinates (`X=500, Y=490`), timestamps (`12:05 PM`), and SHA-256 hashes.

```
Page Title:      24px · Space Grotesk · Bold · #0f172a
Section Title:   21px · Space Grotesk · Bold · #0f172a
Metric Hero:     32px–54px · Space Grotesk / JetBrains Mono · Bold
Card Label:      10.5px · JetBrains Mono · Uppercase · Bold · #64748b
Body Text:       13.5px · Inter · Regular · #475569
Timestamp / ID:  11.5px · JetBrains Mono · #64748b
```

---

## 4. Minimalist Motion System

Animations are restrained and serve to clarify state changes rather than provide entertainment.

### 4.1 Timing Standards
* **Micro-interactions (Hover, Press):** `150ms cubic-bezier(0.16, 1, 0.3, 1)`
* **View Transitions (Page switch, Modal):** `250ms cubic-bezier(0.16, 1, 0.3, 1)`
* **Card Entrance & Drawer Slides:** `300–400ms cubic-bezier(0.16, 1, 0.3, 1)`
* **Chart Height Transition:** `400ms ease-out`
* **Sensor Value Drift Interval:** `2500ms` background simulation

### 4.2 Accessibility & Reduced Motion
CoalGov strictly honors the `@media (prefers-reduced-motion: reduce)` media query:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 5. Component Design

### 5.1 Authentication Card
* **Split Layout:** 
  * Left side contains dark navy industrial background (`#0f172a`) with an SVG abstract mine-network graphic illustrating connected nodes and moving signal packets.
  * Right side contains white card with clean input fields, inline error handling, and demo profile quick-fills.
* **Form Validation:** Validates email presence, valid RFC-compliant structure, and password length. Inline red error text is rendered without intrusive `alert()` popups.

### 5.2 Status Banners & KPI Cards
* **Strategic Status Board:** Clear 5-point operational answer at top of dashboard (Status, Primary Hazard, Location, Severity, Action Button).
* **KPI Cards:** White surfaces (`#ffffff`) with subtle gray borders (`#e2e8f0`), top accent bar for status, and positive/negative trend delta badges.

### 5.3 Mine Digital Twin Spatial Map
* **Light CAD Blueprint Canvas (`#f8fafc`):** Clean grid lines (`#e2e8f0`) with dark slate tunnels (`#334155`).
* **Entity Markers:** Clean circular icons for workers, square nodes for equipment, and pulsating cyan dots for sensors.
* **Smooth Centering:** Dispatching "Locate on Map" from any alert or case smoothly centers and scales the transform matrix directly to the coordinates of the target entity or zone.

### 5.4 Case Problem Solver Workspace
* **3-Step Lifecycle:** Problem Assignment → Corrective Action & Photo Proof → Verification & Final Closure.
* **SLA Escalation Matrix:** Visual 3-Level timeline representing statutory 4-hour SLA rules with automatic DGMS escalation.

---

## 6. Authentication Abstraction (`AuthService`)

The authentication layer is isolated in `src/auth/authService.js` and provides an async API ready for Supabase Auth drop-in:
* `signIn(email, password)`: Validates credentials and returns `{ user, error }`.
* `signOut()`: Destroys active session and notifies UI listeners.
* `getCurrentUser()`: Returns active operator profile (Name, Title, Avatar, Role, Mine ID).
* `isAuthenticated()`: Returns boolean session state.
* `onAuthStateChanged(callback)`: Event emitter for session changes.
