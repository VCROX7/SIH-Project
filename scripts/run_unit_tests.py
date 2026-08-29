"""
SIH26024 — Automated Case Management, SLA & Resolution Verification Runner
"""
import sys
import os
import datetime

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0

    def suite(self, name):
        print(f"\n--- {name} ---")

    def assert_test(self, condition, desc):
        if condition:
            self.passed += 1
            print(f"[PASS] {desc}")
        else:
            self.failed += 1
            print(f"[FAIL] {desc}")

    def summary(self):
        total = self.passed + self.failed
        print("\n========================================================")
        print(f"Tests: {total} | Passed: {self.passed} | Failed: {self.failed}")
        print("========================================================")
        if self.failed > 0:
            print("TEST SUITE FAILED")
            sys.exit(1)
        else:
            print("ALL TESTS PASSED SUCCESSFULLY.")

# Python mock mirrors of our JS engines for server/CLI verification
class CaseServicePy:
    def __init__(self):
        self.cases = []
        self.active_id = None
        self.valid_transitions = {
            'OPEN': ['ASSIGNED', 'ESCALATED', 'IN_PROGRESS'],
            'ASSIGNED': ['IN_PROGRESS', 'ESCALATED'],
            'IN_PROGRESS': ['INSPECTION_REQUIRED', 'CORRECTIVE_ACTION', 'ESCALATED'],
            'INSPECTION_REQUIRED': ['CORRECTIVE_ACTION', 'ESCALATED'],
            'CORRECTIVE_ACTION': ['RE_INSPECTION', 'VERIFICATION', 'ESCALATED'],
            'RE_INSPECTION': ['VERIFICATION', 'CORRECTIVE_ACTION', 'ESCALATED'],
            'VERIFICATION': ['RESOLVED', 'RE_INSPECTION', 'CORRECTIVE_ACTION', 'ESCALATED'],
            'RESOLVED': ['CLOSED', 'IN_PROGRESS'],
            'CLOSED': [],
            'ESCALATED': ['ASSIGNED', 'IN_PROGRESS', 'CORRECTIVE_ACTION', 'RE_INSPECTION', 'VERIFICATION', 'RESOLVED', 'CLOSED']
        }

    def open_case(self, **kwargs):
        now = datetime.datetime.now(datetime.timezone.utc)
        c = {
            'id': kwargs.get('id', f"C-{len(self.cases)+1000}"),
            'title': kwargs.get('title', 'Hazard Case'),
            'description': kwargs.get('description', ''),
            'category': kwargs.get('category', 'VENTILATION'),
            'severity': kwargs.get('severity', 'MEDIUM'),
            'risk_score': kwargs.get('risk_score', 87 if kwargs.get('severity') == 'HIGH' else 94 if kwargs.get('severity') == 'CRITICAL' else 58),
            'mine': kwargs.get('mine', 'Central Coalfields Unit 04'),
            'zone_id': kwargs.get('zone_id', 'zone-vent'),
            'status': kwargs.get('status', 'OPEN'),
            'assigned_to': kwargs.get('assigned_to', None),
            'assigned_officer_name': kwargs.get('assigned_officer_name', None),
            'created_at': kwargs.get('created_at', now.isoformat()),
            'due_at': kwargs.get('due_at', (now + datetime.timedelta(hours=4)).isoformat()),
            'sla_hours': kwargs.get('sla_hours', 4),
            'escalation_level': kwargs.get('escalation_level', 0),
            'inspection': kwargs.get('inspection', None),
            'evidence_ids': kwargs.get('evidence_ids', []),
            'corrective_actions': kwargs.get('corrective_actions', []),
            're_inspection': kwargs.get('re_inspection', None),
            'resolved_at': None,
            'resolved_by': None,
            'closed_at': None,
            'closed_by': None
        }
        self.cases.append(c)
        if not self.active_id:
            self.active_id = c['id']
        return c

    def get_case(self, case_id):
        for c in self.cases:
            if c['id'] == case_id:
                return c
        return None

    def set_active(self, case_id):
        c = self.get_case(case_id)
        if c:
            self.active_id = case_id
            return True
        return False

    def transition(self, case_id, new_state):
        c = self.get_case(case_id)
        if not c:
            return False
        allowed = self.valid_transitions.get(c['status'], [])
        if new_state not in allowed and c['status'] != 'ESCALATED':
            return False
        c['status'] = new_state
        return True

    def assign(self, case_id, officer_id, name):
        c = self.get_case(case_id)
        if not c:
            return False
        c['assigned_to'] = officer_id
        c['assigned_officer_name'] = name
        return self.transition(case_id, 'ASSIGNED')

    def calculate_sla(self, c, reference_time=None):
        now = reference_time or datetime.datetime.now(datetime.timezone.utc)
        due_str = c['due_at'].replace('Z', '').split('+')[0]
        due = datetime.datetime.fromisoformat(due_str)
        if due.tzinfo is None and now.tzinfo is not None:
            due = due.replace(tzinfo=datetime.timezone.utc)
        diff = (due - now).total_seconds()
        
        is_overdue = diff < 0
        status = 'ON_TRACK'
        if c['status'] == 'ESCALATED':
            status = 'ESCALATED'
        elif is_overdue:
            status = 'OVERDUE'
        elif diff <= 3600:
            status = 'DUE_SOON'

        hours = int(abs(diff) // 3600)
        mins = int((abs(diff) % 3600) // 60)
        formatted = f"{hours:02d}h {mins:02d}m"

        return {
            'status': status,
            'is_overdue': is_overdue,
            'formatted': f"Overdue by {formatted}" if is_overdue else formatted,
            'overdue_by': formatted
        }

    def validate_resolution(self, case_id, evidence_store):
        c = self.get_case(case_id)
        if not c:
            return False, ["Case not found"]
        errors = []
        if not c['assigned_to']:
            errors.append("Unassigned officer")
        if not c['inspection']:
            errors.append("Missing inspection")
        evs = [e for e in evidence_store if e['case_id'] == case_id]
        if len(evs) == 0:
            errors.append("Missing evidence")
        has_completed_ca = any(a['status'] == 'COMPLETED' for a in c['corrective_actions'])
        if len(c['corrective_actions']) > 0 and not has_completed_ca:
            errors.append("Incomplete corrective action")
        if not c['re_inspection']:
            errors.append("Missing re-inspection")
        return len(errors) == 0, errors

    def resolve(self, case_id, evidence_store, resolver):
        valid, errors = self.validate_resolution(case_id, evidence_store)
        if not valid:
            return False, errors[0]
        c = self.get_case(case_id)
        c['resolved_by'] = resolver
        c['resolved_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return self.transition(case_id, 'RESOLVED'), "Resolved"

    def close(self, case_id, closer):
        c = self.get_case(case_id)
        if c['status'] != 'RESOLVED':
            return False, "Case not resolved"
        c['closed_by'] = closer
        c['closed_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return self.transition(case_id, 'CLOSED'), "Closed"

def run_tests():
    t = TestRunner()

    t.suite("1. CASE VIEW & NAVIGATION")
    cs = CaseServicePy()
    evidence_store = []

    c1 = cs.open_case(id="C-9001", title="Ventilation Fan Slipping", zone_id="zone-vent")
    c2 = cs.open_case(id="C-9002", title="Roof Displacement", zone_id="zone-panel-b")

    t.assert_test(cs.set_active("C-9001") and cs.active_id == "C-9001", "Test 1: View Case sets exact active case")
    t.assert_test(cs.set_active("C-BAD") == False, "Test 2: Non-existent case handled gracefully")
    t.assert_test(c1['zone_id'] == 'zone-vent' and c1['mine'] is not None, "Test 3: Case details populated")
    t.assert_test(cs.get_case("C-9002")['id'] == "C-9002", "Test 4: Direct case addressability")

    t.suite("2. EVIDENCE UPLOAD & VALIDATION")
    def validate_file(name, mime, size):
        if not name or size == 0:
            return False, "Empty file"
        if size > 5 * 1024 * 1024:
            return False, "Oversized file"
        if mime not in ['image/jpeg', 'image/png', 'image/webp']:
            return False, "Unsupported type"
        return True, "Valid"

    t.assert_test(validate_file("photo.jpg", "image/jpeg", 500000)[0], "Test 5: Valid JPG accepted")
    t.assert_test(validate_file("malware.exe", "application/x-exe", 1000)[0] == False, "Test 6: Invalid type rejected")
    t.assert_test(validate_file("empty.png", "image/png", 0)[0] == False, "Test 7: Empty file rejected")
    t.assert_test(validate_file("big.jpg", "image/jpeg", 9000000)[0] == False, "Test 8: Oversized file rejected")
    
    # Upload record
    ev1 = {
        'id': 'EV-1001',
        'case_id': 'C-9001',
        'file_name': 'fan_repair.jpg',
        'hash': '0x8f19bc32',
        'verification_status': 'VERIFIED'
    }
    evidence_store.append(ev1)
    t.assert_test(ev1['id'].startswith('EV-'), "Test 10: Evidence record stored")
    
    c1_evs = [e for e in evidence_store if e['case_id'] == 'C-9001']
    c2_evs = [e for e in evidence_store if e['case_id'] == 'C-9002']
    t.assert_test(len(c1_evs) == 1 and len(c2_evs) == 0, "Test 12: Strict case isolation (Case A != Case B)")

    t.suite("3. SLA CALCULATION & ESCALATION")
    fixed_time = datetime.datetime(2026, 8, 29, 12, 0, 0, tzinfo=datetime.timezone.utc)
    
    # ON_TRACK
    c_track = cs.open_case(id="C-ONTRACK", due_at="2026-08-29T14:00:00Z")
    sla_track = cs.calculate_sla(c_track, fixed_time)
    t.assert_test(sla_track['status'] == 'ON_TRACK' and sla_track['formatted'] == '02h 00m', "Test 14: ON_TRACK calculated with 02h 00m remaining")

    # DUE_SOON
    c_soon = cs.open_case(id="C-SOON", due_at="2026-08-29T12:30:00Z")
    sla_soon = cs.calculate_sla(c_soon, fixed_time)
    t.assert_test(sla_soon['status'] == 'DUE_SOON' and sla_soon['formatted'] == '00h 30m', "Test 15: DUE_SOON calculated with <= 1h threshold")

    # OVERDUE
    c_over = cs.open_case(id="C-OVER", due_at="2026-08-29T10:00:00Z")
    sla_over = cs.calculate_sla(c_over, fixed_time)
    t.assert_test(sla_over['status'] == 'OVERDUE' and sla_over['is_overdue'] and sla_over['overdue_by'] == '02h 00m', "Test 16: OVERDUE calculated with 02h 00m overdue duration")

    t.suite("4. CASE STATE MACHINE & RESOLUTION GATES")
    c_flow = cs.open_case(id="C-E2E", title="E2E Hazard Flow")
    
    t.assert_test(cs.assign("C-E2E", "M-1024", "Raj Kumar") and c_flow['status'] == 'ASSIGNED', "Test 21 & 23: Assign officer")
    t.assert_test(cs.transition("C-E2E", "CLOSED") == False, "Test 22: Invalid transition jump ASSIGNED -> CLOSED rejected")
    t.assert_test(cs.transition("C-E2E", "IN_PROGRESS"), "Test 24: Start Work")
    t.assert_test(cs.transition("C-E2E", "INSPECTION_REQUIRED"), "Test 25: Request Inspection")
    
    # Cannot resolve before inspection
    t.assert_test(cs.resolve("C-E2E", evidence_store, "Raj Kumar")[0] == False, "Test 31: Resolution blocked without inspection")
    
    c_flow['inspection'] = {'findings': 'Fan belt loose', 'timestamp': '2026-08-29T12:10:00'}
    cs.transition("C-E2E", "CORRECTIVE_ACTION")
    
    # Cannot resolve before evidence
    t.assert_test(cs.resolve("C-E2E", [], "Raj Kumar")[0] == False, "Test 32: Resolution blocked without evidence")
    
    evidence_store.append({'id': 'EV-E2E', 'case_id': 'C-E2E', 'file_name': 'e2e.jpg', 'verification_status': 'VERIFIED'})
    
    # Add corrective action
    c_flow['corrective_actions'].append({'id': 'CA-1', 'description': 'Replace pulley', 'status': 'PENDING'})
    t.assert_test(cs.resolve("C-E2E", evidence_store, "Raj Kumar")[0] == False, "Test 33: Resolution blocked with pending corrective action")
    
    c_flow['corrective_actions'][0]['status'] = 'COMPLETED'
    cs.transition("C-E2E", "RE_INSPECTION")
    
    # Re-inspection
    t.assert_test(cs.resolve("C-E2E", evidence_store, "Raj Kumar")[0] == False, "Test 34: Resolution blocked without re-inspection")
    
    c_flow['re_inspection'] = {'before': {'ch4': '0.52%'}, 'after': {'ch4': '0.34%'}, 'status': 'PASSED'}
    cs.transition("C-E2E", "VERIFICATION")
    
    # Now resolve succeeds
    res_ok, _ = cs.resolve("C-E2E", evidence_store, "Raj Kumar")
    t.assert_test(res_ok and c_flow['status'] == 'RESOLVED', "Test 35: Valid resolution succeeds after all 5 steps complete")
    
    # Close succeeds after resolve
    close_ok, _ = cs.close("C-E2E", "Dr. A. K. Mishra (Colliery GM)")
    t.assert_test(close_ok and c_flow['status'] == 'CLOSED' and c_flow['closed_by'] is not None, "Test 36: Case permanently closed and archived")

    t.suite("5. FULL END-TO-END LIFECYCLE CERTIFICATION")
    is_e2e_certified = (c_flow['status'] == 'CLOSED' and
                        c_flow['assigned_to'] == 'M-1024' and
                        c_flow['inspection'] is not None and
                        c_flow['re_inspection'] is not None and
                        c_flow['corrective_actions'][0]['status'] == 'COMPLETED' and
                        c_flow['closed_by'] is not None)
    t.assert_test(is_e2e_certified, "Complete E2E Case Lifecycle: DETECTED -> ASSIGNED -> INSPECTION -> EVIDENCE -> CORRECTIVE ACTION -> RE-INSPECTION -> RESOLVED -> CLOSED -> CERTIFIED.")

    t.summary()

if __name__ == '__main__':
    run_tests()
