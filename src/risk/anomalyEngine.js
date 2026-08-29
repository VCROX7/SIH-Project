/**
 * SIH26024 — Anomaly Engine (Prototype)
 * FILE: src/risk/anomalyEngine.js
 * 
 * PURPOSE: Lightweight deterministic anomaly detector. Evaluates sensor history 
 *          to identify sudden spikes, drops, or threshold breaches.
 * 
 * NOTE: This is a prototype stand-in for a future ML model.
 */

'use strict';

var AnomalyDetector = (function() {
  
  // Safe limits based on domain.ts
  var THRESHOLDS = {
    'METHANE': { safeMax: 0.75, spikeDelta: 0.2 },
    'AIR_FLOW': { safeMin: 2.0, dropDelta: 0.5 },
    'CARBON_MONOXIDE': { safeMax: 25, spikeDelta: 10 },
    'OXYGEN': { safeMin: 19.5, safeMax: 21, dropDelta: 1.0 },
    'TEMPERATURE': { safeMax: 32, spikeDelta: 3 }
  };

  /**
   * Evaluate a single sensor's history for anomalies.
   * @param {Object} sensor - Current sensor object
   * @param {Array} history - Array of { value, timestamp } ordered oldest to newest
   */
  function evaluateSensor(sensor, history) {
    if (!history || history.length < 2) return null;

    var current = history[history.length - 1];
    var previous = history[history.length - 2];
    var limits = THRESHOLDS[sensor.type];
    
    if (!limits) return null;

    var anomaly = null;
    var delta = current.value - previous.value;

    // 1. Check absolute thresholds
    if (limits.safeMax !== undefined && current.value > limits.safeMax) {
      anomaly = {
        type: 'THRESHOLD_EXCEEDED',
        severity: 'CRITICAL',
        confidence: 0.95,
        explanation: sensor.type + ' reading (' + current.value + ') exceeded safe maximum of ' + limits.safeMax
      };
    } else if (limits.safeMin !== undefined && current.value < limits.safeMin) {
      anomaly = {
        type: 'THRESHOLD_DROPPED',
        severity: 'CRITICAL',
        confidence: 0.95,
        explanation: sensor.type + ' reading (' + current.value + ') dropped below safe minimum of ' + limits.safeMin
      };
    }
    
    // 2. Check sudden spikes/drops (relative delta)
    if (!anomaly && limits.spikeDelta && delta > limits.spikeDelta) {
      anomaly = {
        type: 'SUDDEN_SPIKE',
        severity: 'HIGH',
        confidence: 0.85,
        explanation: sensor.type + ' spiked suddenly by ' + delta.toFixed(2)
      };
    } else if (!anomaly && limits.dropDelta && delta < -limits.dropDelta) {
      anomaly = {
        type: 'SUDDEN_DROP',
        severity: 'HIGH',
        confidence: 0.85,
        explanation: sensor.type + ' dropped suddenly by ' + Math.abs(delta).toFixed(2)
      };
    }
    
    // 3. Stale sensor detection
    var timeDiffMs = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
    if (timeDiffMs > 1000 * 60 * 5) { // 5 minutes stale
       anomaly = {
         type: 'STALE_SENSOR',
         severity: 'MEDIUM',
         confidence: 0.90,
         explanation: 'Sensor has not reported data in over 5 minutes.'
       };
    }

    if (anomaly) {
      anomaly.timestamp = current.timestamp;
      anomaly.sensorId = sensor.id;
      anomaly.zoneId = sensor.zoneId;
    }

    return anomaly;
  }

  return {
    /**
     * @param {Array} sensors
     * @param {Object} historiesMap - { sensorId: [{value, timestamp}, ...] }
     * @returns {Array} List of detected anomalies
     */
    detect: function(sensors, historiesMap) {
      var detected = [];
      sensors.forEach(function(s) {
        var hist = historiesMap[s.id];
        var anomaly = evaluateSensor(s, hist);
        if (anomaly) {
          detected.push(anomaly);
        }
      });
      return detected;
    }
  };

})();
