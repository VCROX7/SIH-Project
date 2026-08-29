# SIH26024 — P0 End-to-End Demo Guide

This guide provides the exact steps for presenting the SIH26024 P0 Prototype to the judges.

## Prerequisites
1. Open `index.html` in a modern browser (Desktop recommended).
2. The system should start with 0 Active Cases and risk levels normal.

## The Story Flow

1. **Dashboard Initialization**
   - Show the dashboard. Explain that the P0 system is a deterministic prototype linking simulated IoT/Location data directly into a safety case lifecycle.
   
2. **Start P0 Demo**
   - In the top-right of the screen, under the user avatar, click **"Next Step"** in the green `P0 DEMO` control box.
   - **Action:** A Simulated Sensor Anomaly occurs (Methane spike).
   - **Result:** You will see a `toast` notification. The Risk Engine recalculates and escalates the zone to `HIGH` risk, generating a Critical Safety Alert. 

3. **Alert to Case Conversion**
   - Click **"Next Step"** again.
   - **Action:** The system automatically picks up the High Alert and escalates it into a formal Safety Case. It also assigns it to the on-duty engineer (M-1024).

4. **Navigate to Cases**
   - Click **"Solve Cases"** in the left sidebar.
   - You will see the new Case in the table marked as `ASSIGNED` or `OPEN`.

5. **Simulate Offline Inspection**
   - Click **"Next Step"** again.
   - **Action:** The system simulates the worker going underground where there is no network. The Case transitions to `INSPECTION_REQUIRED`. The worker completes an inspection form locally, which is geo-tagged using the `SimulatedLocationProvider` and queued in `localStorage`.

6. **Network Restoration & Evidence Verification**
   - Click **"Next Step"** again.
   - **Action:** Network connectivity is restored. The queued inspection syncs automatically. Evidence (a photo) is uploaded and run through the `EvidenceService`, which verifies the Hash, Timestamp, and Geo-tag location. The case advances to `INSPECTION_SUBMITTED`.

7. **Case Resolution**
   - Click **"Next Step"** one last time.
   - **Action:** Corrective action is recorded. The case transitions to `VERIFICATION`, the sensor readings are normalized, the Risk Engine lowers the risk score back to `LOW`, and the Case is marked `CLOSED`.

8. **Audit Trail**
   - Point out the **History Log** at the bottom of the Cases page. It contains a complete, immutable audit trail of the entire P0 lifecycle, from the sensor anomaly to the verified evidence and case closure.

## Resetting the Demo
To run the demo again, click the **"Reset"** button in the `P0 DEMO` control box, then refresh the browser page.
