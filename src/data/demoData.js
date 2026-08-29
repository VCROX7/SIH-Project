/**
 * SIH26024 — DEMO DATA LAYER
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * IMPORTANT DISCLAIMER
 * All data in this file is SYNTHETIC / SIMULATED.
 * It is designed to demonstrate the system capabilities only.
 * It DOES NOT represent real mine operations, real workers, or
 * real sensor readings from any physical mine.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * This data is the single source of truth for all demo/preview pages.
 * It mirrors the state already shown in the existing index.html / app.js
 * so the UI continues to work unchanged.
 */

// ----- SIMULATED DATA FLAG (always check before displaying to users) --------
var DEMO_DATA_IS_SIMULATED = true;

// =============================================================================
// MINE
// =============================================================================
var DEMO_MINE = {
  id: 'mine-ccl-04',
  name: 'Central Coalfields — Unit 04',
  company: 'Coal India Limited',
  dgmsCode: 'CCL/JHK/04/2011',
  state: 'Jharkhand',
  district: 'Bokaro',
  latitude:  23.6567,
  longitude: 86.1511,
  depthMetres: 340,
  activeSince: '2011-04-01',
  isActive: true
};

// =============================================================================
// ZONES
// =============================================================================
var DEMO_ZONES = [
  {
    id: 'zone-ventilation',
    mineId: 'mine-ccl-04',
    name: 'Ventilation Area',
    type: 'VENTILATION',
    environment: 'UNDERGROUND',
    description: 'Sector 4 — primary ventilation duct and fan motor section.',
    currentRiskLevel: 'HIGH'
  },
  {
    id: 'zone-equipment',
    mineId: 'mine-ccl-04',
    name: 'Equipment Block',
    type: 'EQUIPMENT_STORAGE',
    environment: 'UNDERGROUND',
    description: 'Storage and staging area for mining equipment and PPE.',
    currentRiskLevel: 'MEDIUM'
  },
  {
    id: 'zone-north',
    mineId: 'mine-ccl-04',
    name: 'North Section',
    type: 'WORKING_FACE',
    environment: 'UNDERGROUND',
    description: 'Northern working face — longwall extraction area.',
    currentRiskLevel: 'LOW'
  },
  {
    id: 'zone-maintenance',
    mineId: 'mine-ccl-04',
    name: 'Maintenance Yard',
    type: 'MAINTENANCE_YARD',
    environment: 'SURFACE',
    description: 'Surface maintenance and repair yard.',
    currentRiskLevel: 'LOW'
  },
  {
    id: 'zone-tailgate',
    mineId: 'mine-ccl-04',
    name: 'Tailgate Section',
    type: 'TRANSPORT_ROADWAY',
    environment: 'UNDERGROUND',
    description: 'Tailgate roadway adjacent to the longwall face.',
    currentRiskLevel: 'MEDIUM'
  }
];

// =============================================================================
// TUNNELS
// =============================================================================
var DEMO_TUNNELS = [
  {
    id: 'tunnel-vent-duct',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    name: 'Ventilation Duct Tunnel',
    lengthMetres: 480,
    widthMetres: 4.5,
    heightMetres: 3.2,
    isActive: true
  },
  {
    id: 'tunnel-tailgate',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-tailgate',
    name: 'Tailgate Roadway',
    lengthMetres: 620,
    widthMetres: 3.8,
    heightMetres: 2.9,
    isActive: true
  }
];

// =============================================================================
// WORKERS  (SIMULATED — not real individuals)
// =============================================================================
var DEMO_WORKERS = [
  {
    id: 'worker-rk-01',
    mineId: 'mine-ccl-04',
    contractorId: null,
    name: 'Raj Kumar',
    employeeCode: 'CCL-SO-4421',
    role: 'SAFETY_OFFICER',
    department: 'Safety',
    lastKnownLocation: null,
    isOnShift: true,
    shiftStartTime: '2026-08-27T06:00:00+05:30'
  },
  {
    id: 'worker-am-01',
    mineId: 'mine-ccl-04',
    contractorId: null,
    name: 'Dr. A. K. Mishra',
    employeeCode: 'CCL-GM-0021',
    role: 'GENERAL_MANAGER',
    department: 'Management',
    lastKnownLocation: null,
    isOnShift: true,
    shiftStartTime: '2026-08-27T08:00:00+05:30'
  },
  {
    id: 'worker-ss-01',
    mineId: 'mine-ccl-04',
    contractorId: null,
    name: 'S. N. Sengupta',
    employeeCode: 'DGMS-INS-0188',
    role: 'DGMS_INSPECTOR',
    department: 'DGMS',
    lastKnownLocation: null,
    isOnShift: false,
    shiftStartTime: null
  },
  {
    id: 'worker-ve-01',
    mineId: 'mine-ccl-04',
    contractorId: null,
    name: 'Ventilation Engineer (Demo)',
    employeeCode: 'CCL-VE-0089',
    role: 'VENTILATION_ENGINEER',
    department: 'Ventilation',
    lastKnownLocation: null,
    isOnShift: true,
    shiftStartTime: '2026-08-27T06:00:00+05:30'
  },
  {
    id: 'worker-ml-01',
    mineId: 'mine-ccl-04',
    contractorId: null,
    name: 'Maintenance Lead (Demo)',
    employeeCode: 'CCL-ML-0047',
    role: 'MAINTENANCE_LEAD',
    department: 'Maintenance',
    lastKnownLocation: null,
    isOnShift: true,
    shiftStartTime: '2026-08-27T06:00:00+05:30'
  }
];

// =============================================================================
// EQUIPMENT  (SIMULATED)
// =============================================================================
var DEMO_EQUIPMENT = [
  {
    id: 'equip-fanmotor-03',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    name: 'Air Fan Motor #3',
    type: 'VENTILATION_FAN',
    serialNumber: 'FM-2019-003',
    status: 'DEGRADED',
    lastMaintenanceDate: '2026-07-15',
    lastKnownLocation: null
  },
  {
    id: 'equip-conveyor-01',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-maintenance',
    name: 'Conveyor Belt — Sector 2',
    type: 'CONVEYOR_BELT',
    serialNumber: 'CB-2021-001',
    status: 'OPERATIONAL',
    lastMaintenanceDate: '2026-08-10',
    lastKnownLocation: null
  },
  {
    id: 'equip-roofbolt-01',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-tailgate',
    name: 'Roof Bolt Drill #1',
    type: 'DRILL',
    serialNumber: 'RBD-2022-001',
    status: 'OPERATIONAL',
    lastMaintenanceDate: '2026-08-20',
    lastKnownLocation: null
  }
];

// =============================================================================
// SENSORS  (SIMULATED — these mirror what app.js displays in the Live Sensor page)
// =============================================================================
var DEMO_SENSORS = [
  {
    id: 'sensor-ch4-vent',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    tunnelId: 'tunnel-vent-duct',
    type: 'METHANE',
    label: 'Methane Gas (CH4) — Ventilation Area',
    unit: '%',
    safeMin: null,
    safeMax: 0.75,
    currentValue: 0.42,
    currentStatus: 'NORMAL',
    lastReadingAt: '2026-08-27T08:00:00+05:30',
    isOnline: true,
    location: { x: 120, y: 45, z: -180, zoneId: 'zone-ventilation', tunnelId: 'tunnel-vent-duct', environment: 'UNDERGROUND' }
  },
  {
    id: 'sensor-co-conveyor',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-maintenance',
    tunnelId: null,
    type: 'CARBON_MONOXIDE',
    label: 'Carbon Monoxide (CO) — Conveyor Belt Area',
    unit: 'ppm',
    safeMin: null,
    safeMax: 25,
    currentValue: 18,
    currentStatus: 'NORMAL',
    lastReadingAt: '2026-08-27T08:00:00+05:30',
    isOnline: true,
    location: { x: 80, y: -20, z: -50, zoneId: 'zone-maintenance', tunnelId: null, environment: 'SURFACE' }
  },
  {
    id: 'sensor-o2-longwall',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-north',
    tunnelId: null,
    type: 'OXYGEN',
    label: 'Oxygen Level (O2) — Longwall Work Area',
    unit: '%',
    safeMin: 19.5,
    safeMax: 21.0,
    currentValue: 20.4,
    currentStatus: 'NORMAL',
    lastReadingAt: '2026-08-27T08:00:00+05:30',
    isOnline: true,
    location: { x: -40, y: 80, z: -340, zoneId: 'zone-north', tunnelId: null, environment: 'UNDERGROUND' }
  },
  {
    id: 'sensor-airflow-duct',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    tunnelId: 'tunnel-vent-duct',
    type: 'AIR_FLOW',
    label: 'Air Speed — Ventilation Duct',
    unit: 'm/s',
    safeMin: 3.5,
    safeMax: 8.0,
    currentValue: 3.2,
    currentStatus: 'FALLING',
    lastReadingAt: '2026-08-27T08:00:00+05:30',
    isOnline: true,
    location: { x: 100, y: 40, z: -180, zoneId: 'zone-ventilation', tunnelId: 'tunnel-vent-duct', environment: 'UNDERGROUND' }
  },
  {
    id: 'sensor-temp-deep',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-north',
    tunnelId: null,
    type: 'TEMPERATURE',
    label: 'Temperature — Deep Mine Sector',
    unit: 'C',
    safeMin: null,
    safeMax: 36,
    currentValue: 34,
    currentStatus: 'NORMAL',
    lastReadingAt: '2026-08-27T08:00:00+05:30',
    isOnline: true,
    location: { x: -60, y: 100, z: -340, zoneId: 'zone-north', tunnelId: null, environment: 'UNDERGROUND' }
  },
  {
    id: 'sensor-roof-tailgate',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-tailgate',
    tunnelId: 'tunnel-tailgate',
    type: 'ROOF_MOVEMENT',
    label: 'Roof Movement — Tailgate Section',
    unit: 'mm',
    safeMin: null,
    safeMax: 10,
    currentValue: 12,
    currentStatus: 'WARNING',
    lastReadingAt: '2026-08-27T08:00:00+05:30',
    isOnline: true,
    location: { x: 200, y: -80, z: -220, zoneId: 'zone-tailgate', tunnelId: 'tunnel-tailgate', environment: 'UNDERGROUND' }
  }
];

// =============================================================================
// HISTORICAL SENSOR READINGS  (SIMULATED — for trend chart)
// =============================================================================
var DEMO_MONTHLY_SAFETY_TREND = [
  { month: 'Mar', score: 58, isSimulated: true },
  { month: 'Apr', score: 64, isSimulated: true },
  { month: 'May', score: 61, isSimulated: true },
  { month: 'Jun', score: 72, isSimulated: true },
  { month: 'Jul', score: 79, isSimulated: true },
  { month: 'Aug', score: 87, isSimulated: true }
];

// =============================================================================
// CASES  (SIMULATED)
// =============================================================================
var DEMO_CASES = [
  {
    id: 'case-2048',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    title: 'Air Speed Anomaly — Ventilation Area',
    description: 'Air speed dropped to 3.2 m/s, below safe minimum of 3.5 m/s.',
    status: 'OPEN',
    riskLevel: 'HIGH',
    source: 'SENSOR_AUTO',
    assignedTo: 'worker-ve-01',
    assignedAt: '2026-08-27T08:05:00+05:30',
    deadline: '2026-08-27T12:05:00+05:30',
    resolvedAt: null,
    closedAt: null,
    verifiedBy: null,
    evidenceIds: [],
    relatedInspectionId: null,
    relatedSensorIds: ['sensor-airflow-duct', 'sensor-ch4-vent'],
    recurrenceCount: 3,
    correctiveActions: [],
    auditTrail: [
      {
        id: 'audit-2048-01',
        entityType: 'CASE', entityId: 'case-2048',
        action: 'CASE_OPENED',
        performedBy: 'SYSTEM',
        performedAt: '2026-08-27T08:00:00+05:30',
        details: 'Sensor detected low air speed (3.2 m/s). Case #2048 created.',
        metadata: { sensorId: 'sensor-airflow-duct', value: 3.2 }
      },
      {
        id: 'audit-2048-02',
        entityType: 'CASE', entityId: 'case-2048',
        action: 'CASE_ASSIGNED',
        performedBy: 'SYSTEM',
        performedAt: '2026-08-27T08:05:00+05:30',
        details: 'Assigned to Ventilation Engineer. 4-hour clock started.',
        metadata: { assignedTo: 'worker-ve-01' }
      },
      {
        id: 'audit-2048-03',
        entityType: 'CASE', entityId: 'case-2048',
        action: 'SLA_BREACH',
        performedBy: 'SYSTEM',
        performedAt: '2026-08-27T12:05:00+05:30',
        details: '4 hours passed without fix. Alert sent to Head Officer.',
        metadata: { slaDurationHours: 4 }
      }
    ],
    regulatoryRuleRefs: ['RULE 218'],
    createdAt: '2026-08-27T08:00:00+05:30',
    updatedAt: '2026-08-27T12:05:00+05:30'
  },
  {
    id: 'case-2049',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-tailgate',
    title: 'Roof Movement — Tailgate Area',
    description: 'Roof displacement sensor recorded 12 mm, above 10 mm safe limit.',
    status: 'PROOF_UPLOADED',
    riskLevel: 'MEDIUM',
    source: 'SENSOR_AUTO',
    assignedTo: 'worker-rk-01',
    assignedAt: '2026-08-27T07:00:00+05:30',
    deadline: '2026-08-27T19:00:00+05:30',
    resolvedAt: null,
    closedAt: null,
    verifiedBy: null,
    evidenceIds: ['evidence-2049-01'],
    relatedInspectionId: null,
    relatedSensorIds: ['sensor-roof-tailgate'],
    recurrenceCount: 0,
    correctiveActions: [],
    auditTrail: [],
    regulatoryRuleRefs: [],
    createdAt: '2026-08-27T07:00:00+05:30',
    updatedAt: '2026-08-27T09:30:00+05:30'
  },
  {
    id: 'case-1821',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    title: 'Air Fan Seal Leak — Ventilation Shaft',
    description: 'Air fan motor seal leak. Case was previously resolved but problem returned.',
    status: 'RE_OPENED',
    riskLevel: 'HIGH',
    source: 'INSPECTION',
    assignedTo: 'worker-ml-01',
    assignedAt: '2026-08-24T10:00:00+05:30',
    deadline: '2026-08-24T10:00:00+05:30',
    resolvedAt: null,
    closedAt: null,
    verifiedBy: null,
    evidenceIds: [],
    relatedInspectionId: null,
    relatedSensorIds: ['sensor-airflow-duct'],
    recurrenceCount: 2,
    correctiveActions: [],
    auditTrail: [],
    regulatoryRuleRefs: ['RULE 104'],
    createdAt: '2026-08-10T09:00:00+05:30',
    updatedAt: '2026-08-27T08:00:00+05:30'
  },
  {
    id: 'case-2045',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-maintenance',
    title: 'Belt Dust Accumulation — Maintenance Yard',
    description: 'Excessive coal dust on conveyor belt. Cleaned and verified.',
    status: 'CLOSED_VERIFIED',
    riskLevel: 'LOW',
    source: 'INSPECTION',
    assignedTo: 'worker-rk-01',
    assignedAt: '2026-08-25T08:00:00+05:30',
    deadline: '2026-08-25T16:00:00+05:30',
    resolvedAt: '2026-08-25T14:30:00+05:30',
    closedAt: '2026-08-25T15:00:00+05:30',
    verifiedBy: 'worker-rk-01',
    evidenceIds: ['evidence-2045-01'],
    relatedInspectionId: 'inspect-001',
    relatedSensorIds: [],
    recurrenceCount: 0,
    correctiveActions: [],
    auditTrail: [],
    regulatoryRuleRefs: [],
    createdAt: '2026-08-25T08:00:00+05:30',
    updatedAt: '2026-08-25T15:00:00+05:30'
  }
];

// =============================================================================
// INSPECTIONS  (SIMULATED)
// =============================================================================
var DEMO_INSPECTIONS = [
  {
    id: 'inspect-001',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-maintenance',
    conductedBy: 'worker-rk-01',
    conductedAt: '2026-08-25T08:00:00+05:30',
    status: 'ACTIONED',
    checklist: [
      { id: 'chk-01', label: 'Air ventilation working', isChecked: true, notes: '' },
      { id: 'chk-02', label: 'Safety gear available', isChecked: true, notes: '' },
      { id: 'chk-03', label: 'Emergency exits clear', isChecked: true, notes: '' },
      { id: 'chk-04', label: 'Workers wearing helmets and boots', isChecked: true, notes: '' },
      { id: 'chk-05', label: 'Dust control active', isChecked: false, notes: 'Belt dust found — case raised' },
      { id: 'chk-06', label: 'Equipment in good condition', isChecked: true, notes: '' }
    ],
    notes: 'Routine weekly inspection. Belt dust issue found and reported.',
    evidenceIds: [],
    raisedCaseIds: ['case-2045'],
    regulatoryRuleRefs: ['RULE 302'],
    wasOffline: false
  }
];

// =============================================================================
// RISK ASSESSMENTS  (SIMULATED — mirrors Risk Score page)
// =============================================================================
var DEMO_RISK_ASSESSMENTS = [
  {
    id: 'risk-zone-vent-20260827',
    mineId: 'mine-ccl-04',
    zoneId: 'zone-ventilation',
    computedAt: '2026-08-27T08:05:00+05:30',
    overallScore: 87,
    riskLevel: 'HIGH',
    factors: [
      { label: 'Methane gas rising', points: 30, category: 'SENSOR', severity: 'HIGH' },
      { label: 'Air speed falling', points: 20, category: 'SENSOR', severity: 'HIGH' },
      { label: 'Same problem happened before (3 times)', points: 15, category: 'RECURRENCE', severity: 'MEDIUM' },
      { label: 'Fix was delayed past 4 hours', points: 12, category: 'SLA', severity: 'MEDIUM' },
      { label: 'Inspector notes about air fan', points: 10, category: 'INSPECTION', severity: 'LOW' }
    ],
    isSimulated: true
  }
];

// =============================================================================
// DEPARTMENT SCORES  (SIMULATED)
// =============================================================================
var DEMO_DEPARTMENT_SCORES = [
  {
    department: 'Ventilation Team',
    mineId: 'mine-ccl-04',
    score: 62,
    totalProblems: 5,
    lateFixCount: 2,
    recurrenceCount: 3,
    computedAt: '2026-08-27T08:00:00+05:30'
  },
  {
    department: 'Safety Team',
    mineId: 'mine-ccl-04',
    score: 91,
    totalProblems: 8,
    lateFixCount: 0,
    recurrenceCount: 0,
    computedAt: '2026-08-27T08:00:00+05:30'
  },
  {
    department: 'Maintenance Team',
    mineId: 'mine-ccl-04',
    score: 54,
    totalProblems: 6,
    lateFixCount: 3,
    recurrenceCount: 2,
    computedAt: '2026-08-27T08:00:00+05:30'
  }
];

// =============================================================================
// REPEATED ISSUES  (SIMULATED — mirrors Repeated Problems section)
// =============================================================================
var DEMO_REPEATED_ISSUES = [
  {
    issueType: 'Missing Helmets and Safety Gear',
    zoneId: 'zone-equipment',
    occurrences: [
      { date: '2026-01-14', description: 'Missing gear — Officer gave warning', isCurrent: false },
      { date: '2026-03-02', description: 'Missing gear — Officer gave warning', isCurrent: false },
      { date: '2026-04-19', description: 'Missing gear — Officer gave warning', isCurrent: false },
      { date: '2026-06-28', description: 'Missing gear again — Problem repeated', isCurrent: true }
    ],
    conclusion: 'Giving only verbal warnings did not work. New rule: Mandatory supervisor sign-in checklist every morning.',
    isSimulated: true
  }
];

// =============================================================================
// CONTRACTORS  (SIMULATED — placeholder for future contractor management)
// =============================================================================
var DEMO_CONTRACTORS = [
  {
    id: 'contractor-01',
    name: 'Jharkhand Mining Services Pvt. Ltd.',
    registrationNumber: 'JH-MIN-2019-0041',
    contactPerson: 'Ramesh Sharma',
    contactPhone: '+91-9800000001',
    contractStartDate: '2025-04-01',
    contractEndDate: '2027-03-31',
    mineIds: ['mine-ccl-04'],
    isActive: true
  }
];

// Freeze all demo objects so they are not mutated accidentally by UI code
if (typeof Object.freeze === 'function') {
  Object.freeze(DEMO_MINE);
  Object.freeze(DEMO_ZONES);
  Object.freeze(DEMO_SENSORS);
  Object.freeze(DEMO_CASES);
  Object.freeze(DEMO_DEPARTMENT_SCORES);
  Object.freeze(DEMO_RISK_ASSESSMENTS);
}
