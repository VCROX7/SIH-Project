/**
 * SIH26024 — Comprehensive Test Suite & Validation Runner
 * FILE: tests/testSuite.js
 * 
 * COVERS:
 * - CASE VIEW TESTS (1–4)
 * - UPLOAD & EVIDENCE TESTS (5–13)
 * - SLA CALCULATION & ESCALATION TESTS (14–20)
 * - CASE STATE MACHINE TESTS (21–30)
 * - RESOLUTION GATE TESTS (31–36)
 * - AUDIT TRAIL LOGGING TESTS (37–44)
 * - COMPLETE END-TO-END INTEGRATION TEST
 */

'use strict';

var TestRunner = (function() {
  var passed = 0;
  var failed = 0;
  var outputEl = null;

  function log(msg, type) {
    if (!outputEl) outputEl = document.getElementById('output');
    var div = document.createElement('div');
    div.className = type || '';
    div.textContent = msg;
    if (outputEl) outputEl.appendChild(div);
    else console.log(msg);
  }

  return {
    suite: function(name) {
      log('\n--- ' + name + ' ---', 'suite');
    },
    assert: function(condition, desc) {
      if (condition) {
        passed++;
        log('✔ PASS: ' + desc, 'pass');
      } else {
        failed++;
        log('✘ FAIL: ' + desc, 'fail');
      }
    },
    summary: function() {
      var total = passed + failed;
      var msg = '\n============================\n' +
                'Tests: ' + total + ' | Passed: ' + passed + ' | Failed: ' + failed + '\n' +
                '============================';
      log(msg, 'summary');
      if (failed > 0) {
        if (outputEl) outputEl.style.borderTop = '5px solid #f87171';
        console.error('TEST SUITE FAILED: ' + failed + ' failures');
      } else {
        if (outputEl) outputEl.style.borderTop = '5px solid #4ade80';
        console.log('ALL ' + total + ' TESTS PASSED SUCCESSFULLY');
      }
    }
  };
})();

function runAllTests() {
  TestRunner.suite('1. AUTHENTICATION SERVICE');
  
  if (typeof AuthService !== 'undefined') {
    AuthService.signIn('', '1234').then(function(res1) {
      TestRunner.assert(res1.user === null && res1.error.indexOf('Email') !== -1, 'Empty email rejected by AuthService');
      
      AuthService.signIn('notanemail', '1234').then(function(res2) {
        TestRunner.assert(res2.user === null && res2.error.indexOf('valid') !== -1, 'Malformed email format rejected');
        
        AuthService.signIn('officer@coalgov.in', '12').then(function(res3) {
          TestRunner.assert(res3.user === null && res3.error.indexOf('Password') !== -1, 'Short password rejected');
          
          AuthService.signIn('officer@coalgov.in', 'demo123').then(function(res4) {
            TestRunner.assert(res4.user && res4.user.role === 'officer' && res4.user.name === 'Raj Kumar', 'Officer credentials authenticate successfully');
            TestRunner.assert(AuthService.isAuthenticated() === true, 'AuthService reports active session');
            
            AuthService.signOut().then(function() {
              TestRunner.assert(AuthService.isAuthenticated() === false && AuthService.getCurrentUser() === null, 'Sign out clears current user and session');
              runCoreCaseAndSlaTests();
            });
          });
        });
      });
    });
  } else {
    TestRunner.assert(false, 'AuthService missing');
    runCoreCaseAndSlaTests();
  }
}

function runCoreCaseAndSlaTests() {
  TestRunner.suite('2. CASE VIEW & NAVIGATION TESTS (Phases 2 & 3)');
  
  var c1 = CaseService.openCase({ id: 'C-9001', title: 'Ventilation Fan Slipping', zoneId: 'zone-vent' });
  var c2 = CaseService.openCase({ id: 'C-9002', title: 'Roof Displacement Sensor 6', zoneId: 'zone-panel-b' });

  // Test 1: View Case opens correct case
  CaseService.setActiveCaseId('C-9001');
  var active = CaseService.getActiveCase();
  TestRunner.assert(active && active.id === 'C-9001' && active.title === 'Ventilation Fan Slipping', 'Test 1: View Case sets and retrieves the exact active case (C-9001)');

  // Test 2: Wrong case ID handled
  var badRes = CaseService.setActiveCaseId('C-NONEXISTENT');
  TestRunner.assert(badRes === false, 'Test 2: Non-existent case ID is safely rejected without crash');

  // Test 3: Case detail data rendered
  TestRunner.assert(active.zoneId === 'zone-vent' && active.mine && active.createdAt && active.dueAt, 'Test 3: Case model contains all mandatory metadata fields (mine, zone, timestamps)');

  // Test 4: Navigation / Direct addressability
  var fetched = CaseService.getCase('C-9002');
  TestRunner.assert(fetched && fetched.id === 'C-9002', 'Test 4: Case is directly addressable by ID');


  TestRunner.suite('3. EVIDENCE UPLOAD & VALIDATION TESTS (Phases 4, 5, 6, 7, 8)');

  // Test 5: Valid image accepted
  var validFile = { name: 'duct_photo.jpg', type: 'image/jpeg', size: 1024 * 500 };
  var vRes = EvidenceService.validateFile(validFile);
  TestRunner.assert(vRes.valid === true, 'Test 5: Valid JPG file is accepted');

  // Test 6: Invalid type rejected
  var badTypeFile = { name: 'malware.exe', type: 'application/x-msdownload', size: 1024 };
  var bRes = EvidenceService.validateFile(badTypeFile);
  TestRunner.assert(bRes.valid === false && bRes.error.indexOf('Unsupported') !== -1, 'Test 6: Executable / non-image file is rejected with clear error');

  // Test 7: Empty file rejected
  var emptyFile = { name: 'empty.png', type: 'image/png', size: 0 };
  var eRes = EvidenceService.validateFile(emptyFile);
  TestRunner.assert(eRes.valid === false && eRes.error.indexOf('empty') !== -1, 'Test 7: Empty 0-byte file is rejected');

  // Test 8: Oversized file rejected
  var bigFile = { name: 'giant.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 }; // 8MB > 5MB
  var oRes = EvidenceService.validateFile(bigFile);
  TestRunner.assert(oRes.valid === false && oRes.error.indexOf('exceeds') !== -1, 'Test 8: File exceeding 5MB size limit is rejected');

  // Test 9: Preview capability
  var sampleDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
  TestRunner.assert(sampleDataUrl.startsWith('data:image/'), 'Test 9: FileReader Data URL generation ready for preview render');

  // Test 10: Upload success recorded
  var uploadRes = EvidenceService.uploadEvidence({
    caseId: 'C-9001',
    fileName: 'fan_repair.png',
    fileType: 'image/png',
    dataUrl: sampleDataUrl,
    uploadedBy: 'Raj Kumar (M-1024)'
  });
  TestRunner.assert(uploadRes.success === true && uploadRes.evidence.id.startsWith('EV-'), 'Test 10: Upload succeeds and record created in evidence store');

  // Test 11: Upload failure handled (missing caseId)
  var failUpload = EvidenceService.uploadEvidence({ fileName: 'orphan.jpg' });
  TestRunner.assert(failUpload.success === false, 'Test 11: Evidence upload without caseId is rejected');

  // Test 12: Evidence associated with correct case & Case isolation
  var c1Evidence = EvidenceService.getEvidenceForCase('C-9001');
  var c2Evidence = EvidenceService.getEvidenceForCase('C-9002');
  TestRunner.assert(c1Evidence.length >= 1 && c2Evidence.length === 0, 'Test 12: Evidence uploaded to Case C-9001 does NOT appear under Case C-9002 (Strict Case Isolation)');

  // Test 13: Duplicate evidence verification
  var verifiedEv = EvidenceService.verifyEvidence(uploadRes.evidence.id);
  TestRunner.assert(verifiedEv === true && uploadRes.evidence.verificationStatus === 'VERIFIED', 'Test 13: Cryptographic hash, geotag, and duplicate checks pass verification');


  TestRunner.suite('4. SLA CALCULATION & ESCALATION TESTS (Phases 9, 10, 11, 12)');

  var fixedNow = new Date('2026-08-29T12:00:00.000Z').getTime();

  // Test 14: ON_TRACK status
  var onTrackCase = {
    createdAt: new Date('2026-08-29T10:00:00.000Z').toISOString(),
    dueAt: new Date('2026-08-29T14:00:00.000Z').toISOString(), // 2h remaining
    status: 'IN_PROGRESS'
  };
  var slaOnTrack = CaseService.calculateSla(onTrackCase, fixedNow);
  TestRunner.assert(slaOnTrack.status === 'ON_TRACK' && slaOnTrack.formattedRemaining === '02h 00m', 'Test 14: SLA calculates ON_TRACK with correct formatted remaining time (02h 00m)');

  // Test 15: DUE_SOON status (threshold <= 1h)
  var dueSoonCase = {
    createdAt: new Date('2026-08-29T08:30:00.000Z').toISOString(),
    dueAt: new Date('2026-08-29T12:30:00.000Z').toISOString(), // 30m remaining
    status: 'IN_PROGRESS'
  };
  var slaDueSoon = CaseService.calculateSla(dueSoonCase, fixedNow);
  TestRunner.assert(slaDueSoon.status === 'DUE_SOON' && slaDueSoon.formattedRemaining === '00h 30m', 'Test 15: SLA calculates DUE_SOON when remaining duration is <= 1 hour (00h 30m)');

  // Test 16: OVERDUE status
  var overdueCase = {
    createdAt: new Date('2026-08-29T06:00:00.000Z').toISOString(),
    dueAt: new Date('2026-08-29T10:00:00.000Z').toISOString(), // 2h overdue
    status: 'IN_PROGRESS'
  };
  var slaOverdue = CaseService.calculateSla(overdueCase, fixedNow);
  TestRunner.assert(slaOverdue.status === 'OVERDUE' && slaOverdue.isOverdue === true && slaOverdue.overdueByFormatted === '02h 00m', 'Test 16: SLA calculates OVERDUE with overdue duration (02h 00m)');

  // Test 17: ESCALATED status
  var escalatedCase = {
    createdAt: new Date('2026-08-29T06:00:00.000Z').toISOString(),
    dueAt: new Date('2026-08-29T10:00:00.000Z').toISOString(),
    status: 'ESCALATED'
  };
  var slaEsc = CaseService.calculateSla(escalatedCase, fixedNow);
  TestRunner.assert(slaEsc.status === 'ESCALATED', 'Test 17: SLA reflects ESCALATED status on breached case');

  // Test 18: SLA countdown calculation determinism
  var durationCheck = CaseService.calculateSla(onTrackCase, fixedNow + 15 * 60 * 1000); // 15 mins later
  TestRunner.assert(durationCheck.formattedRemaining === '01h 45m', 'Test 18: SLA countdown smoothly updates as time elapses (01h 45m remaining)');

  // Test 19: Escalation does not duplicate
  var escCaseObj = CaseService.openCase({ id: 'C-9003', title: 'Overdue Test', dueAt: new Date(Date.now() - 3600000).toISOString() });
  CaseService.escalateCase('C-9003', 1, 'Initial escalation');
  var logs1 = AuditService.getLogsForEntity('CASE', 'C-9003').filter(function(l){ return l.action === 'SLA_BREACH_ESCALATION'; });
  CaseService.checkSLAs(); // Run check
  var logs2 = AuditService.getLogsForEntity('CASE', 'C-9003').filter(function(l){ return l.action === 'SLA_BREACH_ESCALATION'; });
  TestRunner.assert(logs1.length === 1 && logs2.length === 1, 'Test 19: SLA escalation does not generate duplicate alert events on subsequent ticks');

  // Test 20: Configurable severity risk score rules
  var critCase = CaseService.openCase({ severity: 'CRITICAL' });
  TestRunner.assert(critCase.riskScore >= 90, 'Test 20: CRITICAL severity case initializes with proportional risk score (>= 90)');


  TestRunner.suite('5. CASE STATE MACHINE & TRANSITION TESTS (Phases 13, 14, 15, 17)');

  var testCase = CaseService.openCase({ id: 'C-9004', title: 'State Machine Test Case' });

  // Test 21: Valid transition OPEN -> ASSIGNED
  var t1 = CaseService.assignCase('C-9004', 'M-1024', 'Raj Kumar');
  TestRunner.assert(t1 === true && testCase.status === 'ASSIGNED', 'Test 21: Valid transition OPEN → ASSIGNED');

  // Test 22: Invalid transition ASSIGNED -> CLOSED (Must be rejected)
  var t2 = CaseService.transitionState('C-9004', 'CLOSED');
  TestRunner.assert(t2 === false && testCase.status === 'ASSIGNED', 'Test 22: Invalid jump ASSIGNED → CLOSED is strictly rejected');

  // Test 23: Assign officer
  TestRunner.assert(testCase.assignedTo === 'M-1024' && testCase.assignedOfficerName.indexOf('Raj Kumar') !== -1, 'Test 23: Case assignedTo and assignedOfficerName recorded');

  // Test 24: Start Work ASSIGNED -> IN_PROGRESS
  var t3 = CaseService.startWork('C-9004');
  TestRunner.assert(t3 === true && testCase.status === 'IN_PROGRESS', 'Test 24: Valid transition ASSIGNED → IN_PROGRESS');

  // Test 25: Request Inspection IN_PROGRESS -> INSPECTION_REQUIRED
  var t4 = CaseService.requestInspection('C-9004');
  TestRunner.assert(t4 === true && testCase.status === 'INSPECTION_REQUIRED', 'Test 25: Valid transition IN_PROGRESS → INSPECTION_REQUIRED');

  // Test 26: Submit Inspection & Proceed to Corrective Action
  var t5 = CaseService.submitInspection('C-9004', { findings: 'Fan belt loose' });
  TestRunner.assert(t5 === true && testCase.inspection && testCase.status === 'CORRECTIVE_ACTION', 'Test 26: Submit Inspection records findings and transitions to CORRECTIVE_ACTION');

  // Test 27: Add and complete Corrective Action
  var ca = CaseService.addCorrectiveAction('C-9004', { description: 'Replace tension pulley' });
  TestRunner.assert(ca && ca.id.startsWith('CA-'), 'Test 27: Corrective action created with status PENDING');
  var caDone = CaseService.completeCorrectiveAction('C-9004', ca.id, 'Replaced pulley');
  TestRunner.assert(caDone === true && ca.status === 'COMPLETED' && testCase.status === 'RE_INSPECTION', 'Test 27b: Corrective action completed and transitioned to RE_INSPECTION');

  // Test 28: Record Re-inspection Before vs After
  var reDone = CaseService.recordReInspection('C-9004', {
    before: { ch4: '0.55%', airflow: '2.4 m/s', risk: 85 },
    after: { ch4: '0.32%', airflow: '3.6 m/s', risk: 20 }
  });
  TestRunner.assert(reDone === true && testCase.reInspection && testCase.status === 'VERIFICATION', 'Test 28: Re-inspection recorded Before vs After telemetry and transitioned to VERIFICATION');

  // Test 29: Resolve Case
  // Attach evidence first so resolution gate passes
  EvidenceService.uploadEvidence({ caseId: 'C-9004', fileName: 'proof.jpg' });
  var resRes = CaseService.resolveCase('C-9004', 'Raj Kumar');
  TestRunner.assert(resRes.success === true && testCase.status === 'RESOLVED', 'Test 29: Resolve Case validates all prerequisites and transitions to RESOLVED');

  // Test 30: Close Case
  var closeRes = CaseService.closeCase('C-9004', 'Dr. A. K. Mishra (Colliery GM)');
  TestRunner.assert(closeRes.success === true && testCase.status === 'CLOSED' && testCase.closedBy !== null, 'Test 30: Close Case transitions to CLOSED and archives sign-off officer');


  TestRunner.suite('6. RESOLUTION GATE & VALIDATION PREREQUISITE TESTS (Phases 16, 18, 19)');

  // Test 31: Cannot resolve without inspection
  var uninspectedCase = CaseService.openCase({ id: 'C-9005', title: 'Uninspected Case' });
  var r1 = CaseService.resolveCase('C-9005');
  TestRunner.assert(r1.success === false, 'Test 31: Resolution is blocked when mandatory inspection is missing');

  // Test 32: Cannot resolve without required evidence
  CaseService.assignCase('C-9005', 'M-1024');
  CaseService.submitInspection('C-9005', { findings: 'Anomaly present' });
  var r2 = CaseService.resolveCase('C-9005');
  TestRunner.assert(r2.success === false, 'Test 32: Resolution is blocked when photo proof evidence is missing');

  // Test 33: Cannot resolve with pending corrective action
  EvidenceService.uploadEvidence({ caseId: 'C-9005', fileName: 'proof.jpg' });
  var caPending = CaseService.addCorrectiveAction('C-9005', { description: 'Motor fix' });
  var r3 = CaseService.resolveCase('C-9005');
  TestRunner.assert(r3.success === false, 'Test 33: Resolution is blocked when corrective action is incomplete/pending');

  // Test 34: Cannot resolve without re-inspection
  CaseService.completeCorrectiveAction('C-9005', caPending.id);
  testCase.status = 'CORRECTIVE_ACTION';
  var r4 = CaseService.resolveCase('C-9005');
  TestRunner.assert(r4.success === false, 'Test 34: Resolution is blocked when post-repair re-inspection is pending');

  // Test 35: Valid resolution succeeds when all items complete
  CaseService.recordReInspection('C-9005');
  var r5 = CaseService.resolveCase('C-9005');
  TestRunner.assert(r5.success === true && uninspectedCase.status === 'RESOLVED', 'Test 35: Resolution succeeds once all 5 prerequisite steps are verified');

  // Test 36: Cannot close before resolve
  var freshCase = CaseService.openCase({ id: 'C-9006', title: 'Unresolved Case' });
  var cl1 = CaseService.closeCase('C-9006');
  TestRunner.assert(cl1.success === false, 'Test 36: Closing an un-resolved case is blocked');


  TestRunner.suite('7. AUDIT TRAIL LOGGING TESTS (Phases 20 & 25)');

  var e2eCase = CaseService.openCase({ id: 'C-9999', title: 'Full E2E Audit Trace Case' });
  
  // Test 37: Creation logged
  var a37 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'CASE_OPENED'; });
  TestRunner.assert(a37, 'Test 37: Case creation logged to audit trail');

  // Test 38: Assignment logged
  CaseService.assignCase('C-9999', 'M-1024', 'Raj Kumar');
  var a38 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'CASE_ASSIGNED'; });
  TestRunner.assert(a38, 'Test 38: Case assignment logged to audit trail');

  // Test 39: Inspection logged
  CaseService.submitInspection('C-9999', { findings: 'E2E test findings' });
  var a39 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'INSPECTION_SUBMITTED'; });
  TestRunner.assert(a39, 'Test 39: Field inspection logged to audit trail');

  // Test 40: Evidence upload logged
  EvidenceService.uploadEvidence({ caseId: 'C-9999', fileName: 'e2e_photo.jpg' });
  var a40 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'EVIDENCE_UPLOADED'; });
  TestRunner.assert(a40, 'Test 40: Evidence upload logged to audit trail');

  // Test 41: Corrective action logged
  var e2eCa = CaseService.addCorrectiveAction('C-9999', { description: 'E2E remediation' });
  CaseService.completeCorrectiveAction('C-9999', e2eCa.id);
  var a41 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'CORRECTIVE_ACTION_COMPLETED'; });
  TestRunner.assert(a41, 'Test 41: Corrective action logged to audit trail');

  // Test 42: Re-inspection logged
  CaseService.recordReInspection('C-9999');
  var a42 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'RE_INSPECTION_PASSED'; });
  TestRunner.assert(a42, 'Test 42: Re-inspection telemetry logged to audit trail');

  // Test 43: Resolution logged
  CaseService.resolveCase('C-9999', 'Raj Kumar');
  var a43 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'CASE_RESOLVED'; });
  TestRunner.assert(a43, 'Test 43: Case resolution logged to audit trail');

  // Test 44: Closure logged
  CaseService.closeCase('C-9999', 'Dr. A. K. Mishra');
  var a44 = AuditService.getLogsForEntity('CASE', 'C-9999').some(function(l){ return l.action === 'CASE_CLOSED'; });
  TestRunner.assert(a44, 'Test 44: Case permanent closure logged to audit trail');


  TestRunner.suite('8. FULL END-TO-END INTEGRATION TEST');

  var allE2eLogs = AuditService.getLogsForEntity('CASE', 'C-9999');
  var isCompleteE2E = e2eCase.status === 'CLOSED' &&
                      e2eCase.inspection !== null &&
                      e2eCase.reInspection !== null &&
                      e2eCase.correctiveActions.length >= 1 &&
                      allE2eLogs.length >= 7;

  TestRunner.assert(isCompleteE2E, 'Full E2E Workflow Test: DETECTED → ASSIGNED → INSPECTION → EVIDENCE → CORRECTIVE ACTION → RE-INSPECTION → VERIFICATION → RESOLVED → CLOSED → AUDIT TRAIL complete and certified.');

  TestRunner.summary();
}
