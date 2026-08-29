/**
 * SIH26024 — Alert System
 * FILE: src/alerts/alertSystem.js
 * 
 * PURPOSE: Manages the lifecycle of SafetyEvents and Alerts.
 *          Integrates with GeofenceEngine and CaseService.
 */

'use strict';

var AlertSystem = (function() {
  
  var events = [];
  var alerts = [];
  
  var generateId = function(prefix) {
    return prefix + '-' + Math.floor(Math.random() * 1000000);
  };

  function updateAlertCounters() {
    var activeAlerts = alerts.filter(function(a) { return a.status === 'NEW'; });
    var criticalCount = activeAlerts.filter(function(a) { return a.severity === 'CRITICAL'; }).length;
    var highCount = activeAlerts.filter(function(a) { return a.severity === 'HIGH'; }).length;

    var navBtn = document.querySelector('button[data-page="alerts"]');
    if (navBtn) {
       var badge = navBtn.querySelector('.alert-badge');
       if (!badge) {
         badge = document.createElement('span');
         badge.className = 'alert-badge';
         navBtn.appendChild(badge);
       }
       if (activeAlerts.length > 0) {
         badge.textContent = activeAlerts.length;
         badge.style.display = 'inline-flex';
         if (criticalCount > 0) {
            badge.style.backgroundColor = 'var(--red)';
         } else if (highCount > 0) {
            badge.style.backgroundColor = 'var(--amber)';
         } else {
            badge.style.backgroundColor = 'var(--green)';
         }
       } else {
         badge.style.display = 'none';
       }
    }
    
    // Update the UI if we're on the alerts page
    if (typeof renderAlertCenter === 'function' && currentPageId === 'alerts') {
      renderAlertCenter();
    }
  }

  return {
    getAlerts: function() {
      return alerts;
    },

    generateEvent: function(eventData) {
      var event = {
        eventId: generateId('EVT'),
        eventType: eventData.eventType,
        severity: eventData.severity || 'LOW',
        entityId: eventData.entityId,
        entityType: eventData.entityType,
        zoneId: eventData.zoneId,
        timestamp: new Date().toISOString(),
        description: eventData.description,
        source: 'GEOFENCE'
      };
      
      events.push(event);
      console.log('[SafetyEvent]', event.eventType, event.description);

      // Promote to Alert if severity is HIGH or CRITICAL
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        this.createAlert(event);
      }
    },

    createAlert: function(event) {
      var alert = {
        alertId: generateId('ALT'),
        eventId: event.eventId,
        title: event.eventType.replace(/_/g, ' '),
        message: event.description,
        severity: event.severity,
        createdAt: event.timestamp,
        status: 'NEW',
        entityId: event.entityId,
        entityType: event.entityType,
        zoneId: event.zoneId,
        linkedCaseId: null
      };

      alerts.unshift(alert); // add to top
      
      // Toast notification for new alert
      toast('🚨 ' + alert.severity + ' ALERT: ' + alert.message);
      
      updateAlertCounters();
    },

    acknowledgeAlert: function(alertId, userName) {
      var alert = alerts.find(function(a) { return a.alertId === alertId; });
      if (alert && alert.status === 'NEW') {
        alert.status = 'ACKNOWLEDGED';
        alert.acknowledgedBy = userName || 'Current User';
        alert.acknowledgedAt = new Date().toISOString();
        updateAlertCounters();
        toast('Alert ' + alertId + ' acknowledged.');
      }
    },

    resolveAlert: function(alertId) {
      var alert = alerts.find(function(a) { return a.alertId === alertId; });
      if (alert && alert.status !== 'RESOLVED') {
        alert.status = 'RESOLVED';
        updateAlertCounters();
        toast('Alert ' + alertId + ' resolved.');
      }
    },

    openCaseForAlert: function(alertId) {
      var alert = alerts.find(function(a) { return a.alertId === alertId; });
      if (alert) {
        if (!alert.linkedCaseId) {
          alert.linkedCaseId = 'case-' + Math.floor(Math.random() * 10000);
          toast('Case #' + alert.linkedCaseId.replace('case-','') + ' created for alert.');
          updateAlertCounters();
        }
        // Navigate to cases page
        if (typeof showPage === 'function') {
           showPage('cases');
        }
      }
    },

    // For map integration
    viewOnMap: function(entityId, zoneId) {
      if (typeof showPage === 'function') {
        showPage('map');
      }
      if (typeof mdtHighlightEntity === 'function') {
        setTimeout(function() {
          mdtHighlightEntity(entityId, zoneId);
        }, 300); // Wait for transition
      }
    }
  };
})();
