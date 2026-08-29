/**
 * SIH26024 — AI-Based Smart Governance and Compliance Monitoring System
 * Domain Types & Interfaces
 *
 * PURPOSE: Canonical type definitions for the entire SIH domain.
 * IMPORTANT: These are design-time types / documentation artifacts.
 *            They do NOT replace or alter any existing app.js / style.css functionality.
 *
 * Convention:
 *   - All IDs are string (UUID or slug-style).
 *   - Timestamps are ISO-8601 strings for JSON compatibility.
 *   - Enums are string-literal union types (not TypeScript enum)
 *     so values survive JSON serialisation without transformation.
 */

// --- Primitive Identifiers ---
export type MineId         = string;
export type ZoneId         = string;
export type TunnelId       = string;
export type WorkerId       = string;
export type EquipmentId    = string;
export type SensorId       = string;
export type InspectionId   = string;
export type CaseId         = string;
export type EvidenceId     = string;
export type ContractorId   = string;
export type DocumentId     = string;
export type AuditEventId   = string;
export type NotificationId = string;

// --- Environment & Positioning ---
/** Physical environment where an entity exists. */
export type Environment = 'SURFACE' | 'UNDERGROUND';

/**
 * Positioning technology used to determine a location.
 * RULE: GPS is a SURFACE-only technology.
 *       Underground positioning must use UWB, RFID, BLE, or SIMULATED.
 *       SIMULATED must NEVER be presented as live operational data.
 */
export type PositioningMethod = 'GPS' | 'UWB' | 'RFID' | 'BLE' | 'SIMULATED';

// --- Status & Level Enums ---
export type RiskLevel    = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type SensorStatus = 'NORMAL' | 'FALLING' | 'WARNING' | 'DANGER' | 'OFFLINE';
export type CaseStatus   = 'OPEN' | 'IN_PROGRESS' | 'PROOF_UPLOADED' | 'UNDER_REVIEW' | 'RESOLVED' | 'RE_OPENED' | 'CLOSED_VERIFIED' | 'ESCALATED';
export type InspectionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'ACTIONED';
export type EvidenceType = 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'SENSOR_LOG' | 'OCR_EXTRACTED';
export type ZoneType     = 'WORKING_FACE' | 'VENTILATION' | 'TRANSPORT_ROADWAY' | 'SHAFT' | 'SURFACE_FACILITY' | 'MAINTENANCE_YARD' | 'EQUIPMENT_STORAGE' | 'REFUGE_CHAMBER';
export type SensorType   = 'METHANE' | 'CARBON_MONOXIDE' | 'OXYGEN' | 'AIR_FLOW' | 'TEMPERATURE' | 'ROOF_MOVEMENT' | 'HUMIDITY' | 'DUST_PARTICLE';
export type WorkerRole   = 'SAFETY_OFFICER' | 'VENTILATION_ENGINEER' | 'MAINTENANCE_LEAD' | 'GENERAL_MANAGER' | 'DGMS_INSPECTOR' | 'MINER' | 'SUPERVISOR' | 'CONTRACTOR_WORKER';
export type EquipmentStatus = 'OPERATIONAL' | 'DEGRADED' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';
export type NotificationChannel  = 'IN_APP' | 'SMS' | 'EMAIL' | 'PUSH';
export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// --- Location Interface ---
/**
 * Supports both surface (GPS) and underground (X/Y/Z + zone) coordinates.
 * latitude/longitude MUST be null when environment === 'UNDERGROUND'.
 * x, y, z are local mine coordinate system values in metres from origin.
 * positioningMethod === 'GPS' is only valid when environment === 'SURFACE'.
 */
export interface Location {
  entityId: string;
  entityType: 'WORKER' | 'EQUIPMENT' | 'SENSOR' | 'VEHICLE';
  mineId: MineId;
  environment: Environment;
  positioningMethod: PositioningMethod;
  latitude:  number | null;
  longitude: number | null;
  x: number | null;
  y: number | null;
  z: number | null;
  zoneId:   ZoneId   | null;
  tunnelId: TunnelId | null;
  accuracy:  number;
  timestamp: string;
  status: 'ACTIVE' | 'STALE' | 'LOST';
}

// --- Core Entities ---
export interface Mine {
  id: MineId;
  name: string;
  company: string;
  dgmsCode: string;
  state: string;
  district: string;
  latitude:  number;
  longitude: number;
  depthMetres: number;
  activeSince: string;
  isActive: boolean;
}

export interface Zone {
  id: ZoneId;
  mineId: MineId;
  name: string;
  type: ZoneType;
  environment: Environment;
  description: string;
  currentRiskLevel: RiskLevel;
}

export interface Tunnel {
  id: TunnelId;
  mineId: MineId;
  zoneId: ZoneId;
  name: string;
  lengthMetres: number;
  widthMetres:  number;
  heightMetres: number;
  isActive: boolean;
}

export interface Worker {
  id: WorkerId;
  mineId: MineId;
  contractorId: ContractorId | null;
  name: string;
  employeeCode: string;
  role: WorkerRole;
  department: string;
  lastKnownLocation: Location | null;
  isOnShift: boolean;
  shiftStartTime: string | null;
}

export interface Equipment {
  id: EquipmentId;
  mineId: MineId;
  zoneId: ZoneId | null;
  name: string;
  type: string;
  serialNumber: string;
  status: EquipmentStatus;
  lastMaintenanceDate: string;
  lastKnownLocation: Location | null;
}

export interface Sensor {
  id: SensorId;
  mineId: MineId;
  zoneId: ZoneId;
  tunnelId: TunnelId | null;
  type: SensorType;
  label: string;
  unit: string;
  safeMin: number | null;
  safeMax: number;
  currentValue: number;
  currentStatus: SensorStatus;
  lastReadingAt: string;
  isOnline: boolean;
  location: Pick<Location, 'x' | 'y' | 'z' | 'zoneId' | 'tunnelId' | 'environment'>;
}

export interface SensorReading {
  sensorId: SensorId;
  value: number;
  status: SensorStatus;
  timestamp: string;
  isAlert: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isChecked: boolean;
  notes: string;
}

export interface Inspection {
  id: InspectionId;
  mineId: MineId;
  zoneId: ZoneId;
  conductedBy: WorkerId;
  conductedAt: string;
  status: InspectionStatus;
  checklist: ChecklistItem[];
  notes: string;
  evidenceIds: EvidenceId[];
  raisedCaseIds: CaseId[];
  regulatoryRuleRefs: string[];
  wasOffline: boolean;
}

export interface CorrectiveAction {
  id: string;
  caseId: CaseId;
  takenBy: WorkerId;
  takenAt: string;
  description: string;
  evidenceIds: EvidenceId[];
  sensorTestPassed: boolean | null;
}

export interface AuditEvent {
  id: AuditEventId;
  entityType: 'CASE' | 'INSPECTION' | 'EVIDENCE' | 'WORKER' | 'SENSOR';
  entityId: string;
  action: string;
  performedBy: WorkerId | 'SYSTEM';
  performedAt: string;
  details: string;
  metadata: Record<string, unknown>;
}

export interface Case {
  id: CaseId;
  mineId: MineId;
  zoneId: ZoneId;
  title: string;
  description: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  source: 'SENSOR_AUTO' | 'INSPECTION' | 'MANUAL' | 'ESCALATION';
  assignedTo: WorkerId | null;
  assignedAt: string | null;
  deadline: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  verifiedBy: WorkerId | null;
  evidenceIds: EvidenceId[];
  relatedInspectionId: InspectionId | null;
  relatedSensorIds: SensorId[];
  recurrenceCount: number;
  correctiveActions: CorrectiveAction[];
  auditTrail: AuditEvent[];
  regulatoryRuleRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: EvidenceId;
  caseId: CaseId | null;
  inspectionId: InspectionId | null;
  type: EvidenceType;
  fileName: string;
  fileSizeBytes: number;
  uploadedBy: WorkerId;
  uploadedAt: string;
  isVerified: boolean | null;
  description: string;
  ocrText: string | null;
}

export interface Contractor {
  id: ContractorId;
  name: string;
  registrationNumber: string;
  contactPerson: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  mineIds: MineId[];
  isActive: boolean;
}

export interface Document {
  id: DocumentId;
  mineId: MineId;
  title: string;
  type: 'PERMIT' | 'REPORT' | 'REGULATION' | 'CERTIFICATE' | 'INSPECTION_FORM';
  fileRef: string;
  uploadedBy: WorkerId;
  uploadedAt: string;
  expiresAt: string | null;
  ocrExtracted: Record<string, unknown> | null;
}

export interface RiskFactor {
  label: string;
  points: number;
  category: 'SENSOR' | 'RECURRENCE' | 'SLA' | 'INSPECTION' | 'HISTORICAL';
  severity: RiskLevel;
}

export interface RiskAssessment {
  id: string;
  mineId: MineId;
  zoneId: ZoneId;
  computedAt: string;
  overallScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  /** IMPORTANT: isSimulated=true means this is NOT live mine data. */
  isSimulated: boolean;
}

export interface Notification {
  id: NotificationId;
  recipientId: WorkerId;
  severity: NotificationSeverity;
  title: string;
  body: string;
  channel: NotificationChannel;
  relatedEntityType: 'CASE' | 'INSPECTION' | 'SENSOR' | 'WORKER' | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface DepartmentScore {
  department: string;
  mineId: MineId;
  score: number;
  totalProblems: number;
  lateFixCount: number;
  recurrenceCount: number;
  computedAt: string;
}
