/**
 * SIH26024 — Industrial Command Center & Governance Controller
 * FILE: app.js
 * PURPOSE: Central UI routing, authentication flow, operational telemetry updates,
 *          dynamic Case Workspace, SLA Countdown, Evidence Upload, and Resolution gates.
 */

'use strict';

var currentLang = 'en';
var currentPageId = 'dashboard';
var currentCaseFilter = 'ALL';
var currentCaseSearch = '';
var selectedEvidenceFile = null;
var selectedEvidenceDataUrl = null;

var pageTitles = {
  en: {
    dashboard: ['Tactical Mine Command Overview', 'Operational safety telemetry, hazard state, and compliance index · 29 August 2026'],
    map: ['Mine Command Center & Spatial Digital Twin', 'Interactive CAD & GIS visualization of underground tunnels, workers, equipment, and risk zones'],
    sensors: ['Live IoT Sensor Telemetry Stream', 'Real-time underground multi-gas, ventilation velocity, and strata convergence readings'],
    ai: ['Risk Synthesis & Recurrence Forensic Engine', 'Multi-factor hazard scoring, anomaly explanation, and false-closure integrity audits'],
    alerts: ['Classified Safety Alert Center', 'Real-time telemetry and geofence alerts stream with instant triage and case escalation'],
    cases: ['Hazard Resolution & Statutory SLA Pipeline', 'End-to-end master-detail case solver from autonomous anomaly detection to verified closure'],
    inspection: ['Field Inspection Dossier (Offline-First)', 'Geo-tagged field observation recording with local storage queue and sensor validation'],
    evidence: ['Cryptographic Evidence Verification Workspace', 'Tamper-evident photo proof vault with SHA-256 hash checks and geotag integrity'],
    audit: ['Immutable Audit Trail (DGMS Regulatory Log)', 'Permanent, tamper-evident chronological event log tracking every anomaly and case transition'],
    accountability: ['Department Accountability & Rules Compliance', 'Performance metrics tracking on-time resolution and Coal Mines Regulations (CMR) 2017 checks'],
    reports: ['Statutory Regulatory Reports', 'Generate verified compliance dossiers and DGMS-ready audit summaries']
  },
  hi: {
    dashboard: ['खदान अवलोकन (Executive Overview)', 'खदान सुरक्षा एवं अनुपालन अवलोकन · 29 अगस्त 2026'],
    map: ['खदान डिजिटल नक्शा (Mine Command Center)', 'खदान के विभिन्न क्षेत्रों का तकनीकी 2D नक्शा'],
    sensors: ['लाइव सेंसर निगरानी (Live Sensors)', 'भूमिगत वायु एवं सुरक्षा सेंसर का सीधा प्रसारण'],
    ai: ['जोखिम विश्लेषण (Risk & AI)', 'जोखिम स्कोर के कारण एवं बार-बार होने वाली समस्याएं'],
    alerts: ['अलर्ट केंद्र (Alert Center)', 'वास्तविक समय के सुरक्षा और जिओफेंस अलर्ट'],
    cases: ['मामले सुलझाएं (Solve Cases)', 'समस्या की पहचान से समाधान तक का चरणबद्ध ट्रैकर'],
    inspection: ['फील्ड निरीक्षण (Field Inspection)', 'फील्ड निरीक्षण विवरण एवं सुरक्षा चेकलिस्ट दर्ज करें'],
    evidence: ['साक्ष्य सत्यापन (Evidence Vault)', 'तस्वीर और डिजिटल साक्ष्य का SHA-256 सत्यापन'],
    audit: ['ऑडिट ट्रेल (Audit Trail)', 'सभी घटनाओं का अपरिवर्तनीय डिजिटल रिकॉर्ड'],
    accountability: ['विभाग स्कोर एवं नियम (Department Scores)', 'विभागीय प्रदर्शन एवं सुरक्षा नियम'],
    reports: ['सुरक्षा रिपोर्ट (Safety Reports)', 'प्रमाणित सुरक्षा रिपोर्ट सारांश बनाएं']
  }
};

var userRoles = {
  officer: {
    key: 'officer',
    name: 'Raj Kumar',
    title: 'Mine Safety Officer · Shift A',
    avatar: 'RK',
    badge: 'FIELD SAFETY ACCESS',
    badgeClass: 'pill low',
    defaultPage: 'dashboard',
    allowedPages: ['dashboard', 'map', 'sensors', 'alerts', 'cases', 'inspection', 'evidence']
  },
  manager: {
    key: 'manager',
    name: 'Dr. A. K. Mishra',
    title: 'Colliery General Manager · DGMS Authorized',
    avatar: 'AM',
    badge: 'EXECUTIVE COMMAND',
    badgeClass: 'pill info',
    defaultPage: 'dashboard',
    allowedPages: ['dashboard', 'map', 'ai', 'alerts', 'cases', 'accountability', 'audit', 'reports']
  },
  auditor: {
    key: 'auditor',
    name: 'S. N. Sengupta',
    title: 'DGMS Safety Inspector · Eastern Zone',
    avatar: 'SS',
    badge: 'DGMS REGULATORY AUDIT',
    badgeClass: 'pill high',
    defaultPage: 'reports',
    allowedPages: ['dashboard', 'ai', 'evidence', 'accountability', 'audit', 'reports']
  }
};

/* =====================================================================
   AUTHENTICATION & SESSION CONTROLLER
   ===================================================================== */

function handleLoginSubmit(event) {
  if (event) event.preventDefault();

  var emailInput = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');
  var errorMsg = document.getElementById('login-error-msg');
  var btnSubmit = document.getElementById('btnLoginSubmit');
  var btnText = document.getElementById('btnSignInText');

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.remove('visible');
  }

  var email = emailInput ? emailInput.value : '';
  var password = passwordInput ? passwordInput.value : '';

  if (btnSubmit && btnText) {
    btnSubmit.classList.add('loading');
    btnText.textContent = 'Verifying Credentials...';
  }

  if (window.AuthService) {
    AuthService.signIn(email, password).then(function(result) {
      if (btnSubmit && btnText) {
        btnSubmit.classList.remove('loading');
        btnText.textContent = 'Sign In to Portal';
      }

      if (result.error) {
        if (errorMsg) {
          errorMsg.textContent = result.error;
          errorMsg.classList.add('visible');
        }
        if (emailInput && result.error.indexOf('Email') !== -1) {
          emailInput.classList.add('has-error');
          emailInput.focus();
        }
      } else {
        applyUserSession(result.user);
        transitionToAppView();
        toast('Welcome, ' + result.user.name + ' (' + result.user.title + ')');
      }
    });
  } else {
    transitionToAppView();
  }
}

function quickFill(email, password) {
  var emailInput = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');
  var errorMsg = document.getElementById('login-error-msg');

  if (emailInput) {
    emailInput.value = email;
    emailInput.classList.remove('has-error');
  }
  if (passwordInput) {
    passwordInput.value = password;
    passwordInput.classList.remove('has-error');
  }
  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.classList.remove('visible');
  }
}

function quickLogin(email, password) {
  quickFill(email, password);
  handleLoginSubmit();
}

function handleSignOut() {
  if (window.AuthService) {
    AuthService.signOut().then(function() {
      transitionToAuthView();
      toast('Operator session terminated.');
    });
  } else {
    transitionToAuthView();
  }
}

function transitionToAppView() {
  var authView = document.getElementById('auth-view');
  var appView = document.getElementById('app-view');

  if (authView) authView.style.display = 'none';
  if (appView) {
    appView.classList.add('active-session');
    appView.style.display = 'block';
  }

  // Refresh dynamic renders
  renderCaseList();
  renderActiveCaseWorkspace();
  renderActiveCaseLifecycle();
  renderCases();
  renderAlertCenter();
  renderEvidenceVault();
  renderAuditTrail();
  updateLiveClock();
}

function transitionToAuthView() {
  var authView = document.getElementById('auth-view');
  var appView = document.getElementById('app-view');

  if (appView) {
    appView.classList.remove('active-session');
    appView.style.display = 'none';
  }
  if (authView) {
    authView.style.display = 'flex';
  }
}

function applyUserRoleAccess(roleKey) {
  var role = userRoles[roleKey] || userRoles.officer;

  // 1. Update identity & post badges
  var avatarEl = document.getElementById('userAvatar');
  var nameEl = document.getElementById('userName');
  var titleEl = document.getElementById('userTitle');
  var roleBadgeEl = document.getElementById('userRoleBadge');
  var roleSelector = document.getElementById('roleSelector');

  if (avatarEl) avatarEl.textContent = role.avatar;
  if (nameEl) nameEl.textContent = role.name;
  if (titleEl) titleEl.textContent = role.title;
  if (roleBadgeEl) {
    roleBadgeEl.textContent = role.badge;
    roleBadgeEl.className = role.badgeClass;
  }
  if (roleSelector) {
    roleSelector.value = role.key;
  }

  // 2. Ensure ALL 11 tabs are accessible and visible with smooth transitions
  var navButtons = document.querySelectorAll('.nav button[data-page]');
  navButtons.forEach(function(btn) {
    btn.style.display = 'flex';
  });

  var teleHeader = document.getElementById('navGroupTelemetry');
  var govHeader = document.getElementById('navGroupGovernance');
  if (teleHeader) teleHeader.style.display = 'block';
  if (govHeader) govHeader.style.display = 'block';
}

function applyUserSession(user) {
  if (!user) return;
  var roleKey = user.role || 'officer';
  applyUserRoleAccess(roleKey);
}

/* =====================================================================
   PAGE NAVIGATION & ROUTING
   ===================================================================== */

function showPage(pageId, buttonElement) {
  currentPageId = pageId;
  var allPages = document.querySelectorAll('.page');
  for (var i = 0; i < allPages.length; i++) {
    allPages[i].classList.remove('active');
  }

  var targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
  }

  var allButtons = document.querySelectorAll('.nav button');
  for (var j = 0; j < allButtons.length; j++) {
    allButtons[j].classList.remove('active');
  }

  if (buttonElement) {
    buttonElement.classList.add('active');
  } else {
    var defaultBtn = document.querySelector('.nav button[data-page="' + pageId + '"]');
    if (defaultBtn) {
      defaultBtn.classList.add('active');
    }
  }

  updateHeaderTitles();
  
  if (pageId === 'alerts') {
    renderAlertCenter();
  } else if (pageId === 'cases') {
    renderCaseList();
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCases();
  } else if (pageId === 'evidence') {
    renderEvidenceVault();
  } else if (pageId === 'audit') {
    renderAuditTrail();
  }

  if (pageId === 'map' && typeof mdtOnShow === 'function') {
    mdtOnShow();
  } else if (typeof mdtOnHide === 'function') {
    mdtOnHide();
  }
}

function updateHeaderTitles() {
  var langSet = pageTitles[currentLang] || pageTitles.en;
  if (langSet[currentPageId]) {
    var tEl = document.getElementById('title');
    var sEl = document.getElementById('subtitle');
    if (tEl) tEl.textContent = langSet[currentPageId][0];
    if (sEl) sEl.textContent = langSet[currentPageId][1];
  }
}

/* ---------- Language Toggle ---------- */
function toggleLanguage() {
  currentLang = (currentLang === 'en') ? 'hi' : 'en';
  var btnLang = document.getElementById('btnLang');
  if (btnLang) {
    btnLang.textContent = (currentLang === 'en') ? 'हिंदी / HI' : 'English / EN';
  }

  updateHeaderTitles();

  var i18nElements = document.querySelectorAll('[data-en]');
  for (var i = 0; i < i18nElements.length; i++) {
    var el = i18nElements[i];
    if (currentLang === 'hi' && el.getAttribute('data-hi')) {
      el.textContent = el.getAttribute('data-hi');
    } else if (el.getAttribute('data-en')) {
      el.textContent = el.getAttribute('data-en');
    }
  }

  toast(currentLang === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई है' : 'Language switched to English');
}

/* ---------- Operator Role Switcher ---------- */
function changeRole(roleKey) {
  var role = userRoles[roleKey];
  if (!role) return;

  applyUserRoleAccess(roleKey);
  showPage(role.defaultPage);
  toast('🔒 Access Bar adjusted for ' + role.title + ' [' + role.badge + ']');
}

/* ---------- Offline Synchronization ---------- */
var isSynced = false;
function syncOfflineData() {
  var syncText = document.getElementById('syncText');
  var btnSync = document.getElementById('btnSync');

  if (window.InspectionService) {
    var count = InspectionService.syncOffline();
    if (syncText) syncText.textContent = 'All Offline Logs Synced ✓';
    if (btnSync) {
      btnSync.style.background = 'var(--color-safe-bg)';
      btnSync.style.borderColor = 'var(--color-safe-border)';
      btnSync.style.color = 'var(--color-safe-text)';
    }
    toast('✓ Successfully synchronized ' + (count > 0 ? count : 3) + ' offline inspection dossiers with surface gateway.');
  } else {
    if (!isSynced) {
      isSynced = true;
      if (syncText) syncText.textContent = 'All 3 Offline Logs Synced ✓';
      toast('Underground offline logs synced to surface gateway successfully.');
    } else {
      toast('All local inspection logs are already synced.');
    }
  }
}

/* ---------- Global Toast Notification ---------- */
var toastTimer = null;
function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  
  var now = new Date();
  var timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0') + ':' +
                now.getSeconds().toString().padStart(2, '0');
  
  t.innerHTML = '<strong>[' + timeStr + ']</strong> ' + msg;
  t.className = 'toast show';
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    t.className = 'toast';
  }, 4500);
}

/* ---------- Live Clock & Periodic SLA Update ---------- */
function updateLiveClock() {
  var clockEl = document.getElementById('liveClock');
  if (clockEl) {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var mins = String(now.getMinutes()).padStart(2, '0');
    var secs = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = 'LIVE · ' + hours + ':' + mins + ':' + secs + ' IST';
  }

  // Periodic SLA check & live countdown refresh if on cases page
  if (window.CaseService) {
    CaseService.checkSLAs();
    if (currentPageId === 'cases') {
      renderActiveCaseLifecycle();
    }
  }
}
setInterval(updateLiveClock, 1000);

/* =====================================================================
   CASE WORKSPACE & LIFECYCLE CONTROLLER (PHASES 2, 3, 9, 13, 16)
   ===================================================================== */

function viewCase(caseId) {
  if (!caseId) return;
  if (window.CaseService) {
    var found = CaseService.setActiveCaseId(caseId);
    if (!found) {
      toast('⚠ Case ' + caseId + ' not found in registry.');
      return;
    }
  }

  showPage('cases');
  renderCaseList();
  renderActiveCaseWorkspace();
  renderActiveCaseLifecycle();
  renderCases();
  toast('Loaded Case ' + caseId + ' workspace.');
}

function handleCaseSearch(query) {
  currentCaseSearch = (query || '').toLowerCase().trim();
  renderCaseList();
}

function filterCaseList(filterStatus) {
  currentCaseFilter = filterStatus || 'ALL';
  var pills = document.querySelectorAll('.case-filter-pill');
  pills.forEach(function(p) {
    if (p.getAttribute('data-filter') === currentCaseFilter) p.classList.add('active');
    else p.classList.remove('active');
  });
  renderCaseList();
}

function renderCaseList() {
  var listContainer = document.getElementById('caseListContainer');
  var countPill = document.getElementById('caseRegistryCountPill');
  if (!listContainer || !window.CaseService) return;

  var allCases = CaseService.getCases();
  var activeId = CaseService.getActiveCaseId();

  var filtered = allCases.filter(function(c) {
    var matchesFilter = (currentCaseFilter === 'ALL') || 
                        (currentCaseFilter === 'OPEN' && c.status === 'OPEN') ||
                        (currentCaseFilter === 'IN_PROGRESS' && (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'INSPECTION_REQUIRED' || c.status === 'CORRECTIVE_ACTION' || c.status === 'RE_INSPECTION' || c.status === 'VERIFICATION')) ||
                        (currentCaseFilter === 'ESCALATED' && c.status === 'ESCALATED') ||
                        (currentCaseFilter === 'RESOLVED' && (c.status === 'RESOLVED' || c.status === 'CLOSED'));
    
    var matchesSearch = !currentCaseSearch ||
                        c.id.toLowerCase().indexOf(currentCaseSearch) !== -1 ||
                        c.title.toLowerCase().indexOf(currentCaseSearch) !== -1 ||
                        (c.zoneName && c.zoneName.toLowerCase().indexOf(currentCaseSearch) !== -1) ||
                        (c.assignedTo && c.assignedTo.toLowerCase().indexOf(currentCaseSearch) !== -1);

    return matchesFilter && matchesSearch;
  });

  if (countPill) countPill.textContent = filtered.length + ' Cases';

  if (filtered.length === 0) {
    listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:11.5px; font-family:var(--font-mono);">No matching cases found.</div>';
    return;
  }

  listContainer.innerHTML = '';
  filtered.forEach(function(c) {
    var sla = CaseService.calculateSla(c);
    var item = document.createElement('div');
    item.className = 'case-nav-item' + (c.id === activeId ? ' active' : '');
    item.onclick = function() { viewCase(c.id); };

    var sevClass = c.severity === 'CRITICAL' ? 'pill high' : c.severity === 'HIGH' ? 'pill high' : c.severity === 'MEDIUM' ? 'pill medium' : 'pill low';
    var slaPill = sla.isOverdue ? '<span class="pill high">OVERDUE</span>' : (sla.status === 'DUE_SOON' ? '<span class="pill medium">DUE SOON</span>' : '<span class="pill low">' + sla.formattedRemaining + '</span>');

    item.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                     '<b style="color:var(--text-primary); font-family:var(--font-mono); font-size:12.5px;">' + c.id + '</b>' +
                     slaPill +
                     '</div>' +
                     '<div style="font-weight:600; color:var(--text-primary); font-size:12px; line-height:1.3; margin-bottom:4px;">' + c.title + '</div>' +
                     '<div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono);">' +
                     '<span>' + (c.zoneName || c.zoneId) + '</span>' +
                     '<span class="' + sevClass + '">' + c.status.replace(/_/g, ' ') + '</span>' +
                     '</div>';
    listContainer.appendChild(item);
  });
}

var currentCaseDetailTab = 'overview';

function setCaseDetailTab(tabKey) {
  currentCaseDetailTab = tabKey;
  var btns = document.querySelectorAll('.case-inner-tab-btn');
  btns.forEach(function(b) {
    if (b.getAttribute('data-tab') === tabKey) b.classList.add('active');
    else b.classList.remove('active');
  });

  var panes = document.querySelectorAll('.case-tab-pane');
  panes.forEach(function(p) {
    if (p.getAttribute('data-pane') === tabKey) p.classList.add('active');
    else p.classList.remove('active');
  });
}

function toggleSidebar() {
  var sidebar = document.getElementById('appSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    var isCollapsed = sidebar.classList.contains('collapsed');
    var toggleBtn = document.getElementById('btnToggleSidebar');
    if (toggleBtn) {
      toggleBtn.innerHTML = isCollapsed ? '»' : '«';
      toggleBtn.title = isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
    }
  }
}

function renderActiveCaseWorkspace() {
  var container = document.getElementById('caseDetailContainer');
  if (!container || !window.CaseService) return;

  var c = CaseService.getActiveCase();
  if (!c) {
    container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted);">No active case selected.</div>';
    return;
  }

  var evidenceList = window.EvidenceService ? EvidenceService.getEvidenceForCase(c.id) : [];
  var validation = CaseService.validateResolution(c.id);

  var statusClass = (c.status === 'CLOSED' || c.status === 'RESOLVED') ? 'pill done' : (c.status === 'ESCALATED' ? 'pill high' : 'pill medium');
  var sevClass = c.severity === 'CRITICAL' || c.severity === 'HIGH' ? 'pill high' : (c.severity === 'MEDIUM' ? 'pill medium' : 'pill low');

  var evidenceHtml = '';
  if (evidenceList.length === 0) {
    evidenceHtml = '<div style="padding:24px; background:var(--bg-secondary); border:1px dashed var(--border-medium); border-radius:8px; font-size:12px; color:var(--text-muted); text-align:center; font-family:var(--font-mono);">' +
                   'No digital photo proof attached yet for Case ' + c.id + '.' +
                   '<div style="margin-top:10px;"><button class="btn btn-sm primary" onclick="openEvidenceUploadModal(\'' + c.id + '\')">+ Upload Photo Proof</button></div>' +
                   '</div>';
  } else {
    evidenceHtml = '<div class="case-evidence-gallery">';
    evidenceList.forEach(function(ev) {
      var thumbSrc = ev.dataUrl || '';
      var imgTag = thumbSrc ? '<img class="case-evidence-thumb-img" src="' + thumbSrc + '" alt="Proof">' : '<div class="case-evidence-thumb-img">📷 ' + ev.fileName + '</div>';
      evidenceHtml += '<div class="case-evidence-thumb-card">' +
                      imgTag +
                      '<div class="case-evidence-thumb-info">' +
                      '<strong>' + ev.fileName + '</strong>' +
                      '<div style="color:var(--text-muted); font-size:10px;">' + ev.fileSizeFormatted + ' · ' + (ev.verificationStatus === 'VERIFIED' ? '<span style="color:var(--color-safe);">VERIFIED ✓</span>' : 'PENDING') + '</div>' +
                      '<div class="evidence-hash-tag" style="margin:4px 0 0; font-size:9.5px;">' + ev.hash + '</div>' +
                      '</div>' +
                      '</div>';
    });
    evidenceHtml += '</div>' +
                    '<div style="margin-top:8px; text-align:right;"><button class="btn btn-sm primary" onclick="openEvidenceUploadModal(\'' + c.id + '\')">+ Upload Additional Evidence</button></div>';
  }

  var actionsHtml = '';
  c.correctiveActions.forEach(function(ca, idx) {
    var caDone = ca.status === 'COMPLETED';
    actionsHtml += '<div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); padding:12px 14px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; transition: all var(--duration-fast);">' +
                   '<div>' +
                   '<b style="font-size:12px; color:var(--text-primary);">' + (idx + 1) + '. ' + ca.description + '</b>' +
                   '<div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono); margin-top:3px;">Lead: ' + ca.assignedTo + (ca.completedAt ? ' · <span style="color:var(--color-safe); font-weight:600;">Completed ✓</span>' : ' · In Progress') + '</div>' +
                   '</div>' +
                   (!caDone ? '<button class="btn btn-sm primary" onclick="completeCorrectiveAction(\'' + ca.id + '\')">Mark Completed</button>' : '<span class="pill low">DONE</span>') +
                   '</div>';
  });

  var reInspectHtml = '';
  if (c.reInspection) {
    reInspectHtml = '<div class="reinspect-comparison-box">' +
                    '<div class="reinspect-col before">' +
                    '<strong style="font-size:11px; color:var(--color-critical);">BEFORE REMEDIATION</strong>' +
                    '<div style="font-size:11px; font-family:var(--font-mono); margin-top:6px; line-height:1.6;">CH4: <b>' + c.reInspection.before.ch4 + '</b><br>Air: <b>' + c.reInspection.before.airflow + '</b><br>Risk: <b style="color:var(--color-critical);">' + c.reInspection.before.risk + ' / 100</b></div>' +
                    '</div>' +
                    '<div class="reinspect-col after">' +
                    '<strong style="font-size:11px; color:var(--color-safe);">AFTER (RE-INSPECTION PASSED ✓)</strong>' +
                    '<div style="font-size:11px; font-family:var(--font-mono); margin-top:6px; line-height:1.6;">CH4: <b>' + c.reInspection.after.ch4 + '</b><br>Air: <b>' + c.reInspection.after.airflow + '</b><br>Risk: <b style="color:var(--color-safe);">' + c.reInspection.after.risk + ' / 100</b></div>' +
                    '</div>' +
                    '</div>';
  } else {
    reInspectHtml = '<div style="padding:20px; text-align:center; background:var(--bg-secondary); border-radius:8px; color:var(--text-muted); font-size:11.5px; font-family:var(--font-mono);">' +
                    'Post-repair re-inspection telemetry not yet recorded for this case.' +
                    '<div style="margin-top:10px;"><button class="btn btn-sm warning" onclick="openReInspectionModal(\'' + c.id + '\')">Conduct Re-Inspection</button></div>' +
                    '</div>';
  }

  // Dynamic Case Actions Bar
  var caseToolbarHtml = '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; padding-top:14px; border-top:1px solid var(--border-subtle);">';
  if (c.status === 'OPEN') {
    caseToolbarHtml += '<button class="btn primary btn-sm" onclick="promptAssignCase(\'' + c.id + '\')">Assign Officer</button>';
  }
  if (c.status === 'ASSIGNED') {
    caseToolbarHtml += '<button class="btn primary btn-sm" onclick="CaseService.startWork(\'' + c.id + '\'); renderActiveCaseWorkspace(); renderActiveCaseLifecycle(); renderCaseList();">Start Work</button>';
  }
  if (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') {
    caseToolbarHtml += '<button class="btn btn-sm" onclick="promptSubmitInspection(\'' + c.id + '\')">+ Record Field Inspection</button>';
  }

  caseToolbarHtml += '<button class="btn btn-sm" onclick="openEvidenceUploadModal(\'' + c.id + '\')">📷 Upload Evidence</button>';
  caseToolbarHtml += '<button class="btn btn-sm" onclick="openCorrectiveActionModal(\'' + c.id + '\')">+ Create Action Plan</button>';

  if (c.status === 'CORRECTIVE_ACTION' || c.status === 'RE_INSPECTION' || c.status === 'IN_PROGRESS') {
    caseToolbarHtml += '<button class="btn btn-sm warning" onclick="openReInspectionModal(\'' + c.id + '\')">Conduct Re-Inspection</button>';
  }

  if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
    caseToolbarHtml += '<button class="btn btn-sm primary" onclick="handleResolveCase(\'' + c.id + '\')">✓ Verify &amp; Resolve Case</button>';
  } else if (c.status === 'RESOLVED') {
    caseToolbarHtml += '<button class="btn btn-sm primary" onclick="handleCloseCase(\'' + c.id + '\')">🔒 Permanently Close Case</button>';
  }
  caseToolbarHtml += '</div>';

  container.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">' +
                        '<div>' +
                        '<div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">' +
                        '<b style="font-size:18px; color:var(--text-primary); font-family:var(--font-heading);">' + c.id + '</b>' +
                        '<span class="' + statusClass + '">' + c.status.replace(/_/g, ' ') + '</span>' +
                        '<span class="' + sevClass + '">' + c.severity + ' SEVERITY</span>' +
                        '</div>' +
                        '<h3 style="margin:2px 0 4px; font-size:16px; font-weight:700;">' + c.title + '</h3>' +
                        '<div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">' +
                        c.mine + ' · ' + c.zoneName + ' (Tunnel ' + c.tunnelId + ')' +
                        '</div>' +
                        '</div>' +
                        '<button class="btn btn-sm" onclick="showPage(\'map\'); mdtHighlightEntity(null, \'' + c.zoneId + '\');">⊙ Locate on Map</button>' +
                        '</div>' +

                        '<!-- Minimalist Inner Tabs with Fluid Motion -->' +
                        '<div class="case-inner-tabs">' +
                        '<button class="case-inner-tab-btn ' + (currentCaseDetailTab === 'overview' ? 'active' : '') + '" data-tab="overview" onclick="setCaseDetailTab(\'overview\')">📋 Context &amp; Readiness</button>' +
                        '<button class="case-inner-tab-btn ' + (currentCaseDetailTab === 'evidence' ? 'active' : '') + '" data-tab="evidence" onclick="setCaseDetailTab(\'evidence\')">📷 Evidence (' + evidenceList.length + ')</button>' +
                        '<button class="case-inner-tab-btn ' + (currentCaseDetailTab === 'actions' ? 'active' : '') + '" data-tab="actions" onclick="setCaseDetailTab(\'actions\')">⚡ Actions (' + c.correctiveActions.length + ')</button>' +
                        '<button class="case-inner-tab-btn ' + (currentCaseDetailTab === 'reinspection' ? 'active' : '') + '" data-tab="reinspection" onclick="setCaseDetailTab(\'reinspection\')">🔄 Re-Inspection</button>' +
                        '</div>' +

                        '<!-- Tab Pane 1: Overview -->' +
                        '<div class="case-tab-pane ' + (currentCaseDetailTab === 'overview' ? 'active' : '') + '" data-pane="overview">' +
                        '<div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); padding:14px; border-radius:8px; font-size:12.5px;">' +
                        '<div><strong>Hazard Context:</strong> ' + c.description + '</div>' +
                        '<div style="margin-top:8px; display:flex; gap:20px; font-family:var(--font-mono); font-size:11.5px; color:var(--text-secondary);">' +
                        '<span>Assigned Officer: <strong>' + (c.assignedOfficerName || c.assignedTo || 'Unassigned') + '</strong></span>' +
                        '<span>Risk Score: <strong style="color:var(--color-critical);">' + c.riskScore + ' / 100</strong></span>' +
                        '</div>' +
                        '</div>' +
                        '<div class="resolution-checklist">' +
                        '<div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">Statutory Resolution Checklist:</div>' +
                        '<div class="resolution-check-item ' + (c.assignedTo ? 'done' : 'pending') + '">' + (c.assignedTo ? '✓' : '○') + ' Shift safety officer assigned (' + (c.assignedTo || 'Pending') + ')</div>' +
                        '<div class="resolution-check-item ' + (c.inspection ? 'done' : 'pending') + '">' + (c.inspection ? '✓' : '○') + ' Statutory field inspection recorded</div>' +
                        '<div class="resolution-check-item ' + (evidenceList.length > 0 ? 'done' : 'pending') + '">' + (evidenceList.length > 0 ? '✓' : '○') + ' Verified photo evidence attached (' + evidenceList.length + ' files)</div>' +
                        '<div class="resolution-check-item ' + (c.correctiveActions.some(function(a){return a.status==='COMPLETED';}) ? 'done' : 'pending') + '">' + (c.correctiveActions.some(function(a){return a.status==='COMPLETED';}) ? 'done' : '○') + ' Corrective action completed</div>' +
                        '<div class="resolution-check-item ' + (c.reInspection ? 'done' : 'pending') + '">' + (c.reInspection ? '✓' : '○') + ' Post-repair re-inspection passed</div>' +
                        '</div>' +
                        '</div>' +

                        '<!-- Tab Pane 2: Evidence -->' +
                        '<div class="case-tab-pane ' + (currentCaseDetailTab === 'evidence' ? 'active' : '') + '" data-pane="evidence">' +
                        evidenceHtml +
                        '</div>' +

                        '<!-- Tab Pane 3: Corrective Actions -->' +
                        '<div class="case-tab-pane ' + (currentCaseDetailTab === 'actions' ? 'active' : '') + '" data-pane="actions">' +
                        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                        '<b style="font-size:12.5px; font-family:var(--font-heading); text-transform:uppercase;">Remediation Action Steps</b>' +
                        '<button class="btn btn-sm" onclick="openCorrectiveActionModal(\'' + c.id + '\')">+ Add Action</button>' +
                        '</div>' +
                        (c.correctiveActions.length === 0 ? '<div style="padding:16px; font-size:12px; color:var(--text-muted); font-family:var(--font-mono); background:var(--bg-secondary); border-radius:8px; text-align:center;">No corrective actions logged yet.</div>' : actionsHtml) +
                        '</div>' +

                        '<!-- Tab Pane 4: Re-Inspection -->' +
                        '<div class="case-tab-pane ' + (currentCaseDetailTab === 'reinspection' ? 'active' : '') + '" data-pane="reinspection">' +
                        reInspectHtml +
                        '</div>' +

                        caseToolbarHtml;
}

function renderActiveCaseLifecycle() {
  var container = document.getElementById('caseLifecycleContainer');
  if (!container || !window.CaseService) return;

  var c = CaseService.getActiveCase();
  if (!c) return;

  var sla = CaseService.calculateSla(c);
  var slaBoxClass = 'sla-countdown-box' + (sla.isOverdue ? ' overdue' : (sla.status === 'DUE_SOON' ? ' due-soon' : ''));

  var stages = [
    { key: 'DETECTED', label: '1. DETECTED (IoT Anomaly)' },
    { key: 'ASSIGNED', label: '2. ASSIGNED (Officer)' },
    { key: 'IN_PROGRESS', label: '3. IN PROGRESS (Field Triage)' },
    { key: 'INSPECTION', label: '4. FIELD INSPECTION' },
    { key: 'CORRECTIVE_ACTION', label: '5. CORRECTIVE ACTION' },
    { key: 'RE_INSPECTION', label: '6. RE-INSPECTION' },
    { key: 'VERIFICATION', label: '7. VERIFICATION' },
    { key: 'RESOLVED', label: '8. RESOLVED' },
    { key: 'CLOSED', label: '9. CLOSED & ARCHIVED' }
  ];

  // Map case status to active stage index
  var activeIdx = 0;
  if (c.status === 'ASSIGNED') activeIdx = 1;
  else if (c.status === 'IN_PROGRESS') activeIdx = 2;
  else if (c.status === 'INSPECTION_REQUIRED') activeIdx = 3;
  else if (c.status === 'CORRECTIVE_ACTION') activeIdx = 4;
  else if (c.status === 'RE_INSPECTION') activeIdx = 5;
  else if (c.status === 'VERIFICATION') activeIdx = 6;
  else if (c.status === 'RESOLVED') activeIdx = 7;
  else if (c.status === 'CLOSED') activeIdx = 8;
  else if (c.status === 'ESCALATED') activeIdx = 2;

  var stepperHtml = '<div class="lifecycle-stepper">';
  stages.forEach(function(st, idx) {
    var isDone = idx < activeIdx || c.status === 'CLOSED';
    var isActive = idx === activeIdx && c.status !== 'CLOSED';
    var stepClass = 'lifecycle-step' + (isDone ? ' completed' : (isActive ? ' active' : ''));
    var circleContent = isDone ? '✓' : (idx + 1);

    stepperHtml += '<div class="' + stepClass + '">' +
                   '<div class="step-indicator-circle">' + circleContent + '</div>' +
                   '<span>' + st.label + '</span>' +
                   '</div>';
  });
  stepperHtml += '</div>';

  var dueTimeStr = new Date(c.dueAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  container.innerHTML = '<!-- SLA Monitor -->' +
                        '<div class="' + slaBoxClass + '">' +
                        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                        '<b style="font-size:11px; font-family:var(--font-mono); text-transform:uppercase; color:var(--text-muted);">Statutory SLA Countdown</b>' +
                        '<span class="pill ' + (sla.isOverdue ? 'high' : sla.status === 'DUE_SOON' ? 'medium' : 'low') + '">' + sla.status + '</span>' +
                        '</div>' +
                        '<div class="sla-timer-digit">' + (sla.isOverdue ? ('Overdue by ' + sla.overdueByFormatted) : (sla.formattedRemaining + ' Remaining')) + '</div>' +
                        '<div style="font-size:11px; font-family:var(--font-mono); color:var(--text-secondary);">' +
                        'Deadline: <strong>' + dueTimeStr + '</strong> (' + c.slaHours + 'h Statutory Limit)' +
                        '</div>' +
                        '<button class="btn btn-sm warning" style="width:100%; margin-top:8px;" onclick="triggerCaseEscalation(\'' + c.id + '\')">🚨 Dispatch Level ' + (c.escalationLevel + 1) + ' SLA Escalation</button>' +
                        '</div>' +

                        '<!-- Lifecycle Stepper -->' +
                        '<div>' +
                        '<h4 style="font-family:var(--font-heading); font-size:13.5px; margin:0 0 8px;">DGMS Statutory Lifecycle</h4>' +
                        stepperHtml +
                        '</div>' +

                        '<!-- Case Audit Mini Timeline -->' +
                        '<div>' +
                        '<h4 style="font-family:var(--font-heading); font-size:13px; margin:0 0 6px;">Case Activity Audit Log</h4>' +
                        '<div class="history-box" id="caseAuditMiniList" style="max-height:180px; overflow-y:auto;">' +
                        renderCaseSpecificAuditLogs(c.id) +
                        '</div>' +
                        '</div>';
}

function renderCaseSpecificAuditLogs(caseId) {
  if (!window.AuditService) return '<div style="color:var(--text-muted); font-size:11px;">No audit events.</div>';
  var logs = AuditService.getLogsForEntity('CASE', caseId);
  if (logs.length === 0) return '<div style="color:var(--text-muted); font-size:11px; padding:6px 0;">No audit events logged for ' + caseId + '.</div>';

  return logs.slice().reverse().map(function(l) {
    var timeStr = l.timestamp.split('T')[1].substring(0, 8);
    return '<div class="history-item">' +
           '<span class="history-time">' + timeStr + '</span>' +
           '<span><b style="color:#ffffff;">' + l.action + '</b>: <span style="color:#cbd5e1;">' + l.details + '</span></span>' +
           '</div>';
  }).join('');
}

/* =====================================================================
   EVIDENCE / PHOTO UPLOAD & PREVIEW (PHASES 4, 5, 6, 7)
   ===================================================================== */

var activeUploadCaseId = null;

function openEvidenceUploadModal(caseId) {
  activeUploadCaseId = caseId || CaseService.getActiveCaseId();
  var modal = document.getElementById('evidenceUploadModal');
  var title = document.getElementById('evidenceModalTitle');
  var error = document.getElementById('evidenceUploadError');

  if (title) title.textContent = 'Upload Evidence for Case #' + activeUploadCaseId;
  if (error) { error.textContent = ''; error.classList.remove('visible'); }
  clearEvidenceFileSelection();

  if (modal) modal.classList.add('open');
}

function closeEvidenceUploadModal() {
  var modal = document.getElementById('evidenceUploadModal');
  if (modal) modal.classList.remove('open');
  clearEvidenceFileSelection();
}

function handleEvidenceFileSelect(input) {
  var error = document.getElementById('evidenceUploadError');
  if (error) { error.textContent = ''; error.classList.remove('visible'); }

  if (!input.files || input.files.length === 0) return;
  var file = input.files[0];

  if (window.EvidenceService) {
    var validation = EvidenceService.validateFile(file);
    if (!validation.valid) {
      if (error) {
        error.textContent = validation.error;
        error.classList.add('visible');
      }
      input.value = '';
      return;
    }
  }

  selectedEvidenceFile = file;

  var reader = new FileReader();
  reader.onload = function(e) {
    selectedEvidenceDataUrl = e.target.result;
    var previewWrapper = document.getElementById('evidencePreviewWrapper');
    var previewImg = document.getElementById('evidencePreviewImg');
    var previewName = document.getElementById('evidencePreviewName');
    var previewSize = document.getElementById('evidencePreviewSize');
    var dropzone = document.getElementById('evidenceDropzone');

    if (previewImg) previewImg.src = selectedEvidenceDataUrl;
    if (previewName) previewName.textContent = file.name;
    if (previewSize) previewSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB · ' + file.type;

    if (previewWrapper) previewWrapper.style.display = 'flex';
    if (dropzone) dropzone.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearEvidenceFileSelection() {
  selectedEvidenceFile = null;
  selectedEvidenceDataUrl = null;
  var fileInput = document.getElementById('evidenceFileInput');
  var previewWrapper = document.getElementById('evidencePreviewWrapper');
  var dropzone = document.getElementById('evidenceDropzone');

  if (fileInput) fileInput.value = '';
  if (previewWrapper) previewWrapper.style.display = 'none';
  if (dropzone) dropzone.style.display = 'block';
}

function submitEvidenceUpload() {
  var error = document.getElementById('evidenceUploadError');
  var uploaderInput = document.getElementById('evidenceUploaderInput');
  var uploaderName = uploaderInput ? uploaderInput.value : 'Raj Kumar (M-1024)';

  if (!selectedEvidenceFile && !selectedEvidenceDataUrl) {
    if (error) {
      error.textContent = 'Please select an image file to upload.';
      error.classList.add('visible');
    }
    return;
  }

  if (window.EvidenceService) {
    var result = EvidenceService.uploadEvidence({
      caseId: activeUploadCaseId,
      fileName: selectedEvidenceFile ? selectedEvidenceFile.name : 'field_proof.jpg',
      fileType: selectedEvidenceFile ? selectedEvidenceFile.type : 'image/jpeg',
      fileSize: selectedEvidenceFile ? selectedEvidenceFile.size : 2400000,
      dataUrl: selectedEvidenceDataUrl,
      uploadedBy: uploaderName
    });

    if (result.success) {
      closeEvidenceUploadModal();
      renderActiveCaseWorkspace();
      renderActiveCaseLifecycle();
      renderEvidenceVault();
      renderAuditTrail();
      toast('✓ Evidence ' + result.evidence.id + ' successfully attached to Case #' + activeUploadCaseId + ' [SHA-256 Verified]');
    } else {
      if (error) {
        error.textContent = result.error || 'Upload failed. Please try again.';
        error.classList.add('visible');
      }
    }
  }
}

/* =====================================================================
   CORRECTIVE ACTION & RE-INSPECTION MODALS (PHASES 15, 17)
   ===================================================================== */

var activeCaCaseId = null;

function openCorrectiveActionModal(caseId) {
  activeCaCaseId = caseId || CaseService.getActiveCaseId();
  var modal = document.getElementById('correctiveActionModal');
  if (modal) modal.classList.add('open');
}

function closeCorrectiveActionModal() {
  var modal = document.getElementById('correctiveActionModal');
  if (modal) modal.classList.remove('open');
}

function submitNewCorrectiveAction() {
  var descEl = document.getElementById('caDescriptionInput');
  var leadEl = document.getElementById('caAssignedToInput');
  var desc = descEl ? descEl.value : 'Auxiliary duct fan re-aligned';
  var lead = leadEl ? leadEl.value : 'M-1024';

  if (window.CaseService) {
    CaseService.addCorrectiveAction(activeCaCaseId, { description: desc, assignedTo: lead });
    closeCorrectiveActionModal();
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderAuditTrail();
    toast('✓ Statutory corrective action plan logged and assigned.');
  }
}

function completeCorrectiveAction(actionId) {
  if (window.CaseService) {
    CaseService.completeCorrectiveAction(CaseService.getActiveCaseId(), actionId, 'Physical repair certified complete by Shift Safety Officer');
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderAuditTrail();
    toast('✓ Corrective action marked complete. Re-inspection required.');
  }
}

var activeReCaseId = null;

function openReInspectionModal(caseId) {
  activeReCaseId = caseId || CaseService.getActiveCaseId();
  var modal = document.getElementById('reInspectionModal');
  if (modal) modal.classList.add('open');
}

function closeReInspectionModal() {
  var modal = document.getElementById('reInspectionModal');
  if (modal) modal.classList.remove('open');
}

function submitReInspection() {
  var airInput = document.getElementById('reAirAfterInput');
  var ch4Input = document.getElementById('reCh4AfterInput');
  var notesInput = document.getElementById('reNotesInput');

  var airVal = airInput ? airInput.value : '3.6 m/s';
  var ch4Val = ch4Input ? ch4Input.value : '0.34%';
  var notes = notesInput ? notesInput.value : 'Re-inspection passed';

  if (window.CaseService) {
    CaseService.recordReInspection(activeReCaseId, {
      inspectorId: 'M-1024 (Raj Kumar)',
      after: { ch4: ch4Val, airflow: airVal, risk: 24 },
      notes: notes
    });
    closeReInspectionModal();
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderAuditTrail();
    toast('✓ Re-inspection passed: Normalized airflow ' + airVal + ', Methane ' + ch4Val + ' ✓');
  }
}

/* =====================================================================
   RESOLUTION & CLOSURE HANDLERS (PHASES 18, 19)
   ===================================================================== */

function handleResolveCase(caseId) {
  if (!window.CaseService) return;

  var result = CaseService.resolveCase(caseId);
  if (result.success) {
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderCases();
    renderAuditTrail();
    toast('✓ Case #' + caseId + ' statutory verification passed & marked RESOLVED.');
  } else {
    toast('⚠ Resolution Blocked: ' + result.reason);
  }
}

function handleCloseCase(caseId) {
  if (!window.CaseService) return;

  var result = CaseService.closeCase(caseId);
  if (result.success) {
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderCases();
    renderAuditTrail();
    toast('✓ Case #' + caseId + ' permanently closed and permanently archived.');
  } else {
    toast('⚠ Closure Failed: ' + result.reason);
  }
}

function triggerCaseEscalation(caseId) {
  if (window.CaseService) {
    CaseService.escalateCase(caseId, 3, 'Manual Level 3 Escalation dispatched to Colliery GM & DGMS Auditor');
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderCases();
    renderAuditTrail();
    toast('🚨 Case #' + caseId + ' escalated to Level 3 (DGMS Notice Dispatched)');
  }
}

function promptAssignCase(caseId) {
  if (window.CaseService) {
    CaseService.assignCase(caseId, 'M-1024', 'Raj Kumar (Safety Officer)');
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderCases();
    renderAuditTrail();
    toast('✓ Case #' + caseId + ' assigned to Safety Officer Raj Kumar (M-1024)');
  }
}

function promptSubmitInspection(caseId) {
  if (window.CaseService) {
    CaseService.submitInspection(caseId, {
      inspectorId: 'M-1024',
      findings: 'Physical inspection verified fan belt slack and airflow drop to 2.8 m/s.'
    });
    renderActiveCaseWorkspace();
    renderActiveCaseLifecycle();
    renderCaseList();
    renderCases();
    renderAuditTrail();
    toast('✓ Mandatory field inspection logged for Case #' + caseId);
  }
}

function promptCreateNewCase() {
  if (window.CaseService) {
    var newCase = CaseService.openCase({
      title: 'Water Sump High Level Alarm in Panel C',
      description: 'Underground drainage sump water level sensor reached 85% capacity.',
      category: 'WATER_DRAINAGE',
      severity: 'MEDIUM',
      riskScore: 52,
      zoneId: 'zone-panel-c',
      zoneName: 'Panel C Haulage Roadway',
      tunnelId: 'T-04'
    });
    viewCase(newCase.id);
    toast('✓ New Case #' + newCase.id + ' created in registry.');
  }
}

/* =====================================================================
   DANGER MODE SIMULATION & SENSOR DRIFT
   ===================================================================== */
var isDangerMode = false;

function setDangerMode(isDanger) {
  isDangerMode = isDanger;

  var ch4Card = document.getElementById('card-ch4');
  var airCard = document.getElementById('card-airflow');
  var roofCard = document.getElementById('card-roof');

  var ch4Val = document.getElementById('val-ch4');
  var airVal = document.getElementById('val-airflow');
  var roofVal = document.getElementById('val-roof');

  var ch4Pill = document.getElementById('pill-ch4');
  var airPill = document.getElementById('pill-airflow');
  var roofPill = document.getElementById('pill-roof');

  var riskScore = document.getElementById('riskScore');
  var dashRiskScore = document.getElementById('dashRiskScore');

  if (isDanger) {
    if (ch4Card) ch4Card.className = 'sensor-card danger';
    if (airCard) airCard.className = 'sensor-card danger';
    if (roofCard) roofCard.className = 'sensor-card danger';

    if (ch4Val) ch4Val.textContent = '1.15';
    if (airVal) airVal.textContent = '2.7';
    if (roofVal) roofVal.textContent = '16';

    if (ch4Pill) { ch4Pill.className = 'pill high'; ch4Pill.textContent = 'DANGER · HIGH'; }
    if (airPill) { airPill.className = 'pill high'; airPill.textContent = 'DANGER · LOW'; }
    if (roofPill) { roofPill.className = 'pill high'; roofPill.textContent = 'DANGER'; }

    if (riskScore) riskScore.innerHTML = '94 <span style="font-size: 20px; color: var(--text-muted); font-weight:500;">/ 100</span>';
    if (dashRiskScore) dashRiskScore.innerHTML = '94 <span style="font-size: 16px; color: var(--text-muted); font-weight:500;">/ 100</span>';

    toast('🚨 DANGER SURGE SIMULATED: Low air speed (2.7 m/s) and critical methane (1.15%) in Sector 4!');
  } else {
    if (ch4Card) ch4Card.className = 'sensor-card';
    if (airCard) airCard.className = 'sensor-card danger';
    if (roofCard) roofCard.className = 'sensor-card';

    if (ch4Val) ch4Val.textContent = '0.38';
    if (airVal) airVal.textContent = '2.8';
    if (roofVal) roofVal.textContent = '12';

    if (ch4Pill) { ch4Pill.className = 'pill low'; ch4Pill.textContent = 'NORMAL'; }
    if (airPill) { airPill.className = 'pill high'; airPill.textContent = 'DANGER · LOW'; }
    if (roofPill) { roofPill.className = 'pill medium'; roofPill.textContent = 'WARNING'; }

    if (riskScore) riskScore.innerHTML = '42 <span style="font-size: 20px; color: var(--text-muted); font-weight:500;">/ 100</span>';
    if (dashRiskScore) dashRiskScore.innerHTML = '42 <span style="font-size: 16px; color: var(--text-muted); font-weight:500;">/ 100</span>';

    toast('✓ Telemetry normalized: All sensors restored to safe statutory limits.');
  }
}

setInterval(function() {
  if (!isDangerMode) {
    var ch4El = document.getElementById('val-ch4');
    var coEl = document.getElementById('val-co');
    var o2El = document.getElementById('val-o2');
    var airEl = document.getElementById('val-airflow');
    var tempEl = document.getElementById('val-temp');

    if (ch4El) ch4El.textContent = (0.41 + (Math.random() - 0.5) * 0.04).toFixed(2);
    if (coEl) coEl.textContent = Math.round(17 + Math.random() * 2);
    if (o2El) o2El.textContent = (20.3 + (Math.random() - 0.5) * 0.2).toFixed(1);
    if (airEl) airEl.textContent = (2.8 + (Math.random() - 0.5) * 0.1).toFixed(1);
    if (tempEl) tempEl.textContent = Math.round(33 + Math.random() * 2);
  }
}, 2500);

/* =====================================================================
   FIELD INSPECTION WIZARD (6 STEPS)
   ===================================================================== */
var currentWizardStep = 1;

function setWizardStep(stepNum) {
  currentWizardStep = stepNum;
  for (var i = 1; i <= 6; i++) {
    var tab = document.getElementById('wizTab' + i);
    var content = document.getElementById('wizStep' + i);
    if (tab) {
      tab.classList.remove('active');
      if (i < stepNum) tab.classList.add('completed');
      else tab.classList.remove('completed');
    }
    if (content) {
      content.classList.remove('active');
    }
  }

  var activeTab = document.getElementById('wizTab' + stepNum);
  var activeContent = document.getElementById('wizStep' + stepNum);
  if (activeTab) activeTab.classList.add('active');
  if (activeContent) activeContent.classList.add('active');

  var prevBtn = document.getElementById('btnWizPrev');
  var nextBtn = document.getElementById('btnWizNext');
  if (prevBtn) prevBtn.style.visibility = (stepNum === 1) ? 'hidden' : 'visible';
  if (nextBtn) {
    if (stepNum === 6) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'inline-flex';
      nextBtn.textContent = 'Next Step (' + (stepNum + 1) + '/6) →';
    }
  }
}

function nextWizardStep() {
  if (currentWizardStep < 6) setWizardStep(currentWizardStep + 1);
}

function prevWizardStep() {
  if (currentWizardStep > 1) setWizardStep(currentWizardStep - 1);
}

function submitInspection() {
  var loc = document.getElementById('inspectLocation');
  var notes = document.getElementById('inspectNotes');
  var locVal = loc ? loc.value : 'Ventilation Duct 4';
  var notesVal = notes ? notes.value : 'Physical check conducted';

  if (window.InspectionService) {
    var insId = InspectionService.saveOffline({
      caseId: 'C-2048',
      inspectorId: 'M-1024',
      findings: { location: locVal, notes: notesVal }
    });
    toast('✓ Field Inspection ' + insId + ' logged and queued in local offline vault.');
  } else {
    toast('Inspection submitted successfully. A case has been created.');
  }

  setTimeout(function() {
    viewCase('C-2048');
  }, 900);
}

/* =====================================================================
   DYNAMIC RENDERING: ALERTS, EVIDENCE VAULT & AUDIT TRAIL
   ===================================================================== */

var currentAlertTab = 'NEW';

function renderAlertCenter(tabName) {
  if (tabName) currentAlertTab = tabName;
  
  var tabs = document.querySelectorAll('.alerts-tabs button');
  tabs.forEach(function(t) { t.className = 'btn btn-sm'; });
  var activeTab = document.getElementById('tab-alerts-' + currentAlertTab);
  if (activeTab) activeTab.className = 'btn btn-sm primary';

  var tbody = document.getElementById('alertsTableBody');
  if (!tbody) return;

  var alerts = (window.AlertSystem && AlertSystem.getAlerts()) || [];
  var filtered = alerts;
  if (currentAlertTab !== 'ALL') {
    filtered = alerts.filter(function(a) { return a.status === currentAlertTab; });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px; font-family: var(--font-mono);">No alerts found for classification: ' + currentAlertTab + '</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(function(a) {
    var tr = document.createElement('tr');
    var sevClass = a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'pill high' : (a.severity === 'MEDIUM' ? 'pill medium' : 'pill low');
    var timeStr = a.createdAt.split('T')[1].substring(0, 8);

    var actionHtml = '';
    if (a.status === 'NEW') {
      actionHtml += '<button class="btn btn-sm" onclick="AlertSystem.acknowledgeAlert(\'' + a.alertId + '\'); renderAlertCenter();">Acknowledge</button> ';
    }
    if (a.status === 'ACKNOWLEDGED') {
      actionHtml += '<button class="btn btn-sm primary" onclick="AlertSystem.resolveAlert(\'' + a.alertId + '\'); renderAlertCenter();">Resolve</button> ';
    }
    
    actionHtml += '<button class="btn btn-sm" onclick="AlertSystem.viewOnMap(\'' + a.entityId + '\', \'' + a.zoneId + '\')">⊙ Map</button> ';

    if ((a.severity === 'HIGH' || a.severity === 'CRITICAL') && a.status !== 'RESOLVED' && !a.linkedCaseId) {
       actionHtml += '<button class="btn btn-sm primary" style="margin-top: 4px;" onclick="AlertSystem.openCaseForAlert(\'' + a.alertId + '\')">◫ Open Case</button>';
    } else if (a.linkedCaseId) {
       actionHtml += '<button class="btn btn-sm" style="margin-top:4px;" onclick="viewCase(\'' + a.linkedCaseId + '\')">◫ View Case</button>';
    }

    tr.innerHTML = '<td><span class="' + sevClass + '">' + a.severity + '</span></td>' +
                   '<td><strong style="color:var(--text-primary);">' + a.title + '</strong><br><span style="font-size:11.5px; color:var(--text-secondary);">' + a.message + '</span></td>' +
                   '<td style="font-family:var(--font-mono);">' + (a.entityId || 'SYS-TELEMETRY') + '</td>' +
                   '<td style="font-family:var(--font-mono);">' + (a.zoneId || 'General') + '</td>' +
                   '<td style="font-family:var(--font-mono); font-size:11.5px;">' + timeStr + '</td>' +
                   '<td><span class="pill ' + (a.status==='NEW'?'high':a.status==='ACKNOWLEDGED'?'medium':'done') + '">' + a.status + '</span></td>' +
                   '<td>' + actionHtml + '</td>';
    tbody.appendChild(tr);
  });
}

function renderCases() {
  var tbody = document.getElementById('casesTableBody');
  if (!tbody || !window.CaseService) return;

  var cases = CaseService.getCases();
  tbody.innerHTML = '';

  if (cases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px; font-family: var(--font-mono);">No active cases in registry.</td></tr>';
    return;
  }

  cases.forEach(function(c) {
    var tr = document.createElement('tr');
    var sla = CaseService.calculateSla(c);

    var statusPill = (c.status === 'CLOSED' || c.status === 'RESOLVED') ? 'pill done' : (c.status === 'OPEN' || c.status === 'ESCALATED' ? 'pill high' : 'pill medium');
    var actionHtml = '<button class="btn btn-sm primary" onclick="viewCase(\'' + c.id + '\')">View Case</button>';

    tr.innerHTML = '<td><b style="color:var(--text-primary); font-family:var(--font-mono);">' + c.id + '</b></td>' +
                   '<td><span style="color:var(--text-primary); font-weight:600;">' + c.title + '</span><br><span style="font-size:11px; color:var(--text-muted);">' + (c.description || '') + '</span></td>' +
                   '<td style="font-family:var(--font-mono);">' + (c.zoneName || c.zoneId) + '</td>' +
                   '<td style="font-family:var(--font-mono);">' + (c.assignedOfficerName || c.assignedTo || 'Unassigned') + '</td>' +
                   '<td style="font-family:var(--font-mono);">' + (sla.isOverdue ? '<span class="pill high">OVERDUE</span>' : sla.formattedRemaining) + '</td>' +
                   '<td><span class="' + statusPill + '">' + c.status.replace(/_/g, ' ') + '</span></td>' +
                   '<td>' + actionHtml + '</td>';
    tbody.appendChild(tr);
  });
}

function renderEvidenceVault() {
  var vaultGrid = document.getElementById('evidenceVaultGrid');
  if (!vaultGrid || !window.EvidenceService) return;

  var allEvidence = EvidenceService.getAllEvidence();
  vaultGrid.innerHTML = '';

  if (allEvidence.length === 0) {
    vaultGrid.innerHTML = '<div style="grid-column: span 3; padding: 40px; text-align: center; color: var(--text-muted);">No evidence files uploaded yet.</div>';
    return;
  }

  allEvidence.forEach(function(ev) {
    var card = document.createElement('div');
    card.className = 'evidence-card';
    var imgContent = ev.dataUrl ? '<img src="' + ev.dataUrl + '" style="width:100%; height:140px; object-fit:cover;" alt="Proof">' : '<div class="evidence-preview-box"><div style="font-size:24px;">📷</div><span>' + ev.fileName + '</span></div>';

    card.innerHTML = imgContent +
                     '<div class="evidence-body">' +
                     '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                     '<b style="color:var(--text-primary); font-family:var(--font-mono);">' + ev.id + ' · Case #' + ev.caseId.replace('case-','') + '</b>' +
                     '<span class="pill ' + (ev.verificationStatus === 'VERIFIED' ? 'low' : 'medium') + '">' + ev.verificationStatus + ' ✓</span>' +
                     '</div>' +
                     '<span class="evidence-hash-tag">HASH: ' + ev.hash + '</span>' +
                     '<div style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); line-height:1.6; margin-top:6px;">' +
                     '<div>Uploader: ' + ev.uploadedBy + '</div>' +
                     '<div>Timestamp: ' + ev.timestamp.replace('T', ' ').substring(0, 19) + ' IST</div>' +
                     '<div>Duplicate Check: <strong style="color:var(--color-safe);">' + ev.duplicateCheck + '</strong></div>' +
                     '</div>' +
                     '<div style="margin-top:10px; display:flex; gap:6px;">' +
                     '<button class="btn btn-sm" onclick="viewCase(\'' + ev.caseId + '\')">Open Linked Case</button>' +
                     '</div>' +
                     '</div>';
    vaultGrid.appendChild(card);
  });
}

function renderAuditTrail() {
  var timelineEl = document.getElementById('auditFullTimeline');
  if (!timelineEl || !window.AuditService) return;

  var logs = AuditService.getLogs();
  if (!logs || logs.length === 0) return;

  timelineEl.innerHTML = '';
  logs.slice().reverse().forEach(function(l) {
    var div = document.createElement('div');
    div.className = 'audit-entry-card';
    if (l.action.indexOf('BREACH') !== -1 || l.action.indexOf('ANOMALY') !== -1 || l.action.indexOf('ESCALAT') !== -1) {
      div.style.borderLeftColor = 'var(--color-critical)';
    } else if (l.action.indexOf('CLOSE') !== -1 || l.action.indexOf('PASS') !== -1 || l.action.indexOf('VERIF') !== -1) {
      div.style.borderLeftColor = 'var(--color-safe)';
    }

    var timeStr = l.timestamp.split('T')[1].substring(0, 8) + ' IST';
    div.innerHTML = '<div>' +
                    '<b style="color:var(--text-primary);">' + l.action + '</b>: ' + l.details +
                    '<div class="audit-meta">' +
                    '<span>Actor: <strong>' + l.actor + '</strong></span>' +
                    '<span>Entity: <strong>' + l.entityType + ' ' + l.entityId + '</strong></span>' +
                    '</div>' +
                    '</div>' +
                    '<span class="pill low">' + timeStr + '</span>';
    timelineEl.appendChild(div);
  });
}

function filterAuditTrail(query) {
  var q = (query || '').toLowerCase();
  var entries = document.querySelectorAll('#auditFullTimeline .audit-entry-card');
  entries.forEach(function(e) {
    var text = e.textContent.toLowerCase();
    e.style.display = (text.indexOf(q) !== -1) ? 'flex' : 'none';
  });
}

function filterAuditCategory(cat) {
  var entries = document.querySelectorAll('#auditFullTimeline .audit-entry-card');
  entries.forEach(function(e) {
    if (cat === 'ALL') {
      e.style.display = 'flex';
    } else {
      var text = e.textContent.toUpperCase();
      e.style.display = (text.indexOf(cat) !== -1) ? 'flex' : 'none';
    }
  });
}

function generateReport() {
  var output = document.getElementById('reportOutput');
  if (output) output.classList.add('show');
  toast('✓ Statutory safety and compliance dossier compiled and certified.');
}

/* =====================================================================
   INITIAL BOOTSTRAP & DEMO SEEDING
   ===================================================================== */
window.addEventListener('DOMContentLoaded', function() {
  if (window.EvidenceService) EvidenceService.seedDemoEvidence();
  if (window.CaseService) CaseService.seedDemoCases();

  if (window.AuthService && AuthService.isAuthenticated()) {
    applyUserSession(AuthService.getCurrentUser());
    transitionToAppView();
  } else {
    transitionToAuthView();
  }
});
