/**
 * SIH26024 — Risk Engine (Prototype)
 * FILE: src/risk/riskEngine.js
 * 
 * PURPOSE: Computes a 0-100 risk score per zone based on active anomalies, 
 *          unresolved cases, and geofence events. Generates alerts when risk escalates.
 */

'use strict';

var RiskEngine = (function() {
  
  // Weights for different risk factors
  var WEIGHTS = {
    ANOMALY_CRITICAL: 40,
    ANOMALY_HIGH: 25,
    ANOMALY_MEDIUM: 10,
    OPEN_CASE_OVERDUE: 15,
    OPEN_CASE: 5,
    UNAUTHORIZED_ENTRY: 30
  };

  // State storage
  var zoneRiskHistory = {}; // { zoneId: { score, level, timestamp, notifiedLevel } }

  function getRiskLevel(score) {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
  }

  return {
    /**
     * Compute risk for a specific zone.
     * @param {string} zoneId 
     * @param {Array} anomalies - Active anomalies in this zone
     * @param {Array} cases - Open cases in this zone
     * @param {Array} recentEvents - Recent geofence events in this zone
     * @returns {Object} RiskAssessment
     */
    computeRisk: function(zoneId, anomalies, cases, recentEvents) {
      var score = 5; // Base risk
      var factors = [];

      // 1. Process Anomalies
      (anomalies || []).forEach(function(an) {
        var pts = WEIGHTS['ANOMALY_' + an.severity] || 0;
        score += pts;
        factors.push({
          label: 'Sensor Anomaly: ' + an.explanation,
          points: pts,
          severity: an.severity,
          category: 'SENSOR'
        });
      });

      // 2. Process Cases
      (cases || []).forEach(function(c) {
        // Simplified check for overdue. Real SLA tracking would be in CaseService
        var isOverdue = c.status === 'OVERDUE' || c.status === 'ESCALATED';
        var pts = isOverdue ? WEIGHTS.OPEN_CASE_OVERDUE : WEIGHTS.OPEN_CASE;
        score += pts;
        factors.push({
          label: 'Open Case: ' + c.title + (isOverdue ? ' (Overdue)' : ''),
          points: pts,
          severity: isOverdue ? 'HIGH' : 'MEDIUM',
          category: 'SLA'
        });
      });

      // 3. Process Recent Geofence Events (e.g. within last 5 mins)
      (recentEvents || []).forEach(function(ev) {
        if (ev.eventType === 'UNAUTHORIZED_ZONE_ENTRY') {
          score += WEIGHTS.UNAUTHORIZED_ENTRY;
          factors.push({
            label: 'Unauthorized Entry: ' + ev.entityId,
            points: WEIGHTS.UNAUTHORIZED_ENTRY,
            severity: 'HIGH',
            category: 'HISTORICAL'
          });
        }
      });

      score = Math.min(100, Math.max(0, score));
      var level = getRiskLevel(score);
      var now = new Date().toISOString();

      var assessment = {
        id: 'RA-' + Math.floor(Math.random() * 10000),
        zoneId: zoneId,
        computedAt: now,
        overallScore: score,
        riskLevel: level,
        factors: factors,
        isSimulated: true
      };

      // Check if we need to escalate and alert
      var previous = zoneRiskHistory[zoneId] || { notifiedLevel: 'LOW' };
      
      // If risk entered HIGH or CRITICAL, and we haven't alerted for this level recently
      if ((level === 'HIGH' || level === 'CRITICAL') && previous.notifiedLevel !== level) {
         if (window.AlertSystem) {
           var explanation = factors.map(function(f) { return f.label; }).join(', ');
           AlertSystem.generateEvent({
             eventType: 'RISK_ESCALATED',
             severity: level,
             entityId: 'ZONE-' + zoneId,
             entityType: 'ZONE',
             zoneId: zoneId,
             description: 'Zone risk escalated to ' + level + ' (' + score + '/100). Causes: ' + explanation
           });
         }
      }

      // Store history
      zoneRiskHistory[zoneId] = {
        score: score,
        level: level,
        timestamp: now,
        notifiedLevel: (level === 'HIGH' || level === 'CRITICAL') ? level : 'LOW'
      };

      return assessment;
    },

    getLatestAssessment: function(zoneId) {
       return zoneRiskHistory[zoneId] || null;
    }
  };

})();
