/**
 * SIH26024 — Audit Service (Prototype)
 * FILE: src/audit/auditService.js
 * 
 * PURPOSE: Immutable event logging for audit trail.
 */

'use strict';

var AuditService = (function() {
  
  var auditLogs = [];

  return {
    getLogs: function() {
      return auditLogs;
    },

    getLogsForEntity: function(entityType, entityId) {
      return auditLogs.filter(function(log) {
        return log.entityType === entityType && log.entityId === entityId;
      });
    },

    log: function(entityType, entityId, action, actor, details) {
      var entry = {
        id: 'AE-' + Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString(),
        entityType: entityType,
        entityId: entityId,
        action: action,
        actor: actor || 'SYSTEM',
        details: details || ''
      };
      
      auditLogs.push(entry);
      console.log('[AUDIT]', entry.timestamp, action, entityId, details);
      return entry;
    }
  };

})();
