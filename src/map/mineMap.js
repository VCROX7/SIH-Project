/**
 * SIH26024 — Mine Digital Twin — Interactive Simulated Underground Mine Map
 * FILE: src/map/mineMap.js
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * IMPORTANT DISCLAIMER
 * All mine geometry, worker positions, sensor readings, incidents, and
 * equipment data in this file are SYNTHETIC / SIMULATED.
 * This is a DEMONSTRATION prototype for SIH judges.
 * It does NOT represent any real mine, real workers, or real sensor data.
 * No UWB, RFID, BLE, or GPS hardware is connected.
 * Positioning method = SIMULATED throughout.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Architecture:
 *   MineMap (this file)
 *     → SimulatedLocationProvider  ← future: swap with RealUWBProvider
 *     → MineMapData (static demo entities)
 *     → SVG renderer
 *     → Detail panel controller
 *     → Layer manager
 *     → Search + filter controller
 *     → Simulation ticker
 *
 * SVG coordinate space: 1000 × 680 units (viewBox)
 * Pan/zoom implemented via CSS transform on a <g> group.
 */

'use strict';

/* ========================================================================
   SECTION 1 — DEMO MINE DATA
   All data is SIMULATED. positioningMethod = 'SIMULATED' always.
   ======================================================================== */

var MDT_MINE = {
  id: 'demo-mine-01',
  name: 'Demo Underground Mine',
  isSimulated: true,
  disclaimer: 'SIMULATED — Not a real Coal India mine'
};

/* ---- SVG dimensions ---- */
var MDT_W = 1000;
var MDT_H = 680;

/* ---- Zones (schematic coordinates, not GPS) ---- */
var MDT_ZONES = [
  { id: 'zone-main-tunnel', name: 'Main Tunnel', type: 'TRANSPORT_ROADWAY', riskLevel: 'LOW',
    x: 80, y: 195, w: 840, h: 60, riskScore: 18, color: 'low' },
  { id: 'zone-panel-a', name: 'Panel A', type: 'WORKING_FACE', riskLevel: 'LOW',
    x: 80, y: 270, w: 200, h: 220, riskScore: 21, color: 'low' },
  { id: 'zone-panel-b', name: 'Panel B', type: 'WORKING_FACE', riskLevel: 'HIGH',
    x: 400, y: 270, w: 200, h: 220, riskScore: 87, color: 'high' },
  { id: 'zone-panel-c', name: 'Panel C', type: 'WORKING_FACE', riskLevel: 'MEDIUM',
    x: 720, y: 270, w: 200, h: 220, riskScore: 42, color: 'medium' },
  { id: 'zone-vent', name: 'Ventilation Zone', type: 'VENTILATION', riskLevel: 'HIGH',
    x: 320, y: 510, w: 160, h: 120, riskScore: 75, color: 'high' },
  { id: 'zone-restricted', name: 'Restricted Zone', type: 'RESTRICTED', riskLevel: 'CRITICAL',
    x: 520, y: 510, w: 120, h: 100, riskScore: 94, color: 'restricted' },
  { id: 'zone-maint', name: 'Maintenance Area', type: 'MAINTENANCE_YARD', riskLevel: 'LOW',
    x: 720, y: 500, w: 200, h: 130, riskScore: 15, color: 'low' },
  { id: 'zone-surface', name: 'Surface', type: 'SURFACE_FACILITY', riskLevel: 'LOW',
    x: 80, y: 40, w: 840, h: 130, riskScore: 5, color: 'low' },
  { id: 'zone-refuge', name: 'Refuge Chamber', type: 'REFUGE_CHAMBER', riskLevel: 'LOW',
    x: 80, y: 510, w: 200, h: 110, riskScore: 5, color: 'emergency' }
];

/* ---- Tunnels (as SVG line segments) ---- */
var MDT_TUNNELS = [
  { id: 'T-01', name: 'Main Tunnel', zoneId: 'zone-main-tunnel',
    x1: 100, y1: 225, x2: 900, y2: 225,
    riskLevel: 'LOW', riskScore: 18, length: 820,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 5, openCases: 0, color: 'low' },
  { id: 'T-02', name: 'Panel A Access', zoneId: 'zone-panel-a',
    x1: 180, y1: 225, x2: 180, y2: 490,
    riskLevel: 'LOW', riskScore: 21, length: 265,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 2, openCases: 0, color: 'low' },
  { id: 'T-03', name: 'Panel B Access', zoneId: 'zone-panel-b',
    x1: 500, y1: 225, x2: 500, y2: 490,
    riskLevel: 'HIGH', riskScore: 87, length: 265,
    status: 'ACTIVE', ventStatus: 'DEGRADED',
    activeWorkers: 8, openCases: 2, color: 'high' },
  { id: 'T-04', name: 'Panel C Access', zoneId: 'zone-panel-c',
    x1: 820, y1: 225, x2: 820, y2: 490,
    riskLevel: 'MEDIUM', riskScore: 42, length: 265,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 3, openCases: 1, color: 'medium' },
  { id: 'T-05', name: 'Vent Cross-Passage', zoneId: 'zone-vent',
    x1: 400, y1: 490, x2: 500, y2: 490,
    riskLevel: 'HIGH', riskScore: 75, length: 100,
    status: 'ACTIVE', ventStatus: 'DEGRADED',
    activeWorkers: 1, openCases: 1, color: 'high' },
  { id: 'T-06', name: 'Shaft Connector', zoneId: 'zone-surface',
    x1: 500, y1: 90, x2: 500, y2: 195,
    riskLevel: 'LOW', riskScore: 12, length: 105,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 0, openCases: 0, color: 'low' },
  { id: 'T-07', name: 'Maintenance Road', zoneId: 'zone-maint',
    x1: 820, y1: 490, x2: 820, y2: 560,
    riskLevel: 'LOW', riskScore: 15, length: 70,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 1, openCases: 0, color: 'low' },
  { id: 'T-08', name: 'Refuge Access', zoneId: 'zone-refuge',
    x1: 180, y1: 490, x2: 180, y2: 565,
    riskLevel: 'LOW', riskScore: 5, length: 75,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 0, openCases: 0, color: 'low' },
  { id: 'T-09', name: 'Emergency Bypass', zoneId: 'zone-main-tunnel',
    x1: 280, y1: 225, x2: 400, y2: 225,
    riskLevel: 'LOW', riskScore: 10, length: 120,
    status: 'ACTIVE', ventStatus: 'NORMAL',
    activeWorkers: 0, openCases: 0, color: 'low' }
];

/* ---- Junction nodes (for display only) ---- */
var MDT_JUNCTIONS = [
  { id: 'J-01', x: 180, y: 225, label: 'J1' },
  { id: 'J-02', x: 500, y: 225, label: 'J2' },
  { id: 'J-03', x: 820, y: 225, label: 'J3' },
  { id: 'J-04', x: 180, y: 490, label: 'J4' },
  { id: 'J-05', x: 500, y: 490, label: 'J5' },
  { id: 'J-06', x: 820, y: 490, label: 'J6' }
];

/* ---- Special markers ---- */
var MDT_SPECIALS = [
  { id: 'SHAFT-01', type: 'shaft',   x: 500, y: 68,  label: 'SHAFT' },
  { id: 'EX-01',    type: 'exit',    x: 130, y: 68,  label: 'EXIT-A' },
  { id: 'EX-02',    type: 'exit',    x: 870, y: 68,  label: 'EXIT-B' },
  { id: 'RC-01',    type: 'refuge',  x: 130, y: 565, label: 'RC-01' },
  { id: 'RC-02',    type: 'refuge',  x: 680, y: 565, label: 'RC-02' }
];

/* ---- Workers (positioningMethod: SIMULATED) ---- */
/* Each worker has a path array: list of {x,y} waypoints to follow cyclically */
var MDT_WORKERS = [
  { id: 'M-1024', name: 'Arjun Sharma',       role: 'Mining Engineer',
    status: 'ACTIVE', riskStatus: 'NORMAL', currentZone: 'zone-panel-b', currentTunnel: 'T-03',
    positioningMethod: 'SIMULATED',
    path: [ {x:500,y:300}, {x:500,y:400}, {x:500,y:490}, {x:500,y:400}, {x:500,y:300}, {x:500,y:225} ],
    pathIdx: 0, x: 500, y: 300, lastUpdate: '11:42:18' },
  { id: 'M-1091', name: 'Priya Verma',        role: 'Safety Inspector',
    status: 'ACTIVE', riskStatus: 'WARNING', currentZone: 'zone-panel-b', currentTunnel: 'T-03',
    positioningMethod: 'SIMULATED',
    path: [ {x:500,y:350}, {x:450,y:490}, {x:400,y:490}, {x:400,y:490}, {x:450,y:490}, {x:500,y:350} ],
    pathIdx: 2, x: 450, y: 490, lastUpdate: '11:41:05' },
  { id: 'M-1178', name: 'Ravi Kumar',         role: 'Miner',
    status: 'ACTIVE', riskStatus: 'NORMAL', currentZone: 'zone-panel-a', currentTunnel: 'T-02',
    positioningMethod: 'SIMULATED',
    path: [ {x:180,y:300}, {x:180,y:400}, {x:180,y:490}, {x:180,y:400}, {x:180,y:300} ],
    pathIdx: 1, x: 180, y: 400, lastUpdate: '11:39:52' },
  { id: 'M-1204', name: 'Suresh Nair',        role: 'Equipment Operator',
    status: 'ACTIVE', riskStatus: 'NORMAL', currentZone: 'zone-panel-c', currentTunnel: 'T-04',
    positioningMethod: 'SIMULATED',
    path: [ {x:820,y:300}, {x:820,y:420}, {x:820,y:490}, {x:820,y:420}, {x:820,y:300} ],
    pathIdx: 0, x: 820, y: 300, lastUpdate: '11:40:30' },
  { id: 'M-1211', name: 'Deepa Pillai',       role: 'Ventilation Engineer',
    status: 'ACTIVE', riskStatus: 'CRITICAL', currentZone: 'zone-vent', currentTunnel: 'T-05',
    positioningMethod: 'SIMULATED',
    path: [ {x:400,y:490}, {x:450,y:490}, {x:500,y:490}, {x:450,y:490} ],
    pathIdx: 0, x: 400, y: 490, lastUpdate: '11:43:01' }
];

/* ---- Equipment (positioningMethod: SIMULATED) ---- */
var MDT_EQUIPMENT = [
  { id: 'HEMM-42', name: 'Heavy Earthmover',  type: 'EARTHMOVER',
    status: 'OPERATIONAL', zoneId: 'zone-panel-a', tunnelId: 'T-02',
    x: 150, y: 350, positioningMethod: 'SIMULATED',
    lastMaintenance: '2026-08-20', riskLevel: 'LOW' },
  { id: 'EXC-17',  name: 'Excavator #17',     type: 'EXCAVATOR',
    status: 'DEGRADED',    zoneId: 'zone-panel-b', tunnelId: 'T-03',
    x: 530, y: 360, positioningMethod: 'SIMULATED',
    lastMaintenance: '2026-08-10', riskLevel: 'HIGH' },
  { id: 'DRILL-08',name: 'Roof Bolt Drill #8',type: 'DRILL',
    status: 'OPERATIONAL', zoneId: 'zone-panel-c', tunnelId: 'T-04',
    x: 850, y: 380, positioningMethod: 'SIMULATED',
    lastMaintenance: '2026-08-22', riskLevel: 'LOW' },
  { id: 'LOADER-11',name: 'Loader #11',        type: 'LOADER',
    status: 'OPERATIONAL', zoneId: 'zone-maint', tunnelId: 'T-07',
    x: 800, y: 540, positioningMethod: 'SIMULATED',
    lastMaintenance: '2026-08-18', riskLevel: 'LOW' }
];

/* ---- Sensors (positioningMethod: SIMULATED) ---- */
var MDT_SENSORS = [
  { id: 'GAS-101', name: 'Methane Sensor', type: 'METHANE',
    x: 480, y: 320, zoneId: 'zone-panel-b', tunnelId: 'T-03',
    status: 'WARNING', value: 0.58, unit: '%', safeMax: 0.75, trend: 'RISING',
    positioningMethod: 'SIMULATED' },
  { id: 'AIR-102', name: 'Air Flow Sensor', type: 'AIR_FLOW',
    x: 500, y: 450, zoneId: 'zone-vent', tunnelId: 'T-05',
    status: 'WARNING', value: 3.2, unit: 'm/s', safeMax: 8.0, trend: 'FALLING',
    positioningMethod: 'SIMULATED' },
  { id: 'TEMP-103',name: 'Temperature Sensor',type: 'TEMPERATURE',
    x: 820, y: 350, zoneId: 'zone-panel-c', tunnelId: 'T-04',
    status: 'NORMAL', value: 34, unit: '°C', safeMax: 36, trend: 'STABLE',
    positioningMethod: 'SIMULATED' },
  { id: 'ROOF-104',name: 'Roof Movement Sensor',type: 'ROOF_MOVEMENT',
    x: 180, y: 380, zoneId: 'zone-panel-a', tunnelId: 'T-02',
    status: 'NORMAL', value: 4, unit: 'mm', safeMax: 10, trend: 'STABLE',
    positioningMethod: 'SIMULATED' },
  { id: 'CO-105', name: 'CO Sensor', type: 'CARBON_MONOXIDE',
    x: 260, y: 225, zoneId: 'zone-main-tunnel', tunnelId: 'T-01',
    status: 'NORMAL', value: 18, unit: 'ppm', safeMax: 25, trend: 'STABLE',
    positioningMethod: 'SIMULATED' },
  { id: 'GAS-106', name: 'Methane Sensor B', type: 'METHANE',
    x: 520, y: 550, zoneId: 'zone-restricted', tunnelId: null,
    status: 'CRITICAL', value: 1.15, unit: '%', safeMax: 0.75, trend: 'RISING',
    positioningMethod: 'SIMULATED' }
];

/* ---- Incidents ---- */
var MDT_INCIDENTS = [
  { id: 'INC-2048', title: 'Ventilation Anomaly', type: 'Ventilation failure',
    severity: 'HIGH', zoneId: 'zone-panel-b', tunnelId: 'T-03',
    status: 'OPEN', riskScore: 87, linkedCaseId: 'case-2048',
    x: 555, y: 270, createdAt: '2026-08-27 08:00',
    nearbyWorkers: ['M-1024','M-1091'], nearbySensors: ['GAS-101','AIR-102'] },
  { id: 'INC-1821', title: 'Air Fan Seal Leak', type: 'Equipment failure',
    severity: 'MEDIUM', zoneId: 'zone-vent', tunnelId: 'T-05',
    status: 'OPEN', riskScore: 64, linkedCaseId: 'case-1821',
    x: 450, y: 510, createdAt: '2026-08-24 10:00',
    nearbyWorkers: ['M-1211'], nearbySensors: ['AIR-102'] },
  { id: 'INC-2045', title: 'Belt Dust Accumulation', type: 'Housekeeping',
    severity: 'LOW', zoneId: 'zone-maint', tunnelId: 'T-07',
    status: 'RESOLVED', riskScore: 20, linkedCaseId: 'case-2045',
    x: 790, y: 560, createdAt: '2026-08-25 08:00',
    nearbyWorkers: [], nearbySensors: [] }
];

/* ---- Inspections ---- */
var MDT_INSPECTIONS = [
  { id: 'INS-001', inspector: 'Raj Kumar (SO-4421)', zoneId: 'zone-maint',
    status: 'COMPLETED', evidenceCount: 4, timestamp: '11:35', x: 820, y: 510,
    notes: 'Routine check. Belt dust found. Case raised.' },
  { id: 'INS-002', inspector: 'S. N. Sengupta (DGMS)', zoneId: 'zone-panel-b',
    status: 'IN_PROGRESS', evidenceCount: 2, timestamp: '11:42', x: 470, y: 290,
    notes: 'DGMS statutory audit inspection of Panel B ventilation.' }
];

/* ========================================================================
   SECTION 2 — SIMULATED LOCATION PROVIDER
   This is the provider abstraction that future real UWB/RFID/GPS providers
   will replace. The interface contract is fixed; only the data source changes.
   ======================================================================== */

var SimulatedLocationProvider = {
  name: 'SIMULATED',

  getWorkerLocations: function() {
    return MDT_WORKERS.map(function(w) {
      return {
        entityId: w.id, entityType: 'WORKER',
        mineId: MDT_MINE.id, environment: 'UNDERGROUND',
        positioningMethod: 'SIMULATED',
        latitude: null, longitude: null,
        x: w.x, y: w.y, z: -220,
        zoneId: w.currentZone, tunnelId: w.currentTunnel,
        accuracy: 0,
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        isSimulated: true
      };
    });
  },

  getEquipmentLocations: function() {
    return MDT_EQUIPMENT.map(function(e) {
      return {
        entityId: e.id, entityType: 'EQUIPMENT',
        mineId: MDT_MINE.id, environment: 'UNDERGROUND',
        positioningMethod: 'SIMULATED',
        latitude: null, longitude: null,
        x: e.x, y: e.y, z: -200,
        zoneId: e.zoneId, tunnelId: e.tunnelId,
        accuracy: 0,
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        isSimulated: true
      };
    });
  }

  /* Future: RealUWBProvider, RealRFIDProvider, RealGPSProvider
     will implement the same interface */
};

/* ========================================================================
   SECTION 3 — MAP STATE
   ======================================================================== */

var MdtState = {
  /* Pan / zoom */
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,

  /* Layers */
  layers: {
    tunnels:     true,
    zones:       true,
    workers:     true,
    equipment:   true,
    sensors:     true,
    incidents:   true,
    inspections: true,
    risk:        true,
    emergency:   true
  },

  /* Filters */
  filterRisk:   'all',
  filterEntity: 'all',
  filterStatus: 'all',
  searchQuery:  '',

  /* Selection */
  selectedEntity: null,
  selectedType:   null,

  /* Simulation */
  simRunning: true,
  simTimer: null,
  simTick: 0,

  /* Emergency mode */
  emergencyMode: false,

  /* Init flag */
  initialized: false
};

/* ========================================================================
   SECTION 4 — SVG ELEMENT REFERENCES (populated after render)
   ======================================================================== */
var MdtSvg = null;
var MdtGroup = null; /* The transformable <g> group inside SVG */

/* ========================================================================
   SECTION 5 — MAIN INIT
   ======================================================================== */

function mdtInit() {
  if (MdtState.initialized) { mdtRefreshAll(); return; }
  MdtState.initialized = true;

  var mapPage = document.getElementById('map-page');
  if (!mapPage) return;

  mapPage.innerHTML = mdtBuildHTML();

  /* Wire up events after DOM is built */
  mdtWireEvents();

  /* First render */
  MdtSvg   = document.getElementById('mdt-svg');
  MdtGroup = document.getElementById('mdt-group');

  mdtRenderAll();
  mdtStartSimulation();
}

/* ========================================================================
   SECTION 6 — HTML BUILDER
   ======================================================================== */

function mdtBuildHTML() {
  return [
    /* Header */
    '<div class="mdt-header">',
    '  <div class="mdt-header-left">',
    '    <div class="mdt-title-group">',
    '      <h2>Underground Mine Map</h2>',
    '      <p>Demo Underground Mine &nbsp;·&nbsp; Schematic View</p>',
    '    </div>',
    '    <div class="mdt-sim-badge"><span class="blink-dot"></span> SIMULATION MODE</div>',
    '  </div>',
    '  <div class="mdt-stats">',
    '    <div class="mdt-stat"><span class="mdt-stat-val" id="mdt-stat-workers">5</span><span class="mdt-stat-lbl">Active Workers</span></div>',
    '    <div class="mdt-stat"><span class="mdt-stat-val red" id="mdt-stat-incidents">2</span><span class="mdt-stat-lbl">Open Incidents</span></div>',
    '    <div class="mdt-stat"><span class="mdt-stat-val amber" id="mdt-stat-highrisk">2</span><span class="mdt-stat-lbl">High Risk Zones</span></div>',
    '    <div class="mdt-stat"><span class="mdt-stat-val" id="mdt-stat-sensors">6</span><span class="mdt-stat-lbl">Active Sensors</span></div>',
    '  </div>',
    '  <div class="mdt-header-right">',
    '    <button class="mdt-sim-toggle" id="mdt-sim-toggle" onclick="mdtToggleSim()">&#9646;&#9646; LIVE SIM</button>',
    '    <button class="mdt-emergency-btn" id="mdt-emergency-btn" onclick="mdtToggleEmergency()">&#9940; Emergency</button>',
    '  </div>',
    '</div>',

    /* Toolbar */
    '<div class="mdt-toolbar">',
    '  <div class="mdt-search-wrap">',
    '    <span class="mdt-search-icon">&#128269;</span>',
    '    <input class="mdt-search" id="mdt-search" placeholder="Search entity ID or name..." oninput="mdtHandleSearch(this.value)" autocomplete="off">',
    '    <div class="mdt-search-results" id="mdt-search-results"></div>',
    '  </div>',
    '  <div class="mdt-filter-sep"></div>',
    '  <div class="mdt-filter-group">',
    '    <span class="mdt-filter-label">Risk</span>',
    '    <select class="mdt-filter-select" id="mdt-filter-risk" onchange="mdtApplyFilter(\'risk\',this.value)">',
    '      <option value="all">All</option><option value="low">Low</option>',
    '      <option value="medium">Medium</option><option value="high">High</option>',
    '      <option value="critical">Critical</option>',
    '    </select>',
    '  </div>',
    '  <div class="mdt-filter-group">',
    '    <span class="mdt-filter-label">Entity</span>',
    '    <select class="mdt-filter-select" id="mdt-filter-entity" onchange="mdtApplyFilter(\'entity\',this.value)">',
    '      <option value="all">All</option><option value="workers">Workers</option>',
    '      <option value="equipment">Equipment</option><option value="sensors">Sensors</option>',
    '      <option value="incidents">Incidents</option><option value="inspections">Inspections</option>',
    '    </select>',
    '  </div>',
    '  <div class="mdt-filter-group">',
    '    <span class="mdt-filter-label">Status</span>',
    '    <select class="mdt-filter-select" id="mdt-filter-status" onchange="mdtApplyFilter(\'status\',this.value)">',
    '      <option value="all">All</option><option value="active">Active</option>',
    '      <option value="warning">Warning</option><option value="critical">Critical</option>',
    '      <option value="offline">Offline</option>',
    '    </select>',
    '  </div>',
    '  <div class="mdt-filter-sep"></div>',
    '  <div class="mdt-layers" id="mdt-layers">',
    mdtBuildLayerBtns(),
    '  </div>',
    '</div>',

    /* Main area: SVG canvas + detail panel */
    '<div class="mdt-main" id="mdt-main">',
    '  <div class="mdt-canvas-wrap" id="mdt-canvas-wrap">',
    '    <svg id="mdt-svg" viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid meet">',
    '      <g id="mdt-group">',
    '        <g id="mdt-g-bg"></g>',
    '        <g id="mdt-g-zones"></g>',
    '        <g id="mdt-g-risk"></g>',
    '        <g id="mdt-g-tunnels"></g>',
    '        <g id="mdt-g-junctions"></g>',
    '        <g id="mdt-g-specials"></g>',
    '        <g id="mdt-g-emergency-overlay"></g>',
    '        <g id="mdt-g-inspections"></g>',
    '        <g id="mdt-g-incidents"></g>',
    '        <g id="mdt-g-sensors"></g>',
    '        <g id="mdt-g-equipment"></g>',
    '        <g id="mdt-g-workers"></g>',
    '      </g>',
    '    </svg>',
    '    <div class="mdt-legend" id="mdt-legend">',
    '      <div class="mdt-legend-title">Legend</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-dot" style="background:#3b82f6"></span>Worker (SIMULATED)</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-sq" style="background:#f59e0b"></span>Equipment</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-dot" style="background:#22d3ee"></span>Sensor (Normal)</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-dot" style="background:#c98a22"></span>Sensor (Warning)</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-dot" style="background:#b94b43"></span>Incident / Critical</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-dot" style="background:#8b5cf6"></span>Inspection</div>',
    '      <div class="mdt-legend-row"><span class="mdt-legend-dot" style="background:#2f7d4b;opacity:.5;width:10px;height:10px;border-radius:2px"></span>Risk Zone (Low→Critical)</div>',
    '    </div>',
    '    <div class="mdt-zoom-controls">',
    '      <button class="mdt-zoom-btn" onclick="mdtZoom(0.2)">+</button>',
    '      <button class="mdt-zoom-btn" onclick="mdtZoom(-0.2)">−</button>',
    '      <button class="mdt-zoom-btn" onclick="mdtResetView()" title="Reset view" style="font-size:11px">&#8635;</button>',
    '    </div>',
    '  </div>',
    '  <div class="mdt-detail-panel" id="mdt-detail-panel">',
    '    <div class="mdt-detail-inner" id="mdt-detail-inner"></div>',
    '  </div>',
    '  <div class="mdt-emergency-panel" id="mdt-emergency-panel">',
    '    <div class="mdt-emergency-inner" id="mdt-emergency-inner"></div>',
    '  </div>',
    '</div>'
  ].join('');
}

function mdtBuildLayerBtns() {
  var layers = [
    ['tunnels','Tunnels'], ['zones','Zones'], ['workers','Workers'],
    ['equipment','Equip.'], ['sensors','Sensors'], ['incidents','Incidents'],
    ['inspections','Insp.'], ['risk','Risk'], ['emergency','Emergency']
  ];
  return layers.map(function(l) {
    return '<button class="mdt-layer-btn on" id="mdt-layer-' + l[0] + '" onclick="mdtToggleLayer(\'' + l[0] + '\')">' + l[1] + '</button>';
  }).join('');
}

/* ========================================================================
   SECTION 7 — EVENT WIRING
   ======================================================================== */

function mdtWireEvents() {
  /* Pan/zoom on canvas wrapper */
  var wrap = document.getElementById('mdt-canvas-wrap');
  if (!wrap) return;

  wrap.addEventListener('mousedown', function(e) {
    MdtState.isDragging = true;
    MdtState.dragStartX = e.clientX - MdtState.translateX;
    MdtState.dragStartY = e.clientY - MdtState.translateY;
  });

  document.addEventListener('mousemove', function(e) {
    if (!MdtState.isDragging) return;
    MdtState.translateX = e.clientX - MdtState.dragStartX;
    MdtState.translateY = e.clientY - MdtState.dragStartY;
    mdtApplyTransform();
  });

  document.addEventListener('mouseup', function() {
    MdtState.isDragging = false;
  });

  wrap.addEventListener('wheel', function(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.1 : 0.1;
    mdtZoom(delta);
  }, { passive: false });

  /* Close search on outside click */
  document.addEventListener('click', function(e) {
    var sr = document.getElementById('mdt-search-results');
    var si = document.getElementById('mdt-search');
    if (sr && si && !sr.contains(e.target) && e.target !== si) {
      sr.classList.remove('visible');
    }
  });
}

/* ========================================================================
   SECTION 8 — PAN / ZOOM
   ======================================================================== */

function mdtApplyTransform() {
  if (!MdtGroup) return;
  MdtGroup.setAttribute('transform',
    'translate(' + MdtState.translateX + ',' + MdtState.translateY + ') scale(' + MdtState.scale + ')');
}

function mdtZoom(delta) {
  MdtState.scale = Math.max(0.4, Math.min(3.5, MdtState.scale + delta));
  mdtApplyTransform();
}

function mdtResetView() {
  MdtState.scale = 1;
  MdtState.translateX = 0;
  MdtState.translateY = 0;
  mdtApplyTransform();
}

/* ========================================================================
   SECTION 9 — LAYER CONTROL
   ======================================================================== */

function mdtToggleLayer(layerName) {
  MdtState.layers[layerName] = !MdtState.layers[layerName];
  var btn = document.getElementById('mdt-layer-' + layerName);
  if (btn) btn.className = 'mdt-layer-btn' + (MdtState.layers[layerName] ? ' on' : '');
  mdtUpdateLayerVisibility();
}

var MDT_LAYER_MAP = {
  tunnels:     ['mdt-g-tunnels', 'mdt-g-junctions'],
  zones:       ['mdt-g-zones'],
  workers:     ['mdt-g-workers'],
  equipment:   ['mdt-g-equipment'],
  sensors:     ['mdt-g-sensors'],
  incidents:   ['mdt-g-incidents'],
  inspections: ['mdt-g-inspections'],
  risk:        ['mdt-g-risk'],
  emergency:   ['mdt-g-specials', 'mdt-g-emergency-overlay']
};

function mdtUpdateLayerVisibility() {
  Object.keys(MDT_LAYER_MAP).forEach(function(layer) {
    var visible = MdtState.layers[layer];
    MDT_LAYER_MAP[layer].forEach(function(gId) {
      var el = document.getElementById(gId);
      if (el) el.style.display = visible ? '' : 'none';
    });
  });
}

/* ========================================================================
   SECTION 10 — FULL RENDER
   ======================================================================== */

function mdtRenderAll() {
  mdtRenderBackground();
  mdtRenderZones();
  mdtRenderRiskOverlay();
  mdtRenderTunnels();
  mdtRenderJunctions();
  mdtRenderSpecials();
  mdtRenderInspections();
  mdtRenderIncidents();
  mdtRenderSensors();
  mdtRenderEquipment();
  mdtRenderWorkers();
  mdtUpdateLayerVisibility();
}

function mdtRefreshAll() {
  /* On re-navigation to map page, just re-apply visibility */
  mdtUpdateLayerVisibility();
  if (MdtState.simRunning && !MdtState.simTimer) mdtStartSimulation();
}

function svgEl(tag, attrs, textContent) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
  if (textContent !== undefined) el.textContent = textContent;
  return el;
}

/* ---- Background grid ---- */
function mdtRenderBackground() {
  var g = document.getElementById('mdt-g-bg');
  if (!g) return;
  g.innerHTML = '';
  /* Subtle grid */
  for (var x = 0; x <= MDT_W; x += 50) {
    g.appendChild(svgEl('line', { x1: x, y1: 0, x2: x, y2: MDT_H, class: 'mdt-grid-line' }));
  }
  for (var y = 0; y <= MDT_H; y += 50) {
    g.appendChild(svgEl('line', { x1: 0, y1: y, x2: MDT_W, y2: y, class: 'mdt-grid-line' }));
  }
  /* Background rect */
  g.insertBefore(svgEl('rect', { x:0, y:0, width: MDT_W, height: MDT_H, fill: '#1a1f1a' }), g.firstChild);
}

/* ---- Zones ---- */
function mdtRenderZones() {
  var g = document.getElementById('mdt-g-zones');
  if (!g) return;
  g.innerHTML = '';
  MDT_ZONES.forEach(function(z) {
    var rect = svgEl('rect', {
      x: z.x, y: z.y, width: z.w, height: z.h, rx: 6,
      class: 'mdt-zone-fill ' + z.color
    });
    g.appendChild(rect);
    var border = svgEl('rect', {
      x: z.x, y: z.y, width: z.w, height: z.h, rx: 6,
      class: 'mdt-zone-border ' + z.color
    });
    g.appendChild(border);
    var lbl = svgEl('text', {
      x: z.x + z.w / 2, y: z.y + 14,
      class: 'mdt-zone-label', 'text-anchor': 'middle'
    }, z.name.toUpperCase());
    g.appendChild(lbl);
  });
}

/* ---- Risk overlay badges ---- */
function mdtRenderRiskOverlay() {
  var g = document.getElementById('mdt-g-risk');
  if (!g) return;
  g.innerHTML = '';
  var showZones = ['zone-panel-a','zone-panel-b','zone-panel-c','zone-vent','zone-restricted'];
  MDT_ZONES.forEach(function(z) {
    if (showZones.indexOf(z.id) === -1) return;
    var bx = z.x + z.w - 64, by = z.y + z.h - 28, bw = 58, bh = 22;
    g.appendChild(svgEl('rect', { x: bx, y: by, width: bw, height: bh, rx: 4, class: 'mdt-risk-badge' }));
    g.appendChild(svgEl('text', {
      x: bx + bw / 2, y: by + 8, class: 'mdt-risk-text', 'text-anchor': 'middle'
    }, z.riskScore + '/100'));
    var cls = 'mdt-risk-text ' + (z.riskScore >= 75 ? 'high' : z.riskScore >= 40 ? 'medium' : 'low');
    g.appendChild(svgEl('text', {
      x: bx + bw / 2, y: by + 18, class: cls, 'text-anchor': 'middle'
    }, z.riskLevel || (z.riskScore >= 75 ? 'HIGH' : z.riskScore >= 40 ? 'MED' : 'LOW')));
  });
}

/* ---- Tunnels ---- */
function mdtRenderTunnels() {
  var g = document.getElementById('mdt-g-tunnels');
  if (!g) return;
  g.innerHTML = '';
  MDT_TUNNELS.forEach(function(t) {
    var line = svgEl('line', {
      x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2,
      class: 'mdt-tunnel ' + (t.color === 'high' ? 'high-risk' : t.color === 'medium' ? 'medium-risk' : ''),
      id: 'mdt-t-' + t.id
    });
    line.addEventListener('click', function(e) { e.stopPropagation(); mdtSelectEntity('tunnel', t.id); });
    g.appendChild(line);
    /* Label at midpoint */
    var mx = (t.x1 + t.x2) / 2 + (t.x1 === t.x2 ? 10 : 0);
    var my = (t.y1 + t.y2) / 2 + (t.y1 === t.y2 ? -8 : 0);
    var lbl = svgEl('text', { x: mx, y: my, class: 'mdt-tunnel-label' }, t.id);
    g.appendChild(lbl);
  });
}

/* ---- Junctions ---- */
function mdtRenderJunctions() {
  var g = document.getElementById('mdt-g-junctions');
  if (!g) return;
  g.innerHTML = '';
  MDT_JUNCTIONS.forEach(function(j) {
    g.appendChild(svgEl('circle', { cx: j.x, cy: j.y, r: 7, fill: '#2d3a2d', stroke: '#5daa74', 'stroke-width': 2 }));
    g.appendChild(svgEl('text', { x: j.x, y: j.y + 4, fill: '#7dcc9a', 'font-size': 6, 'text-anchor': 'middle', 'font-family': 'monospace' }, j.label));
  });
}

/* ---- Special markers (shaft, exits, refuge) ---- */
function mdtRenderSpecials() {
  var g = document.getElementById('mdt-g-specials');
  if (!g) return;
  g.innerHTML = '';
  MDT_SPECIALS.forEach(function(s) {
    if (s.type === 'shaft') {
      g.appendChild(svgEl('rect', { x: s.x-18, y: s.y-12, width: 36, height: 24, rx: 4, class: 'mdt-shaft-marker' }));
      g.appendChild(svgEl('text', { x: s.x, y: s.y+5, class: 'mdt-shaft-label' }, '↕ ' + s.id));
    } else if (s.type === 'exit') {
      g.appendChild(svgEl('rect', { x: s.x-18, y: s.y-10, width: 36, height: 20, rx: 3, class: 'mdt-exit-marker' }));
      g.appendChild(svgEl('text', { x: s.x, y: s.y+4, class: 'mdt-exit-label' }, s.label));
    } else if (s.type === 'refuge') {
      g.appendChild(svgEl('rect', { x: s.x-20, y: s.y-10, width: 40, height: 20, rx: 3, class: 'mdt-refuge-marker' }));
      g.appendChild(svgEl('text', { x: s.x, y: s.y+4, class: 'mdt-refuge-label' }, '⛺ ' + s.id));
    }
  });
}

/* ---- Emergency overlay rect ---- */
function mdtRenderEmergencyOverlay() {
  var g = document.getElementById('mdt-g-emergency-overlay');
  if (!g) return;
  g.innerHTML = '';
  if (!MdtState.emergencyMode) return;
  /* Highlight Panel B zone */
  var z = MDT_ZONES.filter(function(z) { return z.id === 'zone-panel-b'; })[0];
  if (z) {
    var o = svgEl('rect', { x: z.x-5, y: z.y-5, width: z.w+10, height: z.h+10, rx: 8, class: 'mdt-emergency-overlay visible' });
    g.appendChild(o);
  }
}

/* ---- Inspections ---- */
function mdtRenderInspections() {
  var g = document.getElementById('mdt-g-inspections');
  if (!g) return;
  g.innerHTML = '';
  MDT_INSPECTIONS.forEach(function(ins) {
    var grp = svgEl('g', { class: 'mdt-inspect', id: 'mdt-ins-' + ins.id, cursor: 'pointer' });
    grp.appendChild(svgEl('polygon', {
      points: ins.x + ',' + (ins.y - 10) + ' ' + (ins.x - 8) + ',' + (ins.y + 6) + ' ' + (ins.x + 8) + ',' + (ins.y + 6),
      class: 'mdt-inspect-body'
    }));
    grp.appendChild(svgEl('text', { x: ins.x, y: ins.y + 18, class: 'mdt-inspect-label' }, ins.id));
    grp.addEventListener('click', function(e) { e.stopPropagation(); mdtSelectEntity('inspection', ins.id); });
    g.appendChild(grp);
  });
}

/* ---- Incidents ---- */
function mdtRenderIncidents() {
  var g = document.getElementById('mdt-g-incidents');
  if (!g) return;
  g.innerHTML = '';
  MDT_INCIDENTS.forEach(function(inc) {
    var cls = 'mdt-incident-body' + (inc.severity === 'MEDIUM' ? ' medium' : inc.status === 'RESOLVED' ? ' resolved' : '');
    var grp = svgEl('g', { class: 'mdt-incident', id: 'mdt-inc-' + inc.id, cursor: 'pointer' });
    grp.appendChild(svgEl('rect', { x: inc.x-10, y: inc.y-10, width: 20, height: 20, rx: 3, class: cls }));
    grp.appendChild(svgEl('text', { x: inc.x, y: inc.y+5, class: 'mdt-incident-label' }, '!'));
    grp.appendChild(svgEl('text', { x: inc.x, y: inc.y+20, fill: '#ff9a8d', 'font-size': 7, 'font-family': 'monospace', 'text-anchor': 'middle' }, inc.id));
    grp.addEventListener('click', function(e) { e.stopPropagation(); mdtSelectEntity('incident', inc.id); });
    g.appendChild(grp);
  });
}

/* ---- Sensors ---- */
function mdtRenderSensors() {
  var g = document.getElementById('mdt-g-sensors');
  if (!g) return;
  g.innerHTML = '';
  MDT_SENSORS.forEach(function(s) {
    var cls = 'mdt-sensor-body ' + (s.status === 'WARNING' ? 'warning' : s.status === 'CRITICAL' ? 'critical' : s.status === 'OFFLINE' ? 'offline' : '');
    var grp = svgEl('g', { class: 'mdt-sensor', id: 'mdt-sen-' + s.id, cursor: 'pointer' });
    grp.appendChild(svgEl('circle', { cx: s.x, cy: s.y, r: 6, class: cls }));
    grp.appendChild(svgEl('text', { x: s.x, y: s.y + 16, class: 'mdt-sensor-label' }, s.id));
    grp.addEventListener('click', function(e) { e.stopPropagation(); mdtSelectEntity('sensor', s.id); });
    g.appendChild(grp);
  });
}

/* ---- Equipment ---- */
function mdtRenderEquipment() {
  var g = document.getElementById('mdt-g-equipment');
  if (!g) return;
  g.innerHTML = '';
  MDT_EQUIPMENT.forEach(function(eq) {
    var cls = 'mdt-equip-body' + (eq.status === 'DEGRADED' ? ' degraded' : '');
    var grp = svgEl('g', { class: 'mdt-equip', id: 'mdt-eq-' + eq.id, cursor: 'pointer' });
    grp.appendChild(svgEl('rect', { x: eq.x - 8, y: eq.y - 8, width: 16, height: 16, rx: 3, class: cls }));
    grp.appendChild(svgEl('text', { x: eq.x, y: eq.y + 4, fill: '#1a1000', 'font-size': 7, 'font-family': 'monospace', 'text-anchor': 'middle' }, 'E'));
    grp.appendChild(svgEl('text', { x: eq.x, y: eq.y + 22, class: 'mdt-equip-label' }, eq.id));
    grp.addEventListener('click', function(e) { e.stopPropagation(); mdtSelectEntity('equipment', eq.id); });
    g.appendChild(grp);
  });
}

/* ---- Workers ---- */
function mdtRenderWorkers() {
  var g = document.getElementById('mdt-g-workers');
  if (!g) return;
  g.innerHTML = '';
  MDT_WORKERS.forEach(function(w) {
    var bodyClass = 'mdt-worker-body' + (w.riskStatus === 'CRITICAL' ? ' critical' : w.riskStatus === 'WARNING' ? ' warning' : '');
    var grp = svgEl('g', { class: 'mdt-worker', id: 'mdt-w-' + w.id, cursor: 'pointer' });
    grp.setAttribute('transform', 'translate(' + w.x + ',' + w.y + ')');
    grp.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 7, class: bodyClass }));
    grp.appendChild(svgEl('text', { x: 0, y: 3, class: 'mdt-worker-label' }, w.id.replace('M-','').slice(-2)));
    grp.appendChild(svgEl('text', { x: 0, y: 18, fill: '#aaccff', 'font-size': 7, 'font-family': 'monospace', 'text-anchor': 'middle' }, w.id));
    grp.addEventListener('click', function(e) { e.stopPropagation(); mdtSelectEntity('worker', w.id); });
    g.appendChild(grp);
  });
}

function mdtUpdateWorkerPositions() {
  MDT_WORKERS.forEach(function(w) {
    var el = document.getElementById('mdt-w-' + w.id);
    if (el) el.setAttribute('transform', 'translate(' + w.x + ',' + w.y + ')');
  });
}

/* ========================================================================
   SECTION 11 — SIMULATION TICKER
   ======================================================================== */

function mdtStartSimulation() {
  mdtStopSimulation();
  MdtState.simRunning = true;
  MdtState.simTimer = setInterval(mdtSimTick, 2000);
  mdtUpdateSimButton();
}

function mdtStopSimulation() {
  if (MdtState.simTimer) { clearInterval(MdtState.simTimer); MdtState.simTimer = null; }
  MdtState.simRunning = false;
  mdtUpdateSimButton();
}

function mdtToggleSim() {
  if (MdtState.simRunning) mdtStopSimulation(); else mdtStartSimulation();
}

function mdtUpdateSimButton() {
  var btn = document.getElementById('mdt-sim-toggle');
  if (!btn) return;
  if (MdtState.simRunning) {
    btn.innerHTML = '&#9646;&#9646; LIVE SIM';
    btn.className = 'mdt-sim-toggle';
  } else {
    btn.innerHTML = '&#9654; PAUSED';
    btn.className = 'mdt-sim-toggle paused';
  }
}

function mdtSimTick() {
  MdtState.simTick++;
  MDT_WORKERS.forEach(function(w) {
    /* Move to next waypoint in path */
    var nextIdx = (w.pathIdx + 1) % w.path.length;
    var target = w.path[nextIdx];
    /* Interpolate 30% toward target each tick */
    w.x = Math.round(w.x + (target.x - w.x) * 0.5);
    w.y = Math.round(w.y + (target.y - w.y) * 0.5);
    /* Advance waypoint when close enough */
    var dist = Math.sqrt((w.x - target.x) * (w.x - target.x) + (w.y - target.y) * (w.y - target.y));
    if (dist < 8) w.pathIdx = nextIdx;
    /* Update timestamp */
    var now = new Date();
    w.lastUpdate = now.getHours().toString().padStart(2,'0') + ':' +
                   now.getMinutes().toString().padStart(2,'0') + ':' +
                   now.getSeconds().toString().padStart(2,'0');
  });

  /* Sensor value drift (simulated) */
  MDT_SENSORS.forEach(function(s) {
    if (s.type === 'METHANE' && s.status !== 'OFFLINE') {
      s.value = Math.max(0.3, Math.min(1.3, s.value + (Math.random() - 0.4) * 0.02));
      s.value = Math.round(s.value * 100) / 100;
    }
  });

  mdtUpdateWorkerPositions();

  /* Geofence Engine Evaluation */
  if (window.GeofenceEngine) {
    var locations = MDT_WORKERS.map(function(w) {
      var zone = MDT_ZONES.find(function(z) {
        return w.x >= z.x && w.x <= (z.x + z.w) && w.y >= z.y && w.y <= (z.y + z.h);
      });
      return {
        entityId: w.id,
        entityType: 'WORKER',
        zoneId: zone ? zone.id : null
      };
    });
    GeofenceEngine.evaluate(locations);
  }

  /* Update detail panel if a worker is selected */
  if (MdtState.selectedType === 'worker') mdtSelectEntity('worker', MdtState.selectedEntity, true);
}

/* ========================================================================
   SECTION 12 — ENTITY SELECTION & DETAIL PANEL
   ======================================================================== */

function mdtSelectEntity(type, id, silent) {
  MdtState.selectedEntity = id;
  MdtState.selectedType   = type;

  /* Close emergency panel */
  var ep = document.getElementById('mdt-emergency-panel');
  if (ep) ep.className = 'mdt-emergency-panel';

  var panel = document.getElementById('mdt-detail-panel');
  var inner = document.getElementById('mdt-detail-inner');
  if (!panel || !inner) return;

  panel.className = 'mdt-detail-panel open';
  inner.innerHTML = mdtBuildDetailHTML(type, id);
}

function mdtCloseDetail() {
  MdtState.selectedEntity = null;
  var panel = document.getElementById('mdt-detail-panel');
  if (panel) panel.className = 'mdt-detail-panel';
}

function mdtBuildDetailHTML(type, id) {
  var h = [];

  function row(key, val, cls) {
    h.push('<div class="mdt-detail-row">');
    h.push('<span class="mdt-detail-key">' + key + '</span>');
    h.push('<span class="mdt-detail-val ' + (cls||'') + '">' + val + '</span>');
    h.push('</div>');
  }

  function section(title) {
    h.push('<div class="mdt-detail-section-title">' + title + '</div>');
  }

  function pill(text, cls) {
    return '<span class="pill ' + (cls||'') + '" style="font-size:9px">' + text + '</span>';
  }

  function riskPill(level) {
    var cls = level === 'HIGH' || level === 'CRITICAL' ? 'high' : level === 'MEDIUM' ? 'medium' : 'low';
    return pill(level, cls);
  }

  h.push('<div class="mdt-detail-top">');
  h.push('<div><div class="mdt-detail-id" id="mdt-detail-id-el"></div><div class="mdt-detail-type">' + type.toUpperCase() + '</div></div>');
  h.push('<button class="mdt-detail-close" onclick="mdtCloseDetail()">×</button>');
  h.push('</div>');

  if (type === 'worker') {
    var w = MDT_WORKERS.filter(function(x) { return x.id === id; })[0];
    if (!w) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + w.id + '";<\/script>');
      h.push('<div class="mdt-detail-status-row">' + pill(w.status,'low') + riskPill(w.riskStatus) + '</div>');
      section('LOCATION (SIMULATED)');
      row('Zone', w.currentZone.replace('zone-','').replace(/-/g,' ').toUpperCase());
      row('Tunnel', w.currentTunnel);
      row('X coord', w.x + ' m');
      row('Y coord', w.y + ' m');
      row('Depth (Z)', '-220 m');
      section('WORKER INFO');
      row('Name', w.name);
      row('Role', w.role);
      row('Last Update', w.lastUpdate || '—');
      row('Risk Status', w.riskStatus, w.riskStatus === 'CRITICAL' ? 'red' : w.riskStatus === 'WARNING' ? 'amber' : 'green');
      h.push('<div class="mdt-detail-sim-tag">📍 Positioning: SIMULATED</div>');
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn" onclick="toast(\'Viewing history for ' + w.id + '\')">View History</button>');
      h.push('<button class="mdt-detail-action-btn primary" onclick="showPage(\'cases\')">View Cases</button>');
      h.push('</div>');
    }
  } else if (type === 'equipment') {
    var eq = MDT_EQUIPMENT.filter(function(x) { return x.id === id; })[0];
    if (!eq) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + eq.id + '";<\/script>');
      var eqCls = eq.status === 'DEGRADED' ? 'high' : 'low';
      h.push('<div class="mdt-detail-status-row">' + pill(eq.status, eqCls) + riskPill(eq.riskLevel) + '</div>');
      section('LOCATION (SIMULATED)');
      row('Zone', eq.zoneId.replace('zone-','').replace(/-/g,' ').toUpperCase());
      row('Tunnel', eq.tunnelId || '—');
      row('X coord', eq.x + ' m');
      row('Y coord', eq.y + ' m');
      section('EQUIPMENT INFO');
      row('Name', eq.name);
      row('Type', eq.type);
      row('Status', eq.status, eqCls);
      row('Last Maintenance', eq.lastMaintenance);
      h.push('<div class="mdt-detail-sim-tag">📍 Position: SIMULATED</div>');
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn" onclick="toast(\'Maintenance log for ' + eq.id + '\')">Maintenance Log</button>');
      h.push('<button class="mdt-detail-action-btn primary" onclick="showPage(\'cases\')">Open Cases</button>');
      h.push('</div>');
    }
  } else if (type === 'sensor') {
    var s = MDT_SENSORS.filter(function(x) { return x.id === id; })[0];
    if (!s) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + s.id + '";<\/script>');
      var sCls = s.status === 'CRITICAL' ? 'high' : s.status === 'WARNING' ? 'medium' : 'low';
      h.push('<div class="mdt-detail-status-row">' + pill(s.status, sCls) + '</div>');
      section('READING (SIMULATED)');
      row('Type', s.type.replace(/_/g,' '));
      row('Current Value', (typeof s.value === 'number' ? s.value.toFixed(2) : s.value) + ' ' + s.unit, sCls);
      row('Safe Max', s.safeMax + ' ' + s.unit);
      row('Trend', s.trend, s.trend === 'RISING' ? 'red' : s.trend === 'FALLING' ? 'amber' : 'green');
      section('LOCATION');
      row('Zone', s.zoneId.replace('zone-','').replace(/-/g,' ').toUpperCase());
      row('Tunnel', s.tunnelId || '—');
      h.push('<div class="mdt-detail-sim-tag">📡 Data: SIMULATED</div>');
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn" onclick="showPage(\'sensors\')">View Live Feed</button>');
      h.push('</div>');
    }
  } else if (type === 'tunnel') {
    var t = MDT_TUNNELS.filter(function(x) { return x.id === id; })[0];
    if (!t) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + t.id + '";<\/script>');
      var tCls = t.riskLevel === 'HIGH' ? 'high' : t.riskLevel === 'MEDIUM' ? 'medium' : 'low';
      h.push('<div class="mdt-detail-status-row">' + pill(t.status,'low') + riskPill(t.riskLevel) + '</div>');
      section('TUNNEL INFO');
      row('Name', t.name);
      row('Zone', t.zoneId.replace('zone-','').replace(/-/g,' ').toUpperCase());
      row('Length', t.length + ' m');
      row('Risk Score', t.riskScore + '/100', tCls);
      row('Ventilation', t.ventStatus, t.ventStatus === 'DEGRADED' ? 'amber' : 'green');
      row('Active Workers', t.activeWorkers);
      row('Open Cases', t.openCases, t.openCases > 0 ? 'red' : 'green');
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn primary" onclick="showPage(\'cases\')">View Cases</button>');
      h.push('</div>');
    }
  } else if (type === 'incident') {
    var inc = MDT_INCIDENTS.filter(function(x) { return x.id === id; })[0];
    if (!inc) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + inc.id + '";<\/script>');
      var incCls = inc.severity === 'HIGH' ? 'high' : inc.severity === 'MEDIUM' ? 'medium' : 'low';
      var stCls  = inc.status === 'OPEN' ? 'high' : 'done';
      h.push('<div class="mdt-detail-status-row">' + pill(inc.status, stCls) + pill(inc.severity + ' RISK', incCls) + '</div>');
      section('INCIDENT INFO');
      row('Title', inc.title);
      row('Type', inc.type);
      row('Risk Score', inc.riskScore + '/100', incCls);
      row('Created', inc.createdAt);
      row('Linked Case', inc.linkedCaseId);
      if (inc.nearbyWorkers.length > 0) {
        section('NEARBY WORKERS');
        inc.nearbyWorkers.forEach(function(wid) { row(wid, '● Nearby', 'amber'); });
      }
      if (inc.nearbySensors.length > 0) {
        section('NEARBY SENSORS');
        inc.nearbySensors.forEach(function(sid) { row(sid, '● Monitoring', 'amber'); });
      }
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn primary" onclick="showPage(\'cases\')">Open Case #' + inc.linkedCaseId.replace('case-','') + '</button>');
      h.push('<button class="mdt-detail-action-btn" onclick="toast(\'Escalating ' + inc.id + '\')">Escalate</button>');
      h.push('</div>');
    }
  } else if (type === 'inspection') {
    var ins = MDT_INSPECTIONS.filter(function(x) { return x.id === id; })[0];
    if (!ins) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + ins.id + '";<\/script>');
      var insCls = ins.status === 'COMPLETED' ? 'done' : 'medium';
      h.push('<div class="mdt-detail-status-row">' + pill(ins.status, insCls) + '</div>');
      section('INSPECTION INFO');
      row('Inspector', ins.inspector);
      row('Zone', ins.zoneId.replace('zone-','').replace(/-/g,' ').toUpperCase());
      row('Status', ins.status, insCls);
      row('Evidence Files', ins.evidenceCount);
      row('Time', ins.timestamp);
      section('NOTES');
      h.push('<div style="font-size:11px;color:#6f766f;padding:4px 0">' + ins.notes + '</div>');
      h.push('<div class="mdt-detail-sim-tag">📋 Data: SIMULATED</div>');
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn primary" onclick="showPage(\'inspection\')">New Inspection</button>');
      h.push('</div>');
    }
  } else if (type === 'zone') {
    var z = MDT_ZONES.filter(function(x) { return x.id === id; })[0];
    if (!z) { h.push('<p style="color:#999;font-size:12px">Not found</p>'); }
    else {
      h.push('<script>document.getElementById("mdt-detail-id-el").textContent="' + z.id + '";<\/script>');
      var zCls = z.riskLevel === 'HIGH' || z.riskLevel === 'CRITICAL' ? 'high' : z.riskLevel === 'MEDIUM' ? 'medium' : 'low';
      h.push('<div class="mdt-detail-status-row">' + riskPill(z.riskLevel) + '</div>');
      section('ZONE INFO');
      row('Name', z.name);
      row('Type', z.type.replace(/_/g,' '));
      row('Risk Score', z.riskScore + '/100', zCls);
      row('Environment', 'UNDERGROUND');
      h.push('<div class="mdt-detail-actions">');
      h.push('<button class="mdt-detail-action-btn primary" onclick="showPage(\'cases\')">View Cases</button>');
      h.push('</div>');
    }
  }

  return h.join('');
}

/* ========================================================================
   SECTION 13 — SEARCH
   ======================================================================== */

var MDT_SEARCH_INDEX = null;

function mdtBuildSearchIndex() {
  MDT_SEARCH_INDEX = [];
  MDT_WORKERS.forEach(function(w)    { MDT_SEARCH_INDEX.push({ id: w.id, name: w.name, type: 'worker' }); });
  MDT_EQUIPMENT.forEach(function(e)  { MDT_SEARCH_INDEX.push({ id: e.id, name: e.name, type: 'equipment' }); });
  MDT_SENSORS.forEach(function(s)    { MDT_SEARCH_INDEX.push({ id: s.id, name: s.name, type: 'sensor' }); });
  MDT_TUNNELS.forEach(function(t)    { MDT_SEARCH_INDEX.push({ id: t.id, name: t.name, type: 'tunnel' }); });
  MDT_INCIDENTS.forEach(function(i)  { MDT_SEARCH_INDEX.push({ id: i.id, name: i.title, type: 'incident' }); });
  MDT_INSPECTIONS.forEach(function(i){ MDT_SEARCH_INDEX.push({ id: i.id, name: 'Inspection ' + i.id, type: 'inspection' }); });
  MDT_ZONES.forEach(function(z)      { MDT_SEARCH_INDEX.push({ id: z.id, name: z.name, type: 'zone' }); });
}

function mdtHandleSearch(query) {
  MdtState.searchQuery = query.trim().toLowerCase();
  var results = document.getElementById('mdt-search-results');
  if (!results) return;

  if (!MDT_SEARCH_INDEX) mdtBuildSearchIndex();

  if (!MdtState.searchQuery) { results.className = 'mdt-search-results'; return; }

  var matches = MDT_SEARCH_INDEX.filter(function(item) {
    return item.id.toLowerCase().indexOf(MdtState.searchQuery) !== -1 ||
           item.name.toLowerCase().indexOf(MdtState.searchQuery) !== -1;
  }).slice(0, 8);

  if (matches.length === 0) {
    results.innerHTML = '<div class="mdt-search-item" style="color:#999">No results</div>';
    results.className = 'mdt-search-results visible';
    return;
  }

  var icons = { worker:'👷', equipment:'🔧', sensor:'📡', tunnel:'🚇', incident:'⚠️', inspection:'📋', zone:'📍' };
  results.innerHTML = matches.map(function(m) {
    return '<div class="mdt-search-item" onclick="mdtSearchSelect(\'' + m.type + '\',\'' + m.id + '\')">' +
      '<span style="font-size:12px">' + (icons[m.type]||'•') + '</span>' +
      '<span class="mdt-search-item-id">' + m.id + '</span>' +
      '<span class="mdt-search-item-name">' + m.name + '</span>' +
      '</div>';
  }).join('');
  results.className = 'mdt-search-results visible';
}

function mdtSearchSelect(type, id) {
  var results = document.getElementById('mdt-search-results');
  var input   = document.getElementById('mdt-search');
  if (results) results.className = 'mdt-search-results';
  if (input)   input.value = id;
  mdtSelectEntity(type, id);
}

/* ========================================================================
   SECTION 14 — FILTERS
   ======================================================================== */

function mdtApplyFilter(filterName, value) {
  MdtState['filter' + filterName.charAt(0).toUpperCase() + filterName.slice(1)] = value;
  mdtApplyFilterVisibility();
}

function mdtApplyFilterVisibility() {
  /* For entity filter: hide irrelevant layer groups */
  var entity = MdtState.filterEntity;
  var entityGroupMap = {
    workers:     'mdt-g-workers',
    equipment:   'mdt-g-equipment',
    sensors:     'mdt-g-sensors',
    incidents:   'mdt-g-incidents',
    inspections: 'mdt-g-inspections'
  };
  Object.keys(entityGroupMap).forEach(function(key) {
    var g = document.getElementById(entityGroupMap[key]);
    if (!g) return;
    var layerOn = MdtState.layers[key === 'workers' ? 'workers' : key === 'equipment' ? 'equipment' :
                                  key === 'sensors' ? 'sensors' : key === 'incidents' ? 'incidents' : 'inspections'];
    g.style.display = (entity === 'all' || entity === key) && layerOn ? '' : 'none';
  });
}

/* ========================================================================
   SECTION 15 — EMERGENCY MODE
   ======================================================================== */

function mdtToggleEmergency() {
  MdtState.emergencyMode = !MdtState.emergencyMode;
  var btn = document.getElementById('mdt-emergency-btn');
  if (btn) btn.className = 'mdt-emergency-btn' + (MdtState.emergencyMode ? ' active' : '');

  /* Close detail panel */
  var dp = document.getElementById('mdt-detail-panel');
  if (dp) dp.className = 'mdt-detail-panel';

  var ep = document.getElementById('mdt-emergency-panel');
  if (ep) ep.className = 'mdt-emergency-panel' + (MdtState.emergencyMode ? ' open' : '');

  if (MdtState.emergencyMode) {
    var inner = document.getElementById('mdt-emergency-inner');
    if (inner) inner.innerHTML = mdtBuildEmergencyHTML();
  }

  mdtRenderEmergencyOverlay();
}

function mdtBuildEmergencyHTML() {
  var affectedWorkers = MDT_WORKERS.filter(function(w) {
    return w.currentZone === 'zone-panel-b' || w.currentZone === 'zone-vent';
  });
  var h = [];
  h.push('<h3>🚨 EMERGENCY MODE</h3>');
  h.push('<p style="font-size:10px;color:#cc8888;margin:0 0 12px;border:1px solid #5a1a1a;padding:6px;border-radius:4px">');
  h.push('DEMONSTRATION ONLY · Not real emergency tracking · No UWB/RFID connected');
  h.push('</p>');

  function erow(key, val) {
    h.push('<div class="mdt-emergency-row"><span class="key">' + key + '</span><span class="val">' + val + '</span></div>');
  }

  erow('Incident', 'INC-2048');
  erow('Type', 'Ventilation Failure');
  erow('Location', 'T-03 / Panel B');
  erow('Severity', 'HIGH');
  erow('Risk Score', '87 / 100');
  erow('Nearest Refuge', 'RC-02');
  erow('Nearest Exit', 'SHAFT-01');
  erow('Status', 'ACTIVE — UNRESOLVED');

  h.push('<div class="mdt-emergency-workers">');
  h.push('<h4>Workers Potentially Affected (' + affectedWorkers.length + ')</h4>');
  affectedWorkers.forEach(function(w) {
    h.push('<div class="mdt-emergency-worker-item">');
    h.push('<span>👷</span><span>' + w.id + ' — ' + w.role + '</span>');
    h.push('</div>');
  });
  h.push('</div>');

  h.push('<button class="mdt-emergency-dismiss" onclick="mdtToggleEmergency()">✕ Dismiss Emergency Mode</button>');
  h.push('<p style="font-size:9px;color:#553333;margin:8px 0 0;text-align:center">SIMULATED DEMO — Not a live evacuation system</p>');
  return h.join('');
}

/* ========================================================================
   SECTION 16 — PUBLIC API (called from index.html onshow)
   ======================================================================== */

/* Called by showPage() when the 'map' page is activated */
function mdtOnShow() {
  if (!MdtState.initialized) {
    mdtInit();
  } else {
    /* Re-apply visibility and restart ticker if needed */
    mdtUpdateLayerVisibility();
    if (MdtState.simRunning && !MdtState.simTimer) mdtStartSimulation();
  }
}

/* Called by showPage() when navigating AWAY from map */
function mdtOnHide() {
  /* Pause sim when not visible to avoid wasted computation */
  if (MdtState.simTimer) { clearInterval(MdtState.simTimer); MdtState.simTimer = null; }
}

/* ========================================================================
   SECTION 17 — DEMO SCENARIOS & ALERTS INTEGRATION
   ======================================================================== */

function mdtHighlightEntity(entityId, zoneId) {
  // Clear any existing search highlights
  mdtClearSearch();
  
  var targetX = 500;
  var targetY = 340;
  
  if (entityId) {
     var w = MDT_WORKERS.find(function(worker) { return worker.id === entityId; });
     if (w) {
       targetX = w.x;
       targetY = w.y;
       mdtSelectEntity('worker', entityId);
     }
     var eq = MDT_EQUIPMENT.find(function(equipment) { return equipment.id === entityId; });
     if (eq) {
       targetX = eq.x;
       targetY = eq.y;
       mdtSelectEntity('equipment', entityId);
     }
     var s = MDT_SENSORS.find(function(sensor) { return sensor.id === entityId; });
     if (s) {
       targetX = s.x;
       targetY = s.y;
       mdtSelectEntity('sensor', entityId);
     }
  } else if (zoneId) {
     var z = MDT_ZONES.find(function(zone) { return zone.id === zoneId; });
     if (z) {
       targetX = z.x + (z.w / 2);
       targetY = z.y + (z.h / 2);
       mdtSelectEntity('zone', zoneId);
     }
  }

  // Smoothly center and scale
  MdtState.scale = 1.35;
  MdtState.translateX = Math.round((500 - targetX) * MdtState.scale);
  MdtState.translateY = Math.round((340 - targetY) * MdtState.scale);
  mdtApplyTransform();
}

function runDemoScenario(scenario) {
  var worker = MDT_WORKERS.find(function(w) { return w.id === 'M-1024'; });
  var rZone = MDT_ZONES.find(function(z) { return z.id === 'zone-restricted'; });
  
  if (!worker || !rZone) return;

  if (scenario === 'ENTER_RESTRICTED') {
    // Teleport worker inside the restricted zone
    worker.x = rZone.x + 20;
    worker.y = rZone.y + 20;
    if (window.GeofenceEngine) GeofenceEngine.resetState(worker.id);
    mdtUpdateWorkerPositions();
    if (!MdtState.simRunning) mdtSimTick(); // Force tick
    toast('Simulated M-1024 entering Restricted Zone');
  } 
  else if (scenario === 'EXIT_RESTRICTED') {
    // Teleport out to main tunnel
    var mainZone = MDT_ZONES.find(function(z) { return z.id === 'zone-main-tunnel'; });
    worker.x = mainZone.x + 100;
    worker.y = mainZone.y + 20;
    mdtUpdateWorkerPositions();
    if (!MdtState.simRunning) mdtSimTick();
    toast('Simulated M-1024 exiting Restricted Zone');
  }
  else if (scenario === 'RE_ENTER_RESTRICTED') {
    worker.x = rZone.x + 40;
    worker.y = rZone.y + 40;
    mdtUpdateWorkerPositions();
    if (!MdtState.simRunning) mdtSimTick();
    toast('Simulated M-1024 re-entering Restricted Zone');
  }
  else if (scenario === 'EMERGENCY') {
    mdtToggleEmergency();
    // In emergency, force the ventilation zone into emergency state
    var ventZone = MDT_ZONES.find(function(z) { return z.id === 'zone-vent'; });
    if (ventZone && window.AlertSystem) {
       AlertSystem.generateEvent({
         eventType: 'EMERGENCY_ZONE_ENTRY',
         severity: 'CRITICAL',
         entityId: 'SYSTEM',
         entityType: 'SENSOR',
         zoneId: ventZone.id,
         description: 'Emergency declared in Ventilation Zone'
       });
    }
    toast('Simulated Emergency Activated');
  }
}

/* ========================================================================
   SECTION 18 — CLEANUP GUARD
   ======================================================================== */

/* Ensure simulation is stopped when page is unloaded */
window.addEventListener('beforeunload', function() { mdtOnHide(); });
