/**
 * SIH26024 — Geofence Engine
 * FILE: src/geofence/geofenceEngine.js
 * 
 * PURPOSE: Evaluates entity locations against mine zones to detect unauthorized entries,
 *          restricted zone breaches, and emergency presence.
 */

'use strict';

var GeofenceEngine = (function() {
  
  // Track the current zone of each entity to detect boundary crossings (deduplication)
  var entityState = {};
  // { 'M-1024': { currentZoneId: 'zone-panel-b', lastEvaluated: 'ISO_STRING' } }

  // A simple mapping of authorized zones for workers (Simulated data)
  var authorizedZones = {
    'M-1024': ['zone-panel-b', 'zone-main-tunnel', 'zone-maint', 'zone-vent'],
    'M-1091': ['zone-panel-b', 'zone-main-tunnel'],
    'M-1178': ['zone-panel-a', 'zone-main-tunnel'],
    'M-1204': ['zone-panel-c', 'zone-main-tunnel'],
    'M-1211': ['zone-vent', 'zone-main-tunnel']
  };

  /**
   * Determine severity of an event
   */
  function determineSeverity(eventType, zoneRiskLevel) {
    if (eventType === 'EMERGENCY_ZONE_ENTRY') return 'CRITICAL';
    if (eventType === 'UNAUTHORIZED_ZONE_ENTRY') return 'HIGH';
    if (zoneRiskLevel === 'CRITICAL') return 'CRITICAL';
    if (zoneRiskLevel === 'HIGH') return 'HIGH';
    if (zoneRiskLevel === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }

  return {
    /**
     * Evaluates an array of location objects against known zones.
     * Generates SafetyEvents via AlertSystem.
     * @param {Location[]} locations 
     */
    evaluate: function(locations) {
      if (!window.AlertSystem) {
        console.warn('GeofenceEngine: AlertSystem not found. Skipping evaluation.');
        return;
      }

      var now = new Date().toISOString();

      locations.forEach(function(loc) {
        var entityId = loc.entityId;
        var currentZoneId = loc.zoneId;
        
        var state = entityState[entityId] || { currentZoneId: null };
        var previousZoneId = state.currentZoneId;

        // Skip if there's no change in zone, unless we need to force re-evaluation
        if (currentZoneId === previousZoneId) {
          return;
        }

        // Entity has crossed a boundary
        var zoneDetails = MDT_ZONES.find(function(z) { return z.id === currentZoneId; });
        var prevZoneDetails = MDT_ZONES.find(function(z) { return z.id === previousZoneId; });

        // Left a zone
        if (previousZoneId && prevZoneDetails) {
          AlertSystem.generateEvent({
            eventType: 'ENTITY_LEFT_ZONE',
            severity: 'LOW',
            entityId: entityId,
            entityType: loc.entityType,
            zoneId: previousZoneId,
            description: entityId + ' left ' + prevZoneDetails.name
          });
        }

        // Entered a new zone
        if (currentZoneId && zoneDetails) {
          // Check for specific violations
          var eventType = 'ENTITY_ENTERED_ZONE';
          var description = entityId + ' entered ' + zoneDetails.name;
          
          if (zoneDetails.type === 'EMERGENCY' || zoneDetails.riskLevel === 'EMERGENCY') {
            eventType = 'EMERGENCY_ZONE_ENTRY';
            description = entityId + ' is in an emergency zone: ' + zoneDetails.name;
          } else if (zoneDetails.type === 'RESTRICTED' || zoneDetails.riskLevel === 'CRITICAL') {
            eventType = 'UNAUTHORIZED_ZONE_ENTRY';
            description = entityId + ' entered restricted zone: ' + zoneDetails.name;
          } else if (loc.entityType === 'WORKER') {
            // Check authorization
            var authZones = authorizedZones[entityId] || [];
            if (authZones.indexOf(currentZoneId) === -1) {
               eventType = 'UNAUTHORIZED_ZONE_ENTRY';
               description = entityId + ' is not authorized in ' + zoneDetails.name;
            }
          }

          var severity = determineSeverity(eventType, zoneDetails.riskLevel);

          AlertSystem.generateEvent({
            eventType: eventType,
            severity: severity,
            entityId: entityId,
            entityType: loc.entityType,
            zoneId: currentZoneId,
            description: description
          });
        }

        // Update state
        entityState[entityId] = {
          currentZoneId: currentZoneId,
          lastEvaluated: now
        };
      });
    },

    // For demo scenarios
    resetState: function(entityId) {
      if (entityState[entityId]) {
        delete entityState[entityId];
      }
    }
  };
})();
