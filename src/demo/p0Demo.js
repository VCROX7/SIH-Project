/**
 * SIH26024 — P0 End-to-End Demo Orchestrator
 * FILE: src/demo/p0Demo.js
 * 
 * PURPOSE: Provides a deterministic demo sequence for judges to witness the 
 *          entire data flow from Sensor Anomaly to Case Closure.
 */

'use strict';

var P0Demo = (function() {
  
  var state = {
    step: 0,
    activeCaseId: null,
    activeInspectionId: null,
    activeEvidenceId: null
  };

  function updateStatus(msg) {
    if (window.toast) toast('DEMO STEP ' + state.step + '/5: ' + msg);
    console.log('[P0 DEMO] Step ' + state.step + ': ' + msg);
  }

  return {
    reset: function() {
      state.step = 0;
      state.activeCaseId = null;
      state.activeInspectionId = null;
      state.activeEvidenceId = null;
      if (window.toast) toast('P0 Demo Reset');
    },

    nextStep: function() {
      state.step++;
      
      switch (state.step) {
        case 1:
          // Step 1: Sensor Anomaly -> Risk Increase -> High Alert
          updateStatus('Sensor Anomaly Detected');
          
          // Force a sensor anomaly by directly injecting into AlertSystem
          // (In a real running sim, RiskEngine handles this, but we force it here for deterministic demo)
          if (window.AlertSystem) {
             AlertSystem.generateEvent({
               eventType: 'SENSOR_ANOMALY',
               severity: 'HIGH',
               entityId: 'ZONE-zone-panel-b',
               entityType: 'ZONE',
               zoneId: 'zone-panel-b',
               description: 'Zone risk escalated to HIGH (87/100). Causes: Sensor Anomaly: METHANE spiked suddenly by +0.35'
             });
          }
          break;

        case 2:
          // Step 2: Case Created from Alert
          updateStatus('Converting Alert to Case & Assigning Officer');
          
          var alerts = (window.AlertSystem && AlertSystem.getAlerts()) || [];
          var highAlert = alerts.find(function(a) { return a.severity === 'HIGH' && a.status === 'NEW'; });
          
          if (highAlert && window.AlertSystem) {
             AlertSystem.openCaseForAlert(highAlert.alertId);
             // Find the newly created case
             var cases = (window.CaseService && CaseService.getCases()) || [];
             var newCase = cases[0];
             if (newCase) {
                state.activeCaseId = newCase.id;
                CaseService.assignCase(newCase.id, 'M-1024');
             }
          } else {
             if (window.toast) toast('Error: Could not find High Alert to convert.');
          }
          break;

        case 3:
          // Step 3: Offline Inspection
          updateStatus('Network OFFLINE. Saving Geo-tagged Inspection Locally.');
          
          if (!state.activeCaseId) {
             if (window.toast) toast('Error: No active case for inspection.');
             return;
          }

          if (window.CaseService) {
             CaseService.transitionState(state.activeCaseId, 'INSPECTION_REQUIRED', 'Officer arrived at location.');
          }

          if (window.InspectionService) {
             state.activeInspectionId = InspectionService.saveOffline({
                caseId: state.activeCaseId,
                inspectorId: 'M-1024',
                findings: { methaneFixed: false, notes: 'Valve loose, leaking methane.' }
             });
          }
          break;

        case 4:
          // Step 4: Network Restored -> Sync -> Evidence Upload & Verify
          updateStatus('Network Restored. Syncing Inspection & Verifying Evidence.');
          
          if (window.InspectionService) {
             InspectionService.syncOffline();
          }

          if (window.EvidenceService && state.activeCaseId) {
             state.activeEvidenceId = EvidenceService.uploadEvidence({
                caseId: state.activeCaseId,
                inspectionId: state.activeInspectionId,
                fileName: 'valve_leak_photo.jpg'
             });
             EvidenceService.verifyEvidence(state.activeEvidenceId);
          }
          break;

        case 5:
          // Step 5: Corrective Action -> Re-inspection -> Case Closed
          updateStatus('Corrective Action Applied. Case Verified & Closed.');
          
          if (window.CaseService && state.activeCaseId) {
             CaseService.addCorrectiveAction(state.activeCaseId, 'Tightened valve and verified airflow.');
             CaseService.transitionState(state.activeCaseId, 'VERIFICATION');
             CaseService.transitionState(state.activeCaseId, 'RESOLVED', 'Risk returned to Normal.');
             CaseService.transitionState(state.activeCaseId, 'CLOSED', 'Final sign-off complete.');
          }
          
          // Re-render UI if on cases page
          if (typeof renderCases === 'function' && document.getElementById('cases').classList.contains('active')) {
             renderCases();
          }
          
          break;

        default:
          updateStatus('Demo Complete. Check the Audit Trail.');
          state.step = 5;
          break;
      }
    }
  };

})();
