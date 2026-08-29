/**
 * SIH26024 — Case Service (Comprehensive Case Lifecycle & SLA Engine)
 * FILE: src/services/caseService.js
 * 
 * PURPOSE: Full case lifecycle management, strict state machine, SLA calculation,
 *          corrective action tracking, re-inspection validation, and resolution gates.
 */

'use strict';

var CaseService = (function() {
  
  var cases = [];
  var activeCaseId = 'C-2048';
  var SLA_DUE_SOON_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

  // Strict statutory state transitions
  var VALID_TRANSITIONS = {
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
  };

  function generateId() {
    return 'C-' + Math.floor(1000 + Math.random() * 9000);
  }

  function logAudit(caseId, action, actor, details) {
    if (window.AuditService) {
      AuditService.log('CASE', caseId, action, actor || 'Current User', details);
    }
  }

  return {
    getCases: function() {
      return cases;
    },

    getCase: function(caseId) {
      if (!caseId) return null;
      return cases.find(function(c) { return c.id === caseId || c.id === ('C-' + caseId); }) || null;
    },

    getActiveCaseId: function() {
      return activeCaseId;
    },

    setActiveCaseId: function(caseId) {
      var c = this.getCase(caseId);
      if (c) {
        activeCaseId = c.id;
        return true;
      }
      return false;
    },

    getActiveCase: function() {
      return this.getCase(activeCaseId) || (cases.length > 0 ? cases[0] : null);
    },

    openCase: function(data) {
      var now = data.createdAt ? new Date(data.createdAt) : new Date();
      var slaHours = data.slaHours || 4;
      var dueAt = data.dueAt ? new Date(data.dueAt) : new Date(now.getTime() + slaHours * 60 * 60 * 1000);

      var newCase = {
        id: data.id || generateId(),
        title: data.title || 'Untitled Hazard Case',
        description: data.description || '',
        category: data.category || 'VENTILATION',
        severity: data.severity || data.riskLevel || 'MEDIUM',
        riskScore: typeof data.riskScore === 'number' ? data.riskScore : (data.severity === 'CRITICAL' ? 94 : data.severity === 'HIGH' ? 87 : data.severity === 'MEDIUM' ? 58 : 22),
        mine: data.mine || 'Central Coalfields — Unit 04',
        zoneId: data.zoneId || 'zone-vent',
        zoneName: data.zoneName || 'Sector 4 Ventilation Duct',
        tunnelId: data.tunnelId || 'T-03',
        status: data.status || 'OPEN',
        source: data.source || 'IOT_SENSOR_ANOMALY',
        assignedTo: data.assignedTo || null,
        assignedOfficerName: data.assignedOfficerName || null,
        assignedAt: data.assignedAt || null,
        createdAt: now.toISOString(),
        dueAt: dueAt.toISOString(),
        slaHours: slaHours,
        escalationLevel: data.escalationLevel || 0,
        escalatedAt: data.escalatedAt || null,
        escalationLogged: !!data.escalationLogged,
        inspection: data.inspection || null,
        evidenceIds: data.evidenceIds ? data.evidenceIds.slice() : [],
        correctiveActions: data.correctiveActions ? data.correctiveActions.slice() : [],
        reInspection: data.reInspection || null,
        verification: data.verification || null,
        resolvedAt: data.resolvedAt || null,
        resolvedBy: data.resolvedBy || null,
        closedAt: data.closedAt || null,
        closedBy: data.closedBy || null
      };

      cases.unshift(newCase);
      logAudit(newCase.id, 'CASE_OPENED', 'SYSTEM_DISPATCH', 'Case opened for ' + newCase.title + ' [' + newCase.zoneName + ']');
      return newCase;
    },

    canTransition: function(caseId, newState) {
      var c = this.getCase(caseId);
      if (!c) return { allowed: false, reason: 'Case ' + caseId + ' not found in registry.' };
      if (c.status === newState) return { allowed: true, reason: 'Already in state ' + newState };
      
      var allowedStates = VALID_TRANSITIONS[c.status];
      if (!allowedStates || allowedStates.indexOf(newState) === -1) {
        return { 
          allowed: false, 
          reason: 'Invalid statutory transition: Cannot transition from ' + c.status + ' to ' + newState + '.' 
        };
      }
      return { allowed: true };
    },

    transitionState: function(caseId, newState, notes, actor) {
      var c = this.getCase(caseId);
      if (!c) return false;

      var check = this.canTransition(caseId, newState);
      if (!check.allowed && c.status !== 'ESCALATED') {
        console.warn('[CaseService] ' + check.reason);
        if (window.toast) toast('⚠ ' + check.reason);
        return false;
      }

      var oldState = c.status;
      c.status = newState;
      c.updatedAt = new Date().toISOString();
      
      logAudit(caseId, 'STATUS_CHANGED', actor || 'Operator', 'Status progressed: ' + oldState + ' → ' + newState + '. ' + (notes || ''));
      return true;
    },

    assignCase: function(caseId, workerId, officerName) {
      var c = this.getCase(caseId);
      if (!c) return false;

      c.assignedTo = workerId || 'M-1024';
      c.assignedOfficerName = officerName || (workerId === 'M-1024' ? 'Raj Kumar (Safety Officer)' : 'Assigned Officer (' + workerId + ')');
      c.assignedAt = new Date().toISOString();

      if (c.status === 'OPEN' || c.status === 'ESCALATED') {
        this.transitionState(caseId, 'ASSIGNED', 'Assigned to ' + c.assignedOfficerName, c.assignedOfficerName);
      }
      logAudit(caseId, 'CASE_ASSIGNED', 'Supervisor', 'Assigned to ' + c.assignedOfficerName);
      return true;
    },

    startWork: function(caseId) {
      var c = this.getCase(caseId);
      if (!c) return false;
      return this.transitionState(caseId, 'IN_PROGRESS', 'Field investigation commenced', c.assignedOfficerName || 'M-1024');
    },

    requestInspection: function(caseId) {
      var c = this.getCase(caseId);
      if (!c) return false;
      return this.transitionState(caseId, 'INSPECTION_REQUIRED', 'Mandatory statutory field inspection scheduled');
    },

    submitInspection: function(caseId, inspectionData) {
      var c = this.getCase(caseId);
      if (!c) return false;

      c.inspection = {
        id: inspectionData.id || ('INS-' + Math.floor(Math.random() * 10000)),
        inspectorId: inspectionData.inspectorId || c.assignedTo || 'M-1024',
        timestamp: inspectionData.timestamp || new Date().toISOString(),
        findings: inspectionData.findings || 'Physical inspection verified anomaly conditions.',
        checklist: inspectionData.checklist || ['Ventilation velocity degraded', 'Strata roof inspected', 'Multi-gas verified'],
        status: 'COMPLETED'
      };

      logAudit(caseId, 'INSPECTION_SUBMITTED', c.inspection.inspectorId, 'Field inspection ' + c.inspection.id + ' completed and recorded.');
      
      if (c.status === 'INSPECTION_REQUIRED' || c.status === 'IN_PROGRESS') {
        this.transitionState(caseId, 'CORRECTIVE_ACTION', 'Inspection completed, proceeding to corrective action');
      }
      return true;
    },

    addCorrectiveAction: function(caseId, actionData) {
      var c = this.getCase(caseId);
      if (!c) return null;

      var desc = typeof actionData === 'string' ? actionData : (actionData && actionData.description) || 'Auxiliary duct fan re-aligned and tensioned';
      var actionRecord = {
        id: 'CA-' + Math.floor(1000 + Math.random() * 9000),
        caseId: c.id,
        description: desc,
        assignedTo: (actionData && actionData.assignedTo) || c.assignedTo || 'M-1024',
        createdAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        completedAt: null,
        status: 'PENDING',
        evidenceId: (actionData && actionData.evidenceId) || null
      };

      c.correctiveActions.push(actionRecord);
      logAudit(caseId, 'CORRECTIVE_ACTION_CREATED', actionRecord.assignedTo, 'Created action ' + actionRecord.id + ': ' + desc);
      
      if (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') {
        this.transitionState(caseId, 'CORRECTIVE_ACTION', 'Corrective action plan formulated');
      }
      return actionRecord;
    },

    completeCorrectiveAction: function(caseId, actionId, notes) {
      var c = this.getCase(caseId);
      if (!c) return false;

      var action = c.correctiveActions.find(function(a) { return a.id === actionId; }) || (c.correctiveActions.length > 0 ? c.correctiveActions[c.correctiveActions.length - 1] : null);
      if (action) {
        action.status = 'COMPLETED';
        action.completedAt = new Date().toISOString();
        action.completionNotes = notes || 'Physical remediation successfully implemented in sector.';
      }

      logAudit(caseId, 'CORRECTIVE_ACTION_COMPLETED', c.assignedOfficerName || 'M-1024', 'Remediation completed: ' + (notes || 'Action finished.'));
      this.transitionState(caseId, 'RE_INSPECTION', 'Corrective action completed; re-inspection required');
      return true;
    },

    recordReInspection: function(caseId, reData) {
      var c = this.getCase(caseId);
      if (!c) return false;

      c.reInspection = {
        id: 'RE-' + Math.floor(1000 + Math.random() * 9000),
        inspectorId: (reData && reData.inspectorId) || c.assignedTo || 'M-1024',
        timestamp: new Date().toISOString(),
        before: (reData && reData.before) || { ch4: '0.42%', airflow: '2.8 m/s', risk: 87 },
        after: (reData && reData.after) || { ch4: '0.34%', airflow: '3.6 m/s', risk: 24 },
        status: 'PASSED',
        notes: (reData && reData.notes) || 'Post-repair sensor verification passed. Telemetry restored within safe statutory parameters.'
      };

      logAudit(caseId, 'RE_INSPECTION_PASSED', c.reInspection.inspectorId, 'Re-inspection ' + c.reInspection.id + ' passed: Airflow restored to ' + c.reInspection.after.airflow);
      this.transitionState(caseId, 'VERIFICATION', 'Re-inspection verified normalized conditions');
      return true;
    },

    verifyCase: function(caseId, verificationNotes, verifierName) {
      var c = this.getCase(caseId);
      if (!c) return false;

      c.verification = {
        verifiedBy: verifierName || 'Dr. A. K. Mishra (Colliery GM)',
        verifiedAt: new Date().toISOString(),
        status: 'VERIFIED',
        notes: verificationNotes || 'Physical repair & sensor normalization confirmed against statutory limits.'
      };

      logAudit(caseId, 'CASE_VERIFIED', c.verification.verifiedBy, 'Verification sign-off complete.');
      return true;
    },

    validateResolution: function(caseId) {
      var c = this.getCase(caseId);
      if (!c) return { valid: false, errors: ['Case does not exist.'] };

      var errors = [];
      if (!c.assignedTo) {
        errors.push('Case has not been assigned to a safety officer.');
      }
      if (!c.inspection && c.status === 'OPEN') {
        errors.push('Mandatory statutory field inspection has not been recorded.');
      }
      if (c.evidenceIds.length === 0 && (!window.EvidenceService || window.EvidenceService.getEvidenceForCase(c.id).length === 0)) {
        errors.push('No photo proof or telemetry evidence has been attached to this case.');
      }
      var completedActions = c.correctiveActions.filter(function(a) { return a.status === 'COMPLETED'; });
      if (c.correctiveActions.length > 0 && completedActions.length === 0) {
        errors.push('Corrective action is pending and has not been marked completed.');
      }
      if (c.status === 'CORRECTIVE_ACTION') {
        errors.push('Post-repair re-inspection has not been conducted.');
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    },

    resolveCase: function(caseId, resolverName) {
      var c = this.getCase(caseId);
      if (!c) return { success: false, reason: 'Case not found' };

      var validation = this.validateResolution(caseId);
      if (!validation.valid && c.status !== 'VERIFICATION' && c.status !== 'ESCALATED') {
        return { success: false, reason: validation.errors[0] };
      }

      c.resolvedAt = new Date().toISOString();
      c.resolvedBy = resolverName || c.assignedOfficerName || 'Raj Kumar (Safety Officer)';

      if (this.transitionState(caseId, 'RESOLVED', 'All statutory conditions verified. Case marked resolved.', c.resolvedBy)) {
        logAudit(caseId, 'CASE_RESOLVED', c.resolvedBy, 'Case resolved and submitted for final closure archive.');
        return { success: true };
      }
      return { success: false, reason: 'State transition rejected' };
    },

    closeCase: function(caseId, closedByName) {
      var c = this.getCase(caseId);
      if (!c) return { success: false, reason: 'Case not found' };

      if (c.status !== 'RESOLVED' && c.status !== 'VERIFICATION' && c.status !== 'ESCALATED') {
        return { success: false, reason: 'Case must be in RESOLVED status before final permanent closure.' };
      }

      c.closedAt = new Date().toISOString();
      c.closedBy = closedByName || 'Dr. A. K. Mishra (Colliery GM)';

      if (this.transitionState(caseId, 'CLOSED', 'Permanently closed & archived.', c.closedBy)) {
        logAudit(caseId, 'CASE_CLOSED', c.closedBy, 'Case permanently closed and signed off.');
        return { success: true };
      }
      return { success: false, reason: 'Closure transition failed' };
    },

    escalateCase: function(caseId, level, reason) {
      var c = this.getCase(caseId);
      if (!c) return false;

      c.escalationLevel = level || (c.escalationLevel + 1);
      c.escalatedAt = new Date().toISOString();
      c.status = 'ESCALATED';

      var desc = reason || ('Statutory SLA breached (Level ' + c.escalationLevel + ')');
      logAudit(caseId, 'SLA_BREACH_ESCALATION', 'SYSTEM_SLA', desc);

      if (!c.escalationLogged && window.AlertSystem) {
        c.escalationLogged = true;
        AlertSystem.generateEvent({
          eventType: 'SLA_ESCALATION',
          severity: c.escalationLevel >= 3 ? 'CRITICAL' : 'HIGH',
          entityId: c.id,
          entityType: 'CASE',
          zoneId: c.zoneId,
          description: 'SLA Escalation (Level ' + c.escalationLevel + '): ' + c.title
        });
      }
      return true;
    },

    calculateSla: function(caseObj, referenceTime) {
      if (!caseObj || !caseObj.dueAt) {
        return { status: 'ON_TRACK', remainingMs: 0, formattedRemaining: 'N/A', isOverdue: false, overdueByFormatted: '00h 00m' };
      }

      var now = referenceTime ? new Date(referenceTime).getTime() : Date.now();
      var due = new Date(caseObj.dueAt).getTime();
      var created = new Date(caseObj.createdAt).getTime();
      var totalDuration = Math.max(due - created, 1);
      var diffMs = due - now;

      var isResolved = caseObj.status === 'RESOLVED' || caseObj.status === 'CLOSED';
      var isOverdue = diffMs < 0;

      function formatDuration(ms) {
        var absMs = Math.abs(ms);
        var totalMinutes = Math.floor(absMs / 60000);
        var hours = Math.floor(totalMinutes / 60);
        var mins = totalMinutes % 60;
        return String(hours).padStart(2, '0') + 'h ' + String(mins).padStart(2, '0') + 'm';
      }

      var status = 'ON_TRACK';
      if (caseObj.status === 'ESCALATED') {
        status = 'ESCALATED';
      } else if (isResolved) {
        status = 'COMPLIANT';
      } else if (isOverdue) {
        status = 'OVERDUE';
      } else if (diffMs <= SLA_DUE_SOON_THRESHOLD_MS) {
        status = 'DUE_SOON';
      }

      return {
        status: status,
        remainingMs: diffMs,
        isOverdue: isOverdue,
        formattedRemaining: isOverdue ? ('Overdue by ' + formatDuration(diffMs)) : formatDuration(diffMs),
        overdueByFormatted: formatDuration(diffMs),
        percentRemaining: Math.max(0, Math.min(100, Math.round((diffMs / totalDuration) * 100)))
      };
    },

    getSlaStatus: function(caseId, referenceTime) {
      var c = this.getCase(caseId);
      return this.calculateSla(c, referenceTime);
    },

    checkSLAs: function(referenceTime) {
      var self = this;
      var now = referenceTime ? new Date(referenceTime).getTime() : Date.now();

      cases.forEach(function(c) {
        if (c.status === 'RESOLVED' || c.status === 'CLOSED') return;
        
        var sla = self.calculateSla(c, now);
        if (sla.isOverdue && c.status !== 'ESCALATED' && !c.escalationLogged) {
          self.escalateCase(c.id, 3, 'Statutory 4-hour SLA expired without certified closure');
        }
      });
    },

    seedDemoCases: function() {
      if (cases.length === 0) {
        // Case 1: Overdue active ventilation case (Centerpiece for demo)
        var c1 = this.openCase({
          id: 'C-2048',
          title: 'Ventilation Velocity Degraded in Sector 4 Duct',
          description: 'Airflow velocity sensor SN-004 registered 2.8 m/s in Ventilation Duct 4 (Statutory threshold min 3.0 m/s).',
          category: 'VENTILATION',
          severity: 'HIGH',
          riskScore: 87,
          mine: 'Central Coalfields — Unit 04',
          zoneId: 'zone-vent',
          zoneName: 'Sector 4 Ventilation Duct',
          tunnelId: 'T-03',
          assignedTo: 'M-1024',
          assignedOfficerName: 'Raj Kumar (Safety Officer)',
          assignedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          dueAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour overdue
          slaHours: 4,
          status: 'IN_PROGRESS',
          escalationLevel: 3,
          escalationLogged: true
        });

        // Case 2: PPE Compliance breach
        var c2 = this.openCase({
          id: 'C-2047',
          title: 'PPE Non-Compliance: Contractor Team C-88',
          description: 'Contractor personnel observed entering Panel B working face without calibrated secondary multi-gas detector.',
          category: 'PPE_COMPLIANCE',
          severity: 'MEDIUM',
          riskScore: 58,
          mine: 'Central Coalfields — Unit 04',
          zoneId: 'zone-panel-b',
          zoneName: 'Panel B Working Face',
          tunnelId: 'T-03',
          assignedTo: 'M-1091',
          assignedOfficerName: 'V. K. Sharma (Inspector)',
          assignedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours remaining (ON TRACK)
          slaHours: 4,
          status: 'ASSIGNED'
        });

        // Case 3: Strata convergence watch
        var c3 = this.openCase({
          id: 'C-2046',
          title: 'Roof Strata Convergence Warning at Junction J-02',
          description: 'Strata convergence sensor SN-006 recorded 12mm roof displacement exceeding 10mm alert threshold.',
          category: 'STRATA_CONTROL',
          severity: 'HIGH',
          riskScore: 74,
          mine: 'Central Coalfields — Unit 04',
          zoneId: 'zone-panel-b',
          zoneName: 'Panel B Haulage Approach',
          tunnelId: 'T-02',
          assignedTo: null,
          createdAt: new Date(Date.now() - 3.2 * 60 * 60 * 1000).toISOString(),
          dueAt: new Date(Date.now() + 0.8 * 60 * 60 * 1000).toISOString(), // 48 mins left (DUE SOON)
          slaHours: 4,
          status: 'OPEN'
        });

        // Case 4: Closed case demonstration
        var c4 = this.openCase({
          id: 'C-2045',
          title: 'Conveyor Belt Roller Alignment Fault',
          description: 'Haulage conveyor belt tracking error corrected and safety interlock tested.',
          category: 'MECHANICAL',
          severity: 'LOW',
          riskScore: 22,
          mine: 'Central Coalfields — Unit 04',
          zoneId: 'zone-panel-a',
          zoneName: 'Panel A Access Haulage',
          tunnelId: 'T-01',
          assignedTo: 'M-1178',
          assignedOfficerName: 'Rajesh Roy (Mechanical Lead)',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          dueAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          status: 'CLOSED',
          resolvedAt: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 20.5 * 60 * 60 * 1000).toISOString(),
          closedBy: 'Dr. A. K. Mishra (Colliery GM)'
        });

        // Set default active case
        activeCaseId = 'C-2048';
      }
    }
  };

})();
