/**
 * SIH26024 — Inspection Service (Prototype)
 * FILE: src/services/inspectionService.js
 * 
 * PURPOSE: Handles creation and offline queuing of field inspections.
 */

'use strict';

var InspectionService = (function() {
  
  var inspections = []; // Server-side in-memory mock

  return {
    getInspections: function() {
      return inspections;
    },

    saveOffline: function(inspectionData) {
      // Geo-tagging
      var loc = { method: 'SIMULATED' };
      if (window.SimulatedLocationProvider) {
         // mock picking up current user's location if available
         loc = { x: 500, y: 500, method: 'SIMULATED', zoneId: 'zone-vent' };
      }
      
      var record = {
        id: 'INS-' + Math.floor(Math.random()*10000),
        caseId: inspectionData.caseId || null,
        inspectorId: inspectionData.inspectorId || 'M-1024',
        timestamp: new Date().toISOString(),
        location: loc,
        status: 'QUEUED',
        findings: inspectionData.findings || {},
        isSimulated: true
      };

      var queue = JSON.parse(localStorage.getItem('mdt_inspection_queue') || '[]');
      queue.push(record);
      localStorage.setItem('mdt_inspection_queue', JSON.stringify(queue));
      
      if (window.AuditService && record.caseId) {
        AuditService.log('CASE', record.caseId, 'INSPECTION_QUEUED', record.inspectorId, 'Inspection saved offline for Case ' + record.caseId);
      }
      
      return record.id;
    },

    syncOffline: function() {
      var queue = JSON.parse(localStorage.getItem('mdt_inspection_queue') || '[]');
      if (queue.length === 0) return 0;
      
      var syncedCount = 0;
      queue.forEach(function(rec) {
         rec.status = 'SYNCED';
         inspections.push(rec);
         syncedCount++;
         
         if (rec.caseId && window.CaseService) {
            CaseService.transitionState(rec.caseId, 'INSPECTION_SUBMITTED', 'Inspection synced');
         }
         
         if (window.AuditService && rec.caseId) {
           AuditService.log('CASE', rec.caseId, 'INSPECTION_SYNCED', 'SYSTEM', 'Offline inspection ' + rec.id + ' successfully synced.');
         }
      });
      
      localStorage.setItem('mdt_inspection_queue', '[]');
      return syncedCount;
    },
    
    getOfflineQueueCount: function() {
      var queue = JSON.parse(localStorage.getItem('mdt_inspection_queue') || '[]');
      return queue.length;
    }
  };

})();
