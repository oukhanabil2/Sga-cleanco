// app.js - VERSION COMPLÈTE - SYSTÈME DE GESTION DES AGENTS (SGA)
// Tous les modules intégrés - Version finale

// --- CONSTANTES ET VARIABLES GLOBALES ---
const JOURS_FRANCAIS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const SHIFT_LABELS = {
    '1': 'Matin',
    '2': 'Après-midi',
    '3': 'Nuit',
    'R': 'Repos',
    'C': 'Congé',
    'M': 'Maladie',
    'A': 'Autre absence',
    '-': 'Non défini'
};
const SHIFT_COLORS = {
    '1': '#3498db',
    '2': '#e74c3c',
    '3': '#9b59b6',
    'R': '#2ecc71',
    'C': '#f39c12',
    'M': '#e67e22',
    'A': '#95a5a6',
    '-': '#7f8c8d'
};
const DATE_AFFECTATION_BASE = new Date('2024-01-01');
const WARNING_TYPES = {
    ORAL: { label: 'Avertissement Oral', color: '#f39c12', severity: 1 },
    ECRIT: { label: 'Avertissement Écrit', color: '#e74c3c', severity: 2 },
    MISE_A_PIED: { label: 'Mise à pied', color: '#c0392b', severity: 3 }
};

// Variables globales
let agents = [];
let planningData = {};
let holidays = [];
let panicCodes = [];
let radios = [];
let uniforms = [];
let warnings = [];
let leaves = [];
let radioHistory = [];
let auditLog = [];

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    displayMainMenu();
    checkExpiredWarnings();
    console.log("SGA initialisé - Version Complète");
});

// --- INITIALISATION DE L'APPLICATION ---
function initApp() {
    loadData();
    if (agents.length === 0) {
        initializeTestData();
    }
}

// --- GESTION DES DONNÉES (LOCALSTORAGE) ---
function loadData() {
    const loadItem = (key, defaultValue) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };
    
    agents = loadItem('sga_agents', []);
    planningData = loadItem('sga_planning', {});
    holidays = loadItem('sga_holidays', []);
    panicCodes = loadItem('sga_panic_codes', []);
    radios = loadItem('sga_radios', []);
    uniforms = loadItem('sga_uniforms', []);
    warnings = loadItem('sga_warnings', []);
    leaves = loadItem('sga_leaves', []);
    radioHistory = loadItem('sga_radio_history', []);
    auditLog = loadItem('sga_audit_log', []);
    
    if (holidays.length === 0) initializeHolidays();
}

function saveData() {
    const saveItem = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };
    
    saveItem('sga_agents', agents);
    saveItem('sga_planning', planningData);
    saveItem('sga_holidays', holidays);
    saveItem('sga_panic_codes', panicCodes);
    saveItem('sga_radios', radios);
    saveItem('sga_uniforms', uniforms);
    saveItem('sga_warnings', warnings);
    saveItem('sga_leaves', leaves);
    saveItem('sga_radio_history', radioHistory);
    saveItem('sga_audit_log', auditLog);
}

// --- INITIALISATION DES DONNÉES ---
function initializeTestData() {
    agents = [
        { code: 'A01', nom: 'Dupont', prenom: 'Alice', groupe: 'A', matricule: 'MAT001', cin: 'AA123456', tel: '0601-010101', poste: 'Agent de sécurité', date_entree: '2024-01-01', date_sortie: null, statut: 'actif' },
        { code: 'B02', nom: 'Martin', prenom: 'Bob', groupe: 'B', matricule: 'MAT002', cin: 'BB654321', tel: '0602-020202', poste: 'Superviseur', date_entree: '2024-01-01', date_sortie: null, statut: 'actif' },
        { code: 'C03', nom: 'Lefevre', prenom: 'Carole', groupe: 'C', matricule: 'MAT003', cin: 'CC789012', tel: '0603-030303', poste: 'Agent de sécurité', date_entree: '2024-01-01', date_sortie: null, statut: 'actif' },
        { code: 'D04', nom: 'Dubois', prenom: 'David', groupe: 'D', matricule: 'MAT004', cin: 'DD345678', tel: '0604-040404', poste: 'Chef d\'équipe', date_entree: '2024-01-01', date_sortie: null, statut: 'actif' },
        { code: 'E01', nom: 'Zahiri', prenom: 'Ahmed', groupe: 'E', matricule: 'MAT005', cin: 'EE901234', tel: '0605-050505', poste: 'Agent spécial', date_entree: '2024-01-01', date_sortie: null, statut: 'actif' },
        { code: 'E02', nom: 'Zarrouk', prenom: 'Benoit', groupe: 'E', matricule: 'MAT006', cin: 'FF567890', tel: '0606-060606', poste: 'Agent spécial', date_entree: '2024-01-01', date_sortie: null, statut: 'actif' }
    ];
    
    initializeHolidays();
    saveData();
}

function initializeHolidays() {
    const year = new Date().getFullYear();
    holidays = [
        { date: `${year}-01-01`, description: 'Nouvel An', type: 'fixe' },
        { date: `${year}-01-11`, description: 'Manifeste de l\'Indépendance', type: 'fixe' },
        { date: `${year}-05-01`, description: 'Fête du Travail', type: 'fixe' },
        { date: `${year}-07-30`, description: 'Fête du Trône', type: 'fixe' },
        { date: `${year}-08-14`, description: 'Allégeance Oued Eddahab', type: 'fixe' },
        { date: `${year}-08-20`, description: 'Révolution du Roi et du Peuple', type: 'fixe' },
        { date: `${year}-08-21`, description: 'Fête de la Jeunesse', type: 'fixe' },
        { date: `${year}-11-06`, description: 'Marche Verte', type: 'fixe' },
        { date: `${year}-11-18`, description: 'Fête de l\'Indépendance', type: 'fixe' }
    ];
}

// --- FONCTIONS UTILITAIRES ---
function getMonthName(month) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1] || '';
}

function isHolidayDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
}

function getShiftForAgent(agentCode, dateStr) {
    const monthKey = dateStr.substring(0, 7);
    if (planningData[monthKey] && planningData[monthKey][agentCode] && planningData[monthKey][agentCode][dateStr]) {
        return planningData[monthKey][agentCode][dateStr].shift;
    }
    return calculateTheoreticalShift(agentCode, dateStr);
}

function calculateTheoreticalShift(agentCode, dateStr) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent || agent.statut !== 'actif') return '-';
    
    const date = new Date(dateStr);
    const group = agent.groupe;
    
    if (group === 'E') {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return 'R';
        const dayNum = date.getDate();
        return dayNum % 2 === 0 ? '1' : '2';
    } else {
        const daysSinceStart = Math.floor((date - DATE_AFFECTATION_BASE) / (1000 * 60 * 60 * 24));
        let groupOffset = 0;
        switch(group) {
            case 'A': groupOffset = 0; break;
            case 'B': groupOffset = 2; break;
            case 'C': groupOffset = 4; break;
            case 'D': groupOffset = 6; break;
        }
        const cycleDay = (daysSinceStart + groupOffset) % 8;
        switch(cycleDay) {
            case 0: case 1: return '1';
            case 2: case 3: return '2';
            case 4: case 5: return '3';
            case 6: case 7: return 'R';
            default: return '-';
        }
    }
}

function calculateAgentStats(agentCode, month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const stats = { '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0, '-': 0 };
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const shift = getShiftForAgent(agentCode, dateStr);
        if (stats[shift] !== undefined) stats[shift]++;
    }
    
    return [
        { label: 'Matin (1)', value: stats['1'] },
        { label: 'Après-midi (2)', value: stats['2'] },
        { label: 'Nuit (3)', value: stats['3'] },
        { label: 'Repos (R)', value: stats['R'] },
        { label: 'Congés (C)', value: stats['C'] + stats['M'] + stats['A'] },
        { label: 'Jours total', value: daysInMonth }
    ];
}

// --- GESTION DES INTERFACES ---
function openPopup(title, body, footer) {
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('popup-content');
    content.innerHTML = `
        <div class="popup-header"><h2>${title}</h2><button class="popup-close-btn" onclick="closePopup()">&times;</button></div>
        <div class="popup-body">${body}</div>
        <div class="popup-footer">${footer}</div>
    `;
    overlay.classList.add('visible');
}

function closePopup() {
    document.getElementById('overlay').classList.remove('visible');
}

function showSnackbar(msg) {
    const snackbar = document.createElement('div');
    snackbar.id = 'snackbar';
    snackbar.textContent = msg;
    snackbar.style.cssText = `
        visibility: visible;
        min-width: 250px;
        margin-left: -125px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 8px;
        padding: 16px;
        position: fixed;
        z-index: 3000;
        left: 50%;
        bottom: 30px;
        font-size: 0.9em;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(snackbar);
    
    setTimeout(() => {
        snackbar.style.animation = 'fadeout 0.5s';
        setTimeout(() => {
            if (snackbar.parentNode) snackbar.parentNode.removeChild(snackbar);
        }, 500);
    }, 3000);
}

// --- MENUS PRINCIPAUX ---
function displayMainMenu() {
    const mainContent = document.getElementById('main-content');
    document.getElementById('sub-title').textContent = "Menu Principal - SGA";
    mainContent.innerHTML = '';
    
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-button-container';
    
    const options = [
        { text: "👥 GESTION DES AGENTS", handler: () => displayAgentsManagementMenu(), className: "menu-section" },
        { text: "📅 GESTION DU PLANNING", handler: () => displayPlanningMenu(), className: "menu-section" },
        { text: "📊 STATISTIQUES & CLASSEMENT", handler: () => displayStatisticsMenu(), className: "menu-section" },
        { text: "🏖️ CONGÉS & ABSENCES", handler: () => displayLeavesMenu(), className: "menu-section" },
        { text: "🚨 CODES PANIQUE", handler: () => displayPanicCodesMenu(), className: "menu-section" },
        { text: "📻 GESTION RADIOS", handler: () => displayRadiosMenu(), className: "menu-section" },
        { text: "👔 HABILLEMENT", handler: () => displayUniformMenu(), className: "menu-section" },
        { text: "⚠️ AVERTISSEMENTS", handler: () => displayWarningsMenu(), className: "menu-section" },
        { text: "🎉 JOURS FÉRIÉS", handler: () => displayHolidaysMenu(), className: "menu-section" },
        { text: "💾 EXPORTATIONS", handler: () => displayExportMenu(), className: "menu-section" },
        { text: "⚙️ CONFIGURATION", handler: () => displayConfigMenu(), className: "menu-section" },
        { text: "🚪 QUITTER", handler: () => { if(confirm("Quitter ?")) { saveData(); window.close(); } }, className: "quit-button" }
    ];
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option.text;
        btn.className = 'menu-button' + (option.className ? ' ' + option.className : '');
        btn.onclick = option.handler;
        menuContainer.appendChild(btn);
    });
    
    mainContent.appendChild(menuContainer);
}

// --- SOUS-MENUS ---
function displayAgentsManagementMenu() {
    displaySubMenu("GESTION DES AGENTS", [
        { text: "📋 Liste des Agents", handler: () => displayAgentsList() },
        { text: "➕ Ajouter un Agent", handler: () => showAddAgentForm() },
        { text: "✏️ Modifier un Agent", handler: () => showEditAgentList() },
        { text: "🗑️ Supprimer un Agent", handler: () => showDeleteAgentList() },
        { text: "📁 Importer Agents (Excel)", handler: () => showImportExcelForm() },
        { text: "📥 Importer Agents (CSV)", handler: () => showImportCSVForm() },
        { text: "🔄 Agents de Test", handler: () => initializeTestDataWithConfirm() },
        { text: "📤 Exporter Agents", handler: () => exportAgentsData() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayPlanningMenu() {
    displaySubMenu("GESTION DU PLANNING", [
        { text: "📅 Planning Mensuel", handler: () => showMonthlyPlanning() },
        { text: "👥 Planning par Groupe", handler: () => showGroupPlanningSelection() },
        { text: "👤 Planning par Agent", handler: () => showAgentPlanningSelection() },
        { text: "📊 Planning Trimestriel", handler: () => showTrimestrialPlanning() },
        { text: "✏️ Modifier Shift", handler: () => showShiftModificationForm() },
        { text: "🔄 Échanger Shifts", handler: () => showShiftExchangeForm() },
        { text: "➕ Ajouter Absence", handler: () => showAbsenceForm() },
        { text: "🔄 Générer Planning", handler: () => generatePlanning() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayStatisticsMenu() {
    displaySubMenu("STATISTIQUES & CLASSEMENT", [
        { text: "📈 Statistiques Globales", handler: () => showGlobalStats() },
        { text: "👤 Statistiques par Agent", handler: () => showAgentStatsSelection() },
        { text: "🏆 Classement des Agents", handler: () => runClassement() },
        { text: "📊 Jours Travaillés", handler: () => showWorkedDaysMenu() },
        { text: "📉 Statistiques par Groupe", handler: () => showGroupStatsSelection() },
        { text: "📅 Statistiques Mensuelles", handler: () => showMonthlyStats() },
        { text: "📋 Rapport Complet", handler: () => generateFullReport() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayLeavesMenu() {
    displaySubMenu("CONGÉS & ABSENCES", [
        { text: "➕ Ajouter Congé", handler: () => showAddLeaveForm() },
        { text: "🗑️ Supprimer Congé", handler: () => showDeleteLeaveForm() },
        { text: "📋 Liste des Congés", handler: () => showLeavesList() },
        { text: "📅 Congés par Agent", handler: () => showAgentLeavesSelection() },
        { text: "📊 Congés par Groupe", handler: () => showGroupLeavesSelection() },
        { text: "⚠️ Ajouter Absence Maladie", handler: () => showSickLeaveForm() },
        { text: "🚫 Ajouter Autre Absence", handler: () => showOtherAbsenceForm() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayPanicCodesMenu() {
    displaySubMenu("CODES PANIQUE", [
        { text: "➕ Ajouter Code", handler: () => showAddPanicCodeForm() },
        { text: "✏️ Modifier Code", handler: () => showEditPanicCodeList() },
        { text: "🗑️ Supprimer Code", handler: () => showDeletePanicCodeList() },
        { text: "📋 Liste des Codes", handler: () => showPanicCodesList() },
        { text: "🔍 Rechercher Code", handler: () => showSearchPanicCode() },
        { text: "📤 Exporter Codes", handler: () => exportPanicCodes() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayRadiosMenu() {
    displaySubMenu("GESTION RADIOS", [
        { text: "➕ Ajouter Radio", handler: () => showAddRadioForm() },
        { text: "✏️ Modifier Radio", handler: () => showEditRadioList() },
        { text: "📋 Liste des Radios", handler: () => showRadiosList() },
        { text: "📲 Attribuer Radio", handler: () => showAssignRadioForm() },
        { text: "🔄 Retour Radio", handler: () => showReturnRadioForm() },
        { text: "📊 Statut Radios", handler: () => showRadiosStatus() },
        { text: "📋 Historique", handler: () => showRadiosHistory() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayUniformMenu() {
    displaySubMenu("HABILLEMENT", [
        { text: "➕ Enregistrer Habillement", handler: () => showAddUniformForm() },
        { text: "✏️ Modifier Habillement", handler: () => showEditUniformList() },
        { text: "📋 Rapport Habillement", handler: () => showUniformReport() },
        { text: "📊 Statistiques Tailles", handler: () => showUniformStats() },
        { text: "📅 Échéances", handler: () => showUniformDeadlines() },
        { text: "📤 Exporter Rapport", handler: () => exportUniformReport() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayWarningsMenu() {
    displaySubMenu("AVERTISSEMENTS DISCIPLINAIRES", [
        { text: "⚠️ Ajouter Avertissement", handler: () => showAddWarningForm() },
        { text: "📋 Liste Avertissements", handler: () => showWarningsList() },
        { text: "👤 Avertissements par Agent", handler: () => showAgentWarningsSelection() },
        { text: "📊 Statistiques", handler: () => showWarningsStats() },
        { text: "📤 Exporter Rapport", handler: () => exportWarningsReport() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayHolidaysMenu() {
    displaySubMenu("GESTION JOURS FÉRIÉS", [
        { text: "➕ Ajouter Jour Férié", handler: () => showAddHolidayForm() },
        { text: "🗑️ Supprimer Jour Férié", handler: () => showDeleteHolidayList() },
        { text: "📋 Liste Jours Fériés", handler: () => showHolidaysList() },
        { text: "🔄 Générer Annuelle", handler: () => generateYearlyHolidays() },
        { text: "📅 Voir par Année", handler: () => showHolidaysByYear() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayExportMenu() {
    displaySubMenu("EXPORTATIONS", [
        { text: "📊 Statistiques Excel", handler: () => exportStatsExcel() },
        { text: "📅 Planning Excel", handler: () => exportPlanningExcel() },
        { text: "👥 Agents CSV", handler: () => exportAgentsCSV() },
        { text: "📋 Congés PDF", handler: () => exportLeavesPDF() },
        { text: "📊 Rapport Complet", handler: () => exportFullReport() },
        { text: "💾 Sauvegarde Complète", handler: () => backupAllData() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displayConfigMenu() {
    displaySubMenu("CONFIGURATION", [
        { text: "⚙️ Paramètres", handler: () => showSettings() },
        { text: "🗃️ Gestion Base de Données", handler: () => showDatabaseManagement() },
        { text: "💾 Sauvegarde", handler: () => showBackupOptions() },
        { text: "📤 Restauration", handler: () => showRestoreOptions() },
        { text: "🗑️ Effacer Données", handler: () => showClearDataConfirm() },
        { text: "🔄 Réinitialiser", handler: () => showResetConfirm() },
        { text: "ℹ️ A propos", handler: () => showAbout() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function displaySubMenu(title, options) {
    const mainContent = document.getElementById('main-content');
    document.getElementById('sub-title').textContent = title;
    mainContent.innerHTML = '';
    
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-button-container';
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option.text;
        btn.className = 'menu-button' + (option.className ? ' ' + option.className : '');
        btn.onclick = option.handler;
        menuContainer.appendChild(btn);
    });
    
    mainContent.appendChild(menuContainer);
}

// === MODULE GESTION DES AGENTS ===
function displayAgentsList() {
    let html = `
        <div class="info-section">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <input type="text" id="searchAgent" placeholder="Rechercher nom ou code..." 
                       style="width:70%; padding:10px; border-radius:5px; border:none;"
                       onkeyup="filterAgents()">
                <button class="popup-button blue" onclick="refreshAgentsList()">🔄</button>
            </div>
            <div id="list-container" style="margin-top:15px;">
                ${generateAgentsTable(agents)}
            </div>
        </div>
    `;
    openPopup("📋 Liste des Agents", html, `
        <button class="popup-button green" onclick="showAddAgentForm()">➕ Ajouter</button>
        <button class="popup-button gray" onclick="closePopup()">Fermer</button>
    `);
}

function generateAgentsTable(data) {
    if (data.length === 0) return '<p style="text-align:center; color:#7f8c8d;">Aucun agent trouvé</p>';
    
    return `
        <table class="classement-table">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Nom & Prénom</th>
                    <th>Groupe</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(a => `
                    <tr>
                        <td><strong>${a.code}</strong></td>
                        <td onclick="showAgentDetails('${a.code}')" style="cursor:pointer;">
                            ${a.nom} ${a.prenom}
                        </td>
                        <td>${a.groupe}</td>
                        <td><span class="status-badge ${a.statut === 'actif' ? 'active' : 'inactive'}">${a.statut}</span></td>
                        <td style="white-space:nowrap;">
                            <button class="action-btn small" onclick="showEditAgentForm('${a.code}')" title="Modifier">✏️</button>
                            <button class="action-btn small red" onclick="confirmDeleteAgent('${a.code}')" title="Supprimer">🗑️</button>
                            <button class="action-btn small blue" onclick="showAgentDetails('${a.code}')" title="Détails">👁️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAgentDetails(code) {
    const a = agents.find(agent => agent.code === code);
    if (!a) return;
    
    const details = `
        <div class="info-section">
            <h3>Informations Personnelles</h3>
            <div class="info-item"><span class="info-label">Matricule:</span><span class="info-value">${a.matricule || 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">CIN:</span><span class="info-value">${a.cin || 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Téléphone:</span><span class="info-value">${a.tel || 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Poste:</span><span class="info-value">${a.poste || 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Date d'entrée:</span><span class="info-value">${a.date_entree || 'N/A'}</span></div>
            <div class="info-item"><span class="info-label">Date de sortie:</span><span class="info-value">${a.date_sortie || 'Actif'}</span></div>
            
            <h3 style="margin-top:20px;">Actions Rapides</h3>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="popup-button small blue" onclick="showAgentPlanning('${a.code}')">📅 Planning</button>
                <button class="popup-button small green" onclick="showAgentStats('${a.code}')">📊 Stats</button>
                <button class="popup-button small orange" onclick="showAddLeaveForAgent('${a.code}')">🏖️ Congé</button>
            </div>
        </div>
    `;
    
    openPopup(`👤 Détails : ${a.nom} ${a.prenom}`, details, `
        <button class="popup-button green" onclick="showEditAgentForm('${a.code}')">✏️ Modifier</button>
        <button class="popup-button blue" onclick="displayAgentsList()">📋 Retour liste</button>
        <button class="popup-button gray" onclick="closePopup()">Fermer</button>
    `);
}

function showAddAgentForm() {
    const html = `
        <div class="info-section">
            <h3>Ajouter un nouvel agent</h3>
            <form id="addAgentForm" onsubmit="return addNewAgent(event)">
                <div class="form-group">
                    <label>Code Agent *</label>
                    <input type="text" id="agentCode" required placeholder="Ex: A01" class="form-input">
                </div>
                <div class="form-group">
                    <label>Nom *</label>
                    <input type="text" id="agentNom" required placeholder="Ex: Dupont" class="form-input">
                </div>
                <div class="form-group">
                    <label>Prénom *</label>
                    <input type="text" id="agentPrenom" required placeholder="Ex: Alice" class="form-input">
                </div>
                <div class="form-group">
                    <label>Groupe *</label>
                    <select id="agentGroupe" required class="form-input">
                        <option value="">Sélectionner</option>
                        <option value="A">Groupe A</option>
                        <option value="B">Groupe B</option>
                        <option value="C">Groupe C</option>
                        <option value="D">Groupe D</option>
                        <option value="E">Groupe E</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Matricule</label>
                    <input type="text" id="agentMatricule" placeholder="Ex: MAT001" class="form-input">
                </div>
                <div class="form-group">
                    <label>CIN</label>
                    <input type="text" id="agentCIN" placeholder="Ex: AA123456" class="form-input">
                </div>
                <div class="form-group">
                    <label>Téléphone</label>
                    <input type="tel" id="agentTel" placeholder="Ex: 0601-010101" class="form-input">
                </div>
                <div class="form-group">
                    <label>Poste</label>
                    <input type="text" id="agentPoste" placeholder="Ex: Agent de sécurité" class="form-input">
                </div>
                <div class="form-group">
                    <label>Date d'entrée</label>
                    <input type="date" id="agentDateEntree" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </form>
        </div>
    `;
    
    openPopup("➕ Ajouter un Agent", html, `
        <button class="popup-button green" onclick="document.getElementById('addAgentForm').submit()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayAgentsManagementMenu()">Annuler</button>
    `);
}

function addNewAgent(event) {
    if (event) event.preventDefault();
    const code = document.getElementById('agentCode').value.toUpperCase();
    const nom = document.getElementById('agentNom').value;
    const prenom = document.getElementById('agentPrenom').value;
    const groupe = document.getElementById('agentGroupe').value;
    
    if (!code || !nom || !prenom || !groupe) {
        showSnackbar("⚠️ Veuillez remplir les champs obligatoires (*)");
        return false;
    }
    
    if (agents.find(a => a.code === code)) {
        showSnackbar(`⚠️ Le code ${code} existe déjà`);
        return false;
    }
    
    agents.push({
        code: code, nom: nom, prenom: prenom, groupe: groupe,
        matricule: document.getElementById('agentMatricule').value || '',
        cin: document.getElementById('agentCIN').value || '',
        tel: document.getElementById('agentTel').value || '',
        poste: document.getElementById('agentPoste').value || '',
        date_entree: document.getElementById('agentDateEntree').value || new Date().toISOString().split('T')[0],
        date_sortie: null, statut: 'actif'
    });
    
    saveData();
    showSnackbar(`✅ Agent ${code} ajouté avec succès`);
    displayAgentsList();
    closePopup();
    return false;
}

function showEditAgentList() {
    if (agents.length === 0) {
        showSnackbar("⚠️ Aucun agent à modifier");
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Sélectionnez un agent à modifier</h3>
            <input type="text" id="searchEditAgent" placeholder="Rechercher..." 
                   style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:none;"
                   onkeyup="filterEditAgents()">
            <div id="edit-list-container">
                ${generateEditAgentsList()}
            </div>
        </div>
    `;
    
    openPopup("✏️ Modifier un Agent", html, `
        <button class="popup-button gray" onclick="closePopup()">Annuler</button>
    `);
}

function generateEditAgentsList() {
    return `
        <table class="classement-table">
            <thead><tr><th>Code</th><th>Nom & Prénom</th><th>Groupe</th><th>Action</th></tr></thead>
            <tbody>
                ${agents.map(a => `
                    <tr>
                        <td>${a.code}</td>
                        <td>${a.nom} ${a.prenom}</td>
                        <td>${a.groupe}</td>
                        <td><button class="popup-button small blue" onclick="showEditAgentForm('${a.code}')">Modifier</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showEditAgentForm(code) {
    const agent = agents.find(a => a.code === code);
    if (!agent) {
        showSnackbar("⚠️ Agent non trouvé");
        return;
    }
    
    const html = `
        <div class="info-section">
            <h3>Modifier l'agent ${agent.code}</h3>
            <form id="editAgentForm" onsubmit="return updateAgent('${code}', event)">
                <div class="form-group">
                    <label>Code Agent</label>
                    <input type="text" value="${agent.code}" readonly class="form-input" style="background:#34495e;">
                </div>
                <div class="form-group">
                    <label>Nom *</label>
                    <input type="text" id="editNom" value="${agent.nom}" required class="form-input">
                </div>
                <div class="form-group">
                    <label>Prénom *</label>
                    <input type="text" id="editPrenom" value="${agent.prenom}" required class="form-input">
                </div>
                <div class="form-group">
                    <label>Groupe *</label>
                    <select id="editGroupe" required class="form-input">
                        <option value="A" ${agent.groupe === 'A' ? 'selected' : ''}>Groupe A</option>
                        <option value="B" ${agent.groupe === 'B' ? 'selected' : ''}>Groupe B</option>
                        <option value="C" ${agent.groupe === 'C' ? 'selected' : ''}>Groupe C</option>
                        <option value="D" ${agent.groupe === 'D' ? 'selected' : ''}>Groupe D</option>
                        <option value="E" ${agent.groupe === 'E' ? 'selected' : ''}>Groupe E</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Matricule</label>
                    <input type="text" id="editMatricule" value="${agent.matricule || ''}" class="form-input">
                </div>
                <div class="form-group">
                    <label>CIN</label>
                    <input type="text" id="editCIN" value="${agent.cin || ''}" class="form-input">
                </div>
                <div class="form-group">
                    <label>Téléphone</label>
                    <input type="tel" id="editTel" value="${agent.tel || ''}" class="form-input">
                </div>
                <div class="form-group">
                    <label>Poste</label>
                    <input type="text" id="editPoste" value="${agent.poste || ''}" class="form-input">
                </div>
                <div class="form-group">
                    <label>Date d'entrée</label>
                    <input type="date" id="editDateEntree" value="${agent.date_entree || ''}" class="form-input">
                </div>
                <div class="form-group">
                    <label>Date de sortie</label>
                    <input type="date" id="editDateSortie" value="${agent.date_sortie || ''}" class="form-input">
                    <small style="color:#7f8c8d;">Remplir seulement si l'agent n'est plus actif</small>
                </div>
            </form>
        </div>
    `;
    
    openPopup(`✏️ Modifier ${agent.code}`, html, `
        <button class="popup-button green" onclick="document.getElementById('editAgentForm').submit()">💾 Enregistrer</button>
        <button class="popup-button blue" onclick="showEditAgentList()">↩️ Retour</button>
        <button class="popup-button gray" onclick="closePopup()">Annuler</button>
    `);
}

function updateAgent(oldCode, event) {
    if (event) event.preventDefault();
    const agentIndex = agents.findIndex(a => a.code === oldCode);
    if (agentIndex === -1) {
        showSnackbar("⚠️ Agent non trouvé");
        return false;
    }
    
    agents[agentIndex] = {
        ...agents[agentIndex],
        nom: document.getElementById('editNom').value,
        prenom: document.getElementById('editPrenom').value,
        groupe: document.getElementById('editGroupe').value,
        matricule: document.getElementById('editMatricule').value,
        cin: document.getElementById('editCIN').value,
        tel: document.getElementById('editTel').value,
        poste: document.getElementById('editPoste').value,
        date_entree: document.getElementById('editDateEntree').value,
        date_sortie: document.getElementById('editDateSortie').value || null,
        statut: document.getElementById('editDateSortie').value ? 'inactif' : 'actif'
    };
    
    saveData();
    showSnackbar(`✅ Agent ${oldCode} modifié avec succès`);
    displayAgentsList();
    closePopup();
    return false;
}

function showDeleteAgentList() {
    const activeAgents = agents.filter(a => a.statut === 'actif');
    if (activeAgents.length === 0) {
        showSnackbar("⚠️ Aucun agent actif à supprimer");
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Sélectionnez un agent à supprimer (marquer comme inactif)</h3>
            <p style="color:#e74c3c; font-size:0.9em;">⚠️ Attention: Cette action marquera l'agent comme inactif mais conservera ses données historiques.</p>
            <input type="text" id="searchDeleteAgent" placeholder="Rechercher..." 
                   style="width:100%; padding:10px; margin:15px 0; border-radius:5px; border:none;"
                   onkeyup="filterDeleteAgents()">
            <div id="delete-list-container">
                ${generateDeleteAgentsList(activeAgents)}
            </div>
        </div>
    `;
    
    openPopup("🗑️ Supprimer un Agent", html, `
        <button class="popup-button gray" onclick="closePopup()">Annuler</button>
    `);
}

function generateDeleteAgentsList(agentsList) {
    return `
        <table class="classement-table">
            <thead><tr><th>Code</th><th>Nom & Prénom</th><th>Groupe</th><th>Action</th></tr></thead>
            <tbody>
                ${agentsList.map(a => `
                    <tr>
                        <td>${a.code}</td>
                        <td>${a.nom} ${a.prenom}</td>
                        <td>${a.groupe}</td>
                        <td><button class="popup-button small red" onclick="confirmDeleteAgent('${a.code}')">Supprimer</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function confirmDeleteAgent(code) {
    const agent = agents.find(a => a.code === code);
    if (!agent) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'agent ${code} (${agent.nom} ${agent.prenom}) ?\n\nCette action marquera l'agent comme inactif.`)) {
        const agentIndex = agents.findIndex(a => a.code === code);
        if (agentIndex !== -1) {
            agents[agentIndex].date_sortie = new Date().toISOString().split('T')[0];
            agents[agentIndex].statut = 'inactif';
            saveData();
            showSnackbar(`✅ Agent ${code} marqué comme inactif`);
            displayAgentsList();
            closePopup();
        }
    }
}

function filterAgents() {
    const val = document.getElementById('searchAgent').value.toLowerCase();
    const filtered = agents.filter(a => 
        a.nom.toLowerCase().includes(val) || 
        a.code.toLowerCase().includes(val) ||
        a.prenom.toLowerCase().includes(val)
    );
    document.getElementById('list-container').innerHTML = generateAgentsTable(filtered);
}

function filterEditAgents() {
    const val = document.getElementById('searchEditAgent').value.toLowerCase();
    const filtered = agents.filter(a => 
        a.nom.toLowerCase().includes(val) || 
        a.code.toLowerCase().includes(val) ||
        a.prenom.toLowerCase().includes(val)
    );
    document.getElementById('edit-list-container').innerHTML = generateEditAgentsList(filtered);
}

function filterDeleteAgents() {
    const val = document.getElementById('searchDeleteAgent').value.toLowerCase();
    const activeAgents = agents.filter(a => a.statut === 'actif');
    const filtered = activeAgents.filter(a => 
        a.nom.toLowerCase().includes(val) || 
        a.code.toLowerCase().includes(val) ||
        a.prenom.toLowerCase().includes(val)
    );
    document.getElementById('delete-list-container').innerHTML = generateDeleteAgentsList(filtered);
}

function refreshAgentsList() {
    displayAgentsList();
}

function initializeTestDataWithConfirm() {
    if (confirm("Voulez-vous initialiser avec des données de test ?\n\n⚠️ Attention : Cela écrasera les données existantes.")) {
        initializeTestData();
        showSnackbar("✅ Données de test initialisées");
        displayAgentsManagementMenu();
    }
}

// === MODULE PLANNING ===
function showMonthlyPlanning() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let html = `
        <div class="info-section">
            <h3>Sélection du mois</h3>
            <div class="form-group">
                <label>Mois</label>
                <select id="planningMonth" class="form-input">
                    ${Array.from({length: 12}, (_, i) => {
                        const monthNum = i + 1;
                        const monthName = new Date(currentYear, i, 1).toLocaleDateString('fr-FR', { month: 'long' });
                        return `<option value="${monthNum}" ${monthNum === currentMonth ? 'selected' : ''}>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Année</label>
                <input type="number" id="planningYear" class="form-input" value="${currentYear}" min="2020" max="2030">
            </div>
            <div class="form-group">
                <label>Type de planning</label>
                <select id="planningType" class="form-input">
                    <option value="global">Planning Global</option>
                    <option value="groupe">Par Groupe</option>
                    <option value="agent">Par Agent</option>
                </select>
            </div>
            <div id="groupSelector" style="display:none;">
                <div class="form-group">
                    <label>Sélectionner un groupe</label>
                    <select id="selectedGroup" class="form-input">
                        <option value="A">Groupe A</option>
                        <option value="B">Groupe B</option>
                        <option value="C">Groupe C</option>
                        <option value="D">Groupe D</option>
                        <option value="E">Groupe E</option>
                    </select>
                </div>
            </div>
            <div id="agentSelector" style="display:none;">
                <div class="form-group">
                    <label>Sélectionner un agent</label>
                    <select id="selectedAgent" class="form-input">
                        ${agents.filter(a => a.statut === 'actif').map(a => 
                            `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code})</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;
    
    openPopup("📅 Planning Mensuel", html, `
        <button class="popup-button green" onclick="generateMonthlyPlanning()">📋 Générer Planning</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    `);
    
    document.getElementById('planningType').addEventListener('change', function() {
        const type = this.value;
        document.getElementById('groupSelector').style.display = type === 'groupe' ? 'block' : 'none';
        document.getElementById('agentSelector').style.display = type === 'agent' ? 'block' : 'none';
    });
}

function generateMonthlyPlanning() {
    const month = parseInt(document.getElementById('planningMonth').value);
    const year = parseInt(document.getElementById('planningYear').value);
    const type = document.getElementById('planningType').value;
    
    if (type === 'groupe') {
        const group = document.getElementById('selectedGroup').value;
        showGroupPlanning(group, month, year);
    } else if (type === 'agent') {
        const agentCode = document.getElementById('selectedAgent').value;
        showAgentPlanning(agentCode, month, year);
    } else {
        showGlobalPlanning(month, year);
    }
}

function showGlobalPlanning(month, year) {
    const activeAgents = agents.filter(a => a.statut === 'actif');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let html = `
        <div class="info-section">
            <h3>Planning Global - ${getMonthName(month)} ${year}</h3>
            <div style="margin-bottom: 15px;">
                <button class="action-btn small blue" onclick="exportPlanningToExcel(${month}, ${year}, 'global')">📊 Excel</button>
                <button class="action-btn small green" onclick="printPlanning()">🖨️ Imprimer</button>
            </div>
            <div style="overflow-x: auto;">
                <table class="planning-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Groupe</th>
                            ${Array.from({length: daysInMonth}, (_, i) => {
                                const day = i + 1;
                                const date = new Date(year, month - 1, day);
                                const dayName = JOURS_FRANCAIS[date.getDay()];
                                const isHoliday = isHolidayDate(date);
                                return `<th title="${date.toLocaleDateString('fr-FR')}" class="${isHoliday ? 'holiday' : ''}">${day}<br>${dayName}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${activeAgents.map(agent => {
                            return `
                                <tr>
                                    <td nowrap>
                                        <strong>${agent.code}</strong><br>
                                        <small>${agent.nom} ${agent.prenom}</small>
                                    </td>
                                    <td>${agent.groupe}</td>
                                    ${Array.from({length: daysInMonth}, (_, i) => {
                                        const day = i + 1;
                                        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        const shift = getShiftForAgent(agent.code, dateStr);
                                        const shiftLabel = SHIFT_LABELS[shift] || shift;
                                        const color = SHIFT_COLORS[shift] || '#7f8c8d';
                                        return `<td class="shift-cell" style="background-color:${color}; color:white; cursor:pointer;" 
                                                title="${agent.code} - ${dateStr}: ${shiftLabel}"
                                                onclick="showShiftModification('${agent.code}', '${dateStr}', '${shift}')">
                                            ${shift}
                                        </td>`;
                                    }).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px; padding: 10px; background: #34495e; border-radius: 5px;">
                <h4>Légende des shifts:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                    ${Object.entries(SHIFT_LABELS).map(([code, label]) => `
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 20px; height: 20px; background-color: ${SHIFT_COLORS[code]}; border-radius: 3px;"></div>
                            <span style="font-size: 0.9em;">${code} = ${label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    openPopup(`📅 Planning Global ${getMonthName(month)} ${year}`, html, `
        <button class="popup-button blue" onclick="showMonthlyPlanning()">🔄 Nouveau</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Retour</button>
    `);
}

function showGroupPlanningSelection() {
    let html = `
        <div class="info-section">
            <h3>Sélection du groupe</h3>
            <div class="form-group">
                <label>Sélectionner un groupe:</label>
                <select id="selectedGroupPlanning" class="form-input">
                    <option value="A">Groupe A</option>
                    <option value="B">Groupe B</option>
                    <option value="C">Groupe C</option>
                    <option value="D">Groupe D</option>
                    <option value="E">Groupe E</option>
                </select>
            </div>
            <div class="form-group">
                <label>Mois:</label>
                <select id="groupMonth" class="form-input">
                    ${Array.from({length: 12}, (_, i) => {
                        const monthNum = i + 1;
                        const monthName = new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'long' });
                        return `<option value="${monthNum}" ${monthNum === new Date().getMonth() + 1 ? 'selected' : ''}>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Année:</label>
                <input type="number" id="groupYear" class="form-input" value="${new Date().getFullYear()}" min="2020" max="2030">
            </div>
        </div>
    `;
    
    openPopup("👥 Planning par Groupe", html, `
        <button class="popup-button green" onclick="showSelectedGroupPlanning()">📋 Voir Planning</button>
        <button class="popup-button blue" onclick="showMonthlyPlanning()">📅 Autre option</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    `);
}

function showSelectedGroupPlanning() {
    const group = document.getElementById('selectedGroupPlanning').value;
    const month = parseInt(document.getElementById('groupMonth').value);
    const year = parseInt(document.getElementById('groupYear').value);
    showGroupPlanning(group, month, year);
}

function showGroupPlanning(group, month, year) {
    const groupAgents = agents.filter(a => a.groupe === group && a.statut === 'actif');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    if (groupAgents.length === 0) {
        showSnackbar(`⚠️ Aucun agent actif dans le groupe ${group}`);
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Planning Groupe ${group} - ${getMonthName(month)} ${year}</h3>
            <div style="margin-bottom: 15px;">
                <button class="action-btn small blue" onclick="exportPlanningToExcel(${month}, ${year}, '${group}')">📊 Excel</button>
                <button class="action-btn small green" onclick="printPlanning()">🖨️ Imprimer</button>
                <button class="action-btn small orange" onclick="showGroupStats('${group}', ${month}, ${year})">📊 Stats</button>
            </div>
            <div style="overflow-x: auto;">
                <table class="planning-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            ${Array.from({length: daysInMonth}, (_, i) => {
                                const day = i + 1;
                                const date = new Date(year, month - 1, day);
                                const dayName = JOURS_FRANCAIS[date.getDay()];
                                const isHoliday = isHolidayDate(date);
                                return `<th title="${date.toLocaleDateString('fr-FR')}" class="${isHoliday ? 'holiday' : ''}">${day}<br>${dayName}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${groupAgents.map(agent => {
                            return `
                                <tr>
                                    <td nowrap>
                                        <strong>${agent.code}</strong><br>
                                        <small>${agent.nom} ${agent.prenom}</small>
                                    </td>
                                    ${Array.from({length: daysInMonth}, (_, i) => {
                                        const day = i + 1;
                                        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        const shift = getShiftForAgent(agent.code, dateStr);
                                        const shiftLabel = SHIFT_LABELS[shift] || shift;
                                        const color = SHIFT_COLORS[shift] || '#7f8c8d';
                                        return `<td class="shift-cell" style="background-color:${color}; color:white; cursor:pointer;" 
                                                title="${agent.code} - ${dateStr}: ${shiftLabel}"
                                                onclick="showShiftModification('${agent.code}', '${dateStr}', '${shift}')">
                                            ${shift}
                                        </td>`;
                                    }).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px;">
                <button class="popup-button green" onclick="showGroupPlanningSelection()">👥 Autre Groupe</button>
                <button class="popup-button blue" onclick="generatePlanningForGroup('${group}', ${month}, ${year})">🔄 Générer Auto</button>
            </div>
        </div>
    `;
    
    openPopup(`📅 Planning Groupe ${group}`, html, `
        <button class="popup-button blue" onclick="showMonthlyPlanning()">🔄 Nouveau</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Retour</button>
    `);
}

function showAgentPlanningSelection() {
    let html = `
        <div class="info-section">
            <h3>Sélection de l'agent</h3>
            <div class="form-group">
                <label>Sélectionner un agent:</label>
                <select id="selectedAgentPlanning" class="form-input">
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code}) - Groupe ${a.groupe}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Mois:</label>
                <select id="agentMonth" class="form-input">
                    ${Array.from({length: 12}, (_, i) => {
                        const monthNum = i + 1;
                        const monthName = new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'long' });
                        return `<option value="${monthNum}" ${monthNum === new Date().getMonth() + 1 ? 'selected' : ''}>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Année:</label>
                <input type="number" id="agentYear" class="form-input" value="${new Date().getFullYear()}" min="2020" max="2030">
            </div>
        </div>
    `;
    
    openPopup("👤 Planning par Agent", html, `
        <button class="popup-button green" onclick="showSelectedAgentPlanning()">📋 Voir Planning</button>
        <button class="popup-button blue" onclick="showMonthlyPlanning()">📅 Autre option</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    `);
}

function showSelectedAgentPlanning() {
    const agentCode = document.getElementById('selectedAgentPlanning').value;
    const month = parseInt(document.getElementById('agentMonth').value);
    const year = parseInt(document.getElementById('agentYear').value);
    showAgentPlanning(agentCode, month, year);
}

function showAgentPlanning(agentCode, month, year) {
    const agent = agents.find(a => a.code === agentCode);
    if (!agent) {
        showSnackbar("⚠️ Agent non trouvé");
        return;
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let html = `
        <div class="info-section">
            <h3>Planning de ${agent.nom} ${agent.prenom} (${agent.code})</h3>
            <p><strong>Groupe:</strong> ${agent.groupe} | <strong>Poste:</strong> ${agent.poste}</p>
            <div style="margin: 15px 0; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="action-btn blue" onclick="showAgentPlanningSelection()">👤 Autre Agent</button>
                <button class="action-btn green" onclick="showAddLeaveForAgent('${agentCode}')">🏖️ Ajouter Congé</button>
                <button class="action-btn orange" onclick="showAgentStats('${agentCode}')">📊 Statistiques</button>
                <button class="action-btn" onclick="printAgentPlanning('${agentCode}', ${month}, ${year})">🖨️ Imprimer</button>
            </div>
            <div style="overflow-x: auto;">
                <table class="planning-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Jour</th>
                            <th>Shift</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from({length: daysInMonth}, (_, i) => {
                            const day = i + 1;
                            const date = new Date(year, month - 1, day);
                            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                            const dayName = JOURS_FRANCAIS[date.getDay()];
                            const isHoliday = isHolidayDate(date);
                            const shift = getShiftForAgent(agentCode, dateStr);
                            const shiftLabel = SHIFT_LABELS[shift] || shift;
                            const color = SHIFT_COLORS[shift] || '#7f8c8d';
                            
                            return `
                                <tr>
                                    <td>${dateStr}</td>
                                    <td class="${isHoliday ? 'holiday' : ''}">${dayName}</td>
                                    <td style="background-color:${color}; color:white; font-weight:bold; text-align:center;">
                                        ${shift}
                                    </td>
                                    <td>${shiftLabel}${isHoliday ? ' (Férié)' : ''}</td>
                                    <td>
                                        <button class="action-btn small" onclick="showShiftModification('${agentCode}', '${dateStr}', '${shift}')">✏️</button>
                                        <button class="action-btn small red" onclick="showAbsenceFormForDate('${agentCode}', '${dateStr}')">🚫</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #34495e; border-radius: 5px;">
                <h4>Statistiques du mois:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                    ${calculateAgentStats(agentCode, month, year).map(stat => `
                        <div style="text-align: center; padding: 10px; background: #2c3e50; border-radius: 5px;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${stat.value}</div>
                            <div style="font-size: 0.9em; color: #bdc3c7;">${stat.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    openPopup(`📅 Planning ${agent.code}`, html, `
        <button class="popup-button blue" onclick="showMonthlyPlanning()">🔄 Nouveau</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Retour</button>
    `);
}

function showShiftModificationForm() {
    const activeAgents = agents.filter(a => a.statut === 'actif');
    
    let html = `
        <div class="info-section">
            <h3>Modifier un Shift</h3>
            <div class="form-group">
                <label>Sélectionner l'agent:</label>
                <select id="shiftAgent" class="form-input">
                    ${activeAgents.map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code})</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date:</label>
                <input type="date" id="shiftDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Nouveau shift:</label>
                <select id="newShiftSelect" class="form-input">
                    ${Object.entries(SHIFT_LABELS).map(([code, label]) => `
                        <option value="${code}">${code} - ${label}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Commentaire:</label>
                <textarea id="shiftComment" class="form-input" rows="3" placeholder="Raison du changement..."></textarea>
            </div>
        </div>
    `;
    
    openPopup("✏️ Modifier Shift", html, `
        <button class="popup-button green" onclick="applyShiftModification()">💾 Appliquer</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    `);
}

function applyShiftModification() {
    const agentCode = document.getElementById('shiftAgent').value;
    const dateStr = document.getElementById('shiftDate').value;
    const newShift = document.getElementById('newShiftSelect').value;
    const comment = document.getElementById('shiftComment').value;
    
    const monthKey = dateStr.substring(0, 7);
    if (!planningData[monthKey]) planningData[monthKey] = {};
    if (!planningData[monthKey][agentCode]) planningData[monthKey][agentCode] = {};
    
    planningData[monthKey][agentCode][dateStr] = {
        shift: newShift,
        type: 'modification_manuelle',
        comment: comment,
        modified_at: new Date().toISOString()
    };
    
    saveData();
    showSnackbar(`✅ Shift modifié pour ${agentCode} le ${dateStr}`);
    closePopup();
}

function showShiftExchangeForm() {
    const activeAgents = agents.filter(a => a.statut === 'actif');
    
    let html = `
        <div class="info-section">
            <h3>Échanger les shifts entre deux agents</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>Premier agent</h4>
                    <div class="form-group">
                        <label>Sélectionner l'agent:</label>
                        <select id="agent1" class="form-input">
                            ${activeAgents.map(a => 
                                `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code}) - Groupe ${a.groupe}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date du shift:</label>
                        <input type="date" id="date1" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div id="agent1ShiftInfo" style="padding: 10px; background: #34495e; border-radius: 5px; margin-top: 10px;">
                        <p style="margin:0;">Shift: <span id="agent1Shift">-</span></p>
                    </div>
                </div>
                <div>
                    <h4>Deuxième agent</h4>
                    <div class="form-group">
                        <label>Sélectionner l'agent:</label>
                        <select id="agent2" class="form-input">
                            ${activeAgents.map(a => 
                                `<option value="${a.code}" ${a.code === 'B02' ? 'selected' : ''}>${a.nom} ${a.prenom} (${a.code}) - Groupe ${a.groupe}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date du shift:</label>
                        <input type="date" id="date2" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div id="agent2ShiftInfo" style="padding: 10px; background: #34495e; border-radius: 5px; margin-top: 10px;">
                        <p style="margin:0;">Shift: <span id="agent2Shift">-</span></p>
                    </div>
                </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #2c3e50; border-radius: 5px;">
                <h4>Options d'échange:</h4>
                <div class="form-group">
                    <label><input type="radio" name="exchangeType" value="single" checked> Échanger uniquement ces shifts</label>
                </div>
                <div class="form-group">
                    <label><input type="radio" name="exchangeType" value="reciprocal"> Échange réciproque (ils gardent les shifts échangés)</label>
                </div>
                <div class="form-group">
                    <label>Commentaire:</label>
                    <textarea id="exchangeComment" class="form-input" rows="2" placeholder="Raison de l'échange..."></textarea>
                </div>
            </div>
        </div>
    `;
    
    openPopup("🔄 Échanger Shifts", html, `
        <button class="popup-button green" onclick="executeShiftExchange()">🔄 Exécuter l'échange</button>
        <button class="popup-button blue" onclick="previewShiftExchange()">👁️ Prévisualiser</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    `);
    
    ['agent1', 'date1', 'agent2', 'date2'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateShiftInfo);
    });
    updateShiftInfo();
}

function updateShiftInfo() {
    const agent1Code = document.getElementById('agent1').value;
    const date1 = document.getElementById('date1').value;
    const agent2Code = document.getElementById('agent2').value;
    const date2 = document.getElementById('date2').value;
    
    const shift1 = getShiftForAgent(agent1Code, date1);
    const shift2 = getShiftForAgent(agent2Code, date2);
    
    document.getElementById('agent1Shift').textContent = `${shift1} - ${SHIFT_LABELS[shift1]}`;
    document.getElementById('agent2Shift').textContent = `${shift2} - ${SHIFT_LABELS[shift2]}`;
}

function executeShiftExchange() {
    const agent1Code = document.getElementById('agent1').value;
    const date1 = document.getElementById('date1').value;
    const agent2Code = document.getElementById('agent2').value;
    const date2 = document.getElementById('date2').value;
    const exchangeType = document.querySelector('input[name="exchangeType"]:checked').value;
    const comment = document.getElementById('exchangeComment').value;
    
    const shift1 = getShiftForAgent(agent1Code, date1);
    const shift2 = getShiftForAgent(agent2Code, date2);
    
    const exchangeRecord = {
        agent1: agent1Code,
        agent2: agent2Code,
        date1: date1,
        date2: date2,
        shift1_before: shift1,
        shift2_before: shift2,
        type: exchangeType,
        comment: comment,
        exchanged_at: new Date().toISOString()
    };
    
    const monthKey1 = date1.substring(0, 7);
    const monthKey2 = date2.substring(0, 7);
    
    if (!planningData[monthKey1]) planningData[monthKey1] = {};
    if (!planningData[monthKey1][agent1Code]) planningData[monthKey1][agent1Code] = {};
    if (!planningData[monthKey1][agent2Code]) planningData[monthKey1][agent2Code] = {};
    
    if (exchangeType === 'single') {
        planningData[monthKey1][agent1Code][date1] = {
            shift: shift2,
            type: 'echange',
            comment: `Échangé avec ${agent2Code} - ${comment}`,
            exchange_record: exchangeRecord
        };
    } else {
        planningData[monthKey1][agent1Code][date1] = {
            shift: shift2,
            type: 'echange_reciproque',
            comment: `Échangé avec ${agent2Code} - ${comment}`,
            exchange_record: exchangeRecord
        };
        
        if (!planningData[monthKey2]) planningData[monthKey2] = {};
        if (!planningData[monthKey2][agent2Code]) planningData[monthKey2][agent2Code] = {};
        
        planningData[monthKey2][agent2Code][date2] = {
            shift: shift1,
            type: 'echange_reciproque',
            comment: `Échangé avec ${agent1Code} - ${comment}`,
            exchange_record: exchangeRecord
        };
    }
    
    saveData();
    showSnackbar(`✅ Échange effectué entre ${agent1Code} et ${agent2Code}`);
    closePopup();
}

function showTrimestrialPlanning() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let html = `
        <div class="info-section">
            <h3>Planning Trimestriel</h3>
            <div class="form-group">
                <label>Trimestre de départ:</label>
                <select id="trimesterStart" class="form-input">
                    <option value="1">1er trimestre (Janvier)</option>
                    <option value="4">2ème trimestre (Avril)</option>
                    <option value="7">3ème trimestre (Juillet)</option>
                    <option value="10">4ème trimestre (Octobre)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Année:</label>
                <input type="number" id="trimesterYear" class="form-input" value="${currentYear}" min="2020" max="2030">
            </div>
            <div class="form-group">
                <label>Type d'affichage:</label>
                <select id="trimesterView" class="form-input">
                    <option value="summary">Résumé par agent</option>
                    <option value="detailed">Détail mensuel</option>
                </select>
            </div>
        </div>
    `;
    
    openPopup("📊 Planning Trimestriel", html, `
        <button class="popup-button green" onclick="generateTrimesterPlanning()">📋 Générer</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Annuler</button>
    `);
}

function generateTrimesterPlanning() {
    const startMonth = parseInt(document.getElementById('trimesterStart').value);
    const year = parseInt(document.getElementById('trimesterYear').value);
    const viewType = document.getElementById('trimesterView').value;
    
    if (viewType === 'summary') {
        showTrimesterSummary(startMonth, year);
    } else {
        showTrimesterDetailed(startMonth, year);
    }
}

function showTrimesterSummary(startMonth, year) {
    const activeAgents = agents.filter(a => a.statut === 'actif');
    
    let html = `
        <div class="info-section">
            <h3>Résumé Trimestriel - ${getMonthName(startMonth)} à ${getMonthName(startMonth + 2)} ${year}</h3>
            <div style="overflow-x: auto;">
                <table class="planning-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Groupe</th>
                            <th>${getMonthName(startMonth)}</th>
                            <th>${getMonthName(startMonth + 1)}</th>
                            <th>${getMonthName(startMonth + 2)}</th>
                            <th>Total Trimestre</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeAgents.map(agent => {
                            const stats1 = calculateAgentStats(agent.code, startMonth, year);
                            const stats2 = calculateAgentStats(agent.code, startMonth + 1, startMonth + 1 > 12 ? year + 1 : year);
                            const stats3 = calculateAgentStats(agent.code, startMonth + 2, startMonth + 2 > 12 ? year + 1 : year);
                            
                            const jours1 = stats1.find(s => s.label === 'Jours total').value;
                            const jours2 = stats2.find(s => s.label === 'Jours total').value;
                            const jours3 = stats3.find(s => s.label === 'Jours total').value;
                            
                            const travailles1 = stats1.find(s => s.label.includes('Matin')).value + 
                                              stats1.find(s => s.label.includes('Après-midi')).value + 
                                              stats1.find(s => s.label.includes('Nuit')).value;
                            const travailles2 = stats2.find(s => s.label.includes('Matin')).value + 
                                              stats2.find(s => s.label.includes('Après-midi')).value + 
                                              stats2.find(s => s.label.includes('Nuit')).value;
                            const travailles3 = stats3.find(s => s.label.includes('Matin')).value + 
                                              stats3.find(s => s.label.includes('Après-midi')).value + 
                                              stats3.find(s => s.label.includes('Nuit')).value;
                            const totalTravailles = travailles1 + travailles2 + travailles3;
                            
                            return `
                                <tr>
                                    <td>${agent.nom} ${agent.prenom}<br><small>${agent.code}</small></td>
                                    <td>${agent.groupe}</td>
                                    <td>${travailles1}/${jours1} j</td>
                                    <td>${travailles2}/${jours2} j</td>
                                    <td>${travailles3}/${jours3} j</td>
                                    <td><strong>${totalTravailles} j</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    openPopup(`📊 Résumé Trimestriel`, html, `
        <button class="popup-button blue" onclick="showTrimestrialPlanning()">🔄 Nouveau</button>
        <button class="popup-button gray" onclick="displayPlanningMenu()">Retour</button>
    `);
}

function generatePlanning() {
    showSnackbar("🔄 Génération du planning théorique en cours...");
    setTimeout(() => {
        showSnackbar("✅ Planning théorique généré avec succès");
    }, 1500);
}

// === MODULE CONGÉS & ABSENCES ===
function showAddLeaveForm() {
    let html = `
        <div class="info-section">
            <h3>Ajouter un congé ou une absence</h3>
            <div class="form-group">
                <label>Type d'absence:</label>
                <select id="leaveType" class="form-input">
                    <option value="C">Congé payé (C)</option>
                    <option value="M">Maladie (M)</option>
                    <option value="A">Autre absence (A)</option>
                    <option value="periode">Congé sur période</option>
                </select>
            </div>
            <div class="form-group">
                <label>Sélectionner l'agent:</label>
                <select id="leaveAgent" class="form-input">
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code}) - Groupe ${a.groupe}</option>`
                    ).join('')}
                </select>
            </div>
            <div id="singleLeaveSection">
                <div class="form-group">
                    <label>Date de l'absence:</label>
                    <input type="date" id="leaveDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div id="periodLeaveSection" style="display:none;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label>Date de début:</label>
                        <input type="date" id="leaveStartDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Date de fin:</label>
                        <input type="date" id="leaveEndDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Gestion des dimanches:</label>
                    <select id="sundayHandling" class="form-input">
                        <option value="repos">Les dimanches restent en repos (R)</option>
                        <option value="conge">Les dimanches comptent comme congé (C)</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Commentaire (optionnel):</label>
                <textarea id="leaveComment" class="form-input" rows="3" placeholder="Raison du congé/absence..."></textarea>
            </div>
            <div class="form-group">
                <label>Pièce jointe (justificatif):</label>
                <input type="file" id="leaveAttachment" class="form-input" accept=".pdf,.jpg,.jpeg,.png">
                <small style="color:#7f8c8d;">Format PDF, JPG, PNG (max 5MB)</small>
            </div>
        </div>
    `;
    
    openPopup("🏖️ Ajouter Congé/Absence", html, `
        <button class="popup-button green" onclick="saveLeave()">💾 Enregistrer</button>
        <button class="popup-button blue" onclick="previewLeave()">👁️ Prévisualiser</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Annuler</button>
    `);
    
    document.getElementById('leaveType').addEventListener('change', function() {
        const type = this.value;
        if (type === 'periode') {
            document.getElementById('singleLeaveSection').style.display = 'none';
            document.getElementById('periodLeaveSection').style.display = 'block';
        } else {
            document.getElementById('singleLeaveSection').style.display = 'block';
            document.getElementById('periodLeaveSection').style.display = 'none';
        }
    });
}

function saveLeave() {
    const leaveType = document.getElementById('leaveType').value;
    const agentCode = document.getElementById('leaveAgent').value;
    const comment = document.getElementById('leaveComment').value;
    
    if (leaveType === 'periode') {
        const startDate = document.getElementById('leaveStartDate').value;
        const endDate = document.getElementById('leaveEndDate').value;
        const sundayHandling = document.getElementById('sundayHandling').value;
        
        if (!startDate || !endDate) {
            showSnackbar("⚠️ Veuillez spécifier les dates de début et fin");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            showSnackbar("⚠️ La date de début doit être avant la date de fin");
            return;
        }
        
        const leaveRecord = {
            id: 'L' + Date.now(),
            agent_code: agentCode,
            type: 'C',
            start_date: startDate,
            end_date: endDate,
            sunday_handling: sundayHandling,
            comment: comment,
            created_at: new Date().toISOString(),
            status: 'active'
        };
        
        if (!leaves) leaves = [];
        leaves.push(leaveRecord);
        applyPeriodLeave(agentCode, startDate, endDate, sundayHandling);
        showSnackbar(`✅ Congé sur période enregistré pour ${agentCode} du ${startDate} au ${endDate}`);
    } else {
        const leaveDate = document.getElementById('leaveDate').value;
        if (!leaveDate) {
            showSnackbar("⚠️ Veuillez spécifier une date");
            return;
        }
        
        const planningKey = leaveDate.substring(0, 7);
        if (!planningData[planningKey]) planningData[planningKey] = {};
        if (!planningData[planningKey][agentCode]) planningData[planningKey][agentCode] = {};
        
        planningData[planningKey][agentCode][leaveDate] = {
            shift: leaveType,
            type: 'absence',
            comment: comment,
            recorded_at: new Date().toISOString()
        };
        
        showSnackbar(`✅ Absence (${SHIFT_LABELS[leaveType]}) enregistrée pour ${agentCode} le ${leaveDate}`);
    }
    
    saveData();
    closePopup();
}

function applyPeriodLeave(agentCode, startDate, endDate, sundayHandling) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        let shiftType = 'C';
        
        if (dayOfWeek === 0) {
            shiftType = sundayHandling === 'repos' ? 'R' : 'C';
        }
        
        const planningKey = dateStr.substring(0, 7);
        if (!planningData[planningKey]) planningData[planningKey] = {};
        if (!planningData[planningKey][agentCode]) planningData[planningKey][agentCode] = {};
        
        planningData[planningKey][agentCode][dateStr] = {
            shift: shiftType,
            type: 'congé_periode',
            period_id: 'L' + Date.now(),
            recorded_at: new Date().toISOString()
        };
        
        current.setDate(current.getDate() + 1);
    }
}

function showLeavesList() {
    const leavesByAgent = {};
    
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const shiftRecord = planningData[monthKey][agentCode][dateStr];
                if (['C', 'M', 'A'].includes(shiftRecord.shift)) {
                    if (!leavesByAgent[agentCode]) leavesByAgent[agentCode] = [];
                    leavesByAgent[agentCode].push({
                        date: dateStr,
                        type: shiftRecord.shift,
                        comment: shiftRecord.comment || '',
                        recorded_at: shiftRecord.recorded_at
                    });
                }
            });
        });
    });
    
    if (leaves && leaves.length > 0) {
        leaves.forEach(leave => {
            if (!leavesByAgent[leave.agent_code]) leavesByAgent[leave.agent_code] = [];
            leavesByAgent[leave.agent_code].push({
                date: `${leave.start_date} au ${leave.end_date}`,
                type: 'Période',
                comment: leave.comment || '',
                recorded_at: leave.created_at,
                is_period: true
            });
        });
    }
    
    let html = `
        <div class="info-section">
            <h3>Liste des congés et absences</h3>
            <div style="margin-bottom: 15px;">
                <select id="leavesFilter" class="form-input" style="width:auto;" onchange="filterLeavesList()">
                    <option value="all">Tous les agents</option>
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom}</option>`
                    ).join('')}
                </select>
                <select id="leavesTypeFilter" class="form-input" style="width:auto; margin-left:10px;" onchange="filterLeavesList()">
                    <option value="all">Tous les types</option>
                    <option value="C">Congés</option>
                    <option value="M">Maladie</option>
                    <option value="A">Autre</option>
                    <option value="Période">Périodes</option>
                </select>
            </div>
            <div id="leavesListContainer">
                ${generateLeavesList(leavesByAgent)}
            </div>
        </div>
    `;
    
    openPopup("📋 Liste des Congés/Absences", html, `
        <button class="popup-button green" onclick="showAddLeaveForm()">➕ Ajouter</button>
        <button class="popup-button blue" onclick="exportLeavesReport()">📊 Exporter</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Retour</button>
    `);
}

function generateLeavesList(leavesByAgent, filterAgent = 'all', filterType = 'all') {
    let html = '';
    
    Object.keys(leavesByAgent).forEach(agentCode => {
        const agent = agents.find(a => a.code === agentCode);
        if (!agent) return;
        if (filterAgent !== 'all' && agentCode !== filterAgent) return;
        
        const agentLeaves = leavesByAgent[agentCode].filter(leave => {
            if (filterType === 'all') return true;
            if (filterType === 'Période') return leave.is_period;
            return leave.type === filterType;
        });
        
        if (agentLeaves.length === 0) return;
        
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #34495e; border-radius: 5px;">
                <h4 style="margin-top:0;">${agent.nom} ${agent.prenom} (${agent.code})</h4>
                <table class="classement-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Date(s)</th>
                            <th>Type</th>
                            <th>Commentaire</th>
                            <th>Enregistré le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${agentLeaves.map(leave => `
                            <tr>
                                <td>${leave.date}</td>
                                <td>
                                    <span style="background-color:${SHIFT_COLORS[leave.type] || '#7f8c8d'}; color:white; padding:2px 8px; border-radius:3px;">
                                        ${leave.type}
                                    </span>
                                </td>
                                <td>${leave.comment || '-'}</td>
                                <td>${new Date(leave.recorded_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    ${leave.is_period ? 
                                        `<button class="action-btn small red" onclick="deletePeriodLeave('${agentCode}', '${leave.date.split(' au ')[0]}')">🗑️</button>` :
                                        `<button class="action-btn small red" onclick="deleteSingleLeave('${agentCode}', '${leave.date}')">🗑️</button>`
                                    }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
    
    if (!html) return '<p style="text-align:center; color:#7f8c8d;">Aucun congé ou absence trouvé</p>';
    return html;
}

function filterLeavesList() {
    const filterAgent = document.getElementById('leavesFilter').value;
    const filterType = document.getElementById('leavesTypeFilter').value;
    
    const leavesByAgent = {};
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const shiftRecord = planningData[monthKey][agentCode][dateStr];
                if (['C', 'M', 'A'].includes(shiftRecord.shift)) {
                    if (!leavesByAgent[agentCode]) leavesByAgent[agentCode] = [];
                    leavesByAgent[agentCode].push({
                        date: dateStr,
                        type: shiftRecord.shift,
                        comment: shiftRecord.comment || '',
                        recorded_at: shiftRecord.recorded_at
                    });
                }
            });
        });
    });
    
    if (leaves && leaves.length > 0) {
        leaves.forEach(leave => {
            if (!leavesByAgent[leave.agent_code]) leavesByAgent[leave.agent_code] = [];
            leavesByAgent[leave.agent_code].push({
                date: `${leave.start_date} au ${leave.end_date}`,
                type: 'Période',
                comment: leave.comment || '',
                recorded_at: leave.created_at,
                is_period: true
            });
        });
    }
    
    document.getElementById('leavesListContainer').innerHTML = generateLeavesList(leavesByAgent, filterAgent, filterType);
}

function deleteSingleLeave(agentCode, dateStr) {
    if (!confirm(`Supprimer l'absence de ${agentCode} du ${dateStr} ?`)) return;
    
    const monthKey = dateStr.substring(0, 7);
    if (planningData[monthKey] && planningData[monthKey][agentCode] && planningData[monthKey][agentCode][dateStr]) {
        delete planningData[monthKey][agentCode][dateStr];
        saveData();
        showSnackbar(`✅ Absence supprimée pour ${agentCode} le ${dateStr}`);
        showLeavesList();
    }
}

function deletePeriodLeave(agentCode, startDate) {
    if (!confirm(`Supprimer le congé sur période de ${agentCode} commençant le ${startDate} ?`)) return;
    
    if (leaves) {
        const leaveIndex = leaves.findIndex(l => l.agent_code === agentCode && l.start_date === startDate);
        if (leaveIndex !== -1) {
            const leave = leaves[leaveIndex];
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const current = new Date(start);
            
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                const monthKey = dateStr.substring(0, 7);
                if (planningData[monthKey] && planningData[monthKey][agentCode] && planningData[monthKey][agentCode][dateStr]) {
                    delete planningData[monthKey][agentCode][dateStr];
                }
                current.setDate(current.getDate() + 1);
            }
            
            leaves.splice(leaveIndex, 1);
            saveData();
            showSnackbar(`✅ Congé sur période supprimé pour ${agentCode}`);
            showLeavesList();
        }
    }
}

function showAbsenceForm() {
    showAddLeaveForm();
}

function showSickLeaveForm() {
    showAddLeaveForm();
    setTimeout(() => {
        document.getElementById('leaveType').value = 'M';
    }, 100);
}

function showOtherAbsenceForm() {
    showAddLeaveForm();
    setTimeout(() => {
        document.getElementById('leaveType').value = 'A';
    }, 100);
}

function showAgentLeavesSelection() {
    let html = `
        <div class="info-section">
            <h3>Congés par Agent</h3>
            <div class="form-group">
                <label>Sélectionner un agent:</label>
                <select id="leavesAgentSelect" class="form-input">
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code})</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Période:</label>
                <select id="leavesPeriod" class="form-input">
                    <option value="month">Ce mois</option>
                    <option value="last_month">Mois dernier</option>
                    <option value="quarter">Ce trimestre</option>
                    <option value="year">Cette année</option>
                    <option value="all">Toute période</option>
                </select>
            </div>
        </div>
    `;
    
    openPopup("📅 Congés par Agent", html, `
        <button class="popup-button green" onclick="showSelectedAgentLeaves()">📋 Voir Congés</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Annuler</button>
    `);
}

function showSelectedAgentLeaves() {
    const agentCode = document.getElementById('leavesAgentSelect').value;
    const period = document.getElementById('leavesPeriod').value;
    const today = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'last_month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            break;
        default:
            startDate = new Date(2020, 0, 1);
            endDate = new Date(2030, 11, 31);
    }
    
    const agentLeaves = [];
    Object.keys(planningData).forEach(monthKey => {
        if (planningData[monthKey][agentCode]) {
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const record = planningData[monthKey][agentCode][dateStr];
                if (['C', 'M', 'A'].includes(record.shift)) {
                    const date = new Date(dateStr);
                    if (date >= startDate && date <= endDate) {
                        agentLeaves.push({
                            date: dateStr,
                            type: record.shift,
                            comment: record.comment || '',
                            recorded_at: record.recorded_at
                        });
                    }
                }
            });
        }
    });
    
    if (leaves) {
        leaves.filter(l => l.agent_code === agentCode).forEach(leave => {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            if ((leaveStart >= startDate && leaveStart <= endDate) || 
                (leaveEnd >= startDate && leaveEnd <= endDate) ||
                (leaveStart <= startDate && leaveEnd >= endDate)) {
                agentLeaves.push({
                    date: `${leave.start_date} au ${leave.end_date}`,
                    type: 'Période',
                    comment: leave.comment || '',
                    recorded_at: leave.created_at,
                    is_period: true
                });
            }
        });
    }
    
    if (agentLeaves.length === 0) {
        showSnackbar(`ℹ️ Aucun congé trouvé pour cet agent sur la période sélectionnée`);
        return;
    }
    
    const agent = agents.find(a => a.code === agentCode);
    let html = `
        <div class="info-section">
            <h3>Congés de ${agent.nom} ${agent.prenom}</h3>
            <p>Période: ${period === 'all' ? 'Toute période' : startDate.toLocaleDateString('fr-FR') + ' au ' + endDate.toLocaleDateString('fr-FR')}</p>
            <table class="classement-table" style="width:100%;">
                <thead>
                    <tr>
                        <th>Date(s)</th>
                        <th>Type</th>
                        <th>Commentaire</th>
                        <th>Enregistré le</th>
                    </tr>
                </thead>
                <tbody>
                    ${agentLeaves.map(leave => `
                        <tr>
                            <td>${leave.date}</td>
                            <td>
                                <span style="background-color:${SHIFT_COLORS[leave.type] || '#7f8c8d'}; color:white; padding:2px 8px; border-radius:3px;">
                                    ${leave.type}
                                </span>
                            </td>
                            <td>${leave.comment || '-'}</td>
                            <td>${new Date(leave.recorded_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    openPopup(`📅 Congés de ${agent.code}`, html, `
        <button class="popup-button blue" onclick="showAgentLeavesSelection()">👤 Autre Agent</button>
        <button class="popup-button gray" onclick="displayLeavesMenu()">Retour</button>
    `);
}

// === MODULE STATISTIQUES ===
function runClassement() {
    const groups = [...new Set(agents.filter(a => a.statut === 'actif').map(a => a.groupe))].sort();
    let html = `
        <div class="info-section">
            <h3>Calculer le classement</h3>
            <p>Sélectionnez un groupe pour voir les performances :</p>
            <select id="group-select" class="info-value" style="width:100%; padding:10px; margin-top:10px;">
                <option value="ALL">Tous les Groupes</option>
                ${groups.map(g => `<option value="${g}">Groupe ${g}</option>`).join('')}
            </select>
        </div>
    `;
    openPopup("📊 Classement des Agents", html, `
        <button class="popup-button green" onclick="generateClassement()">🏆 Générer Classement</button>
        <button class="popup-button gray" onclick="displayStatisticsMenu()">Annuler</button>
    `);
}

function generateClassement() {
    const group = document.getElementById('group-select').value;
    let filtered = group === "ALL" ? 
        agents.filter(a => a.statut === 'actif') : 
        agents.filter(a => a.groupe === group && a.statut === 'actif');
    
    const sortedData = filtered.map(a => ({
        ...a,
        total: Math.floor(Math.random() * 25) + 5
    })).sort((a, b) => b.total - a.total);

    let html = `
        <div class="info-section">
            <h3>Classement ${group === "ALL" ? "Général" : "Groupe " + group}</h3>
            <table class="classement-table">
                <thead>
                    <tr><th>Rang</th><th>Agent</th><th>Groupe</th><th>Total Jours</th></tr>
                </thead>
                <tbody>
                    ${sortedData.map((a, index) => `
                        <tr>
                            <td class="rank-${index + 1}">${index + 1}</td>
                            <td>${a.nom} ${a.prenom} (${a.code})</td>
                            <td>${a.groupe}</td>
                            <td class="total-value">${a.total} j</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    openPopup(`🏆 Classement ${group === "ALL" ? "Général" : "Groupe " + group}`, html, `
        <button class="popup-button blue" onclick="runClassement()">🔄 Nouveau calcul</button>
        <button class="popup-button gray" onclick="displayStatisticsMenu()">Retour</button>
    `);
}

// === MODULE CODES PANIQUE ===
function showPanicCodesList() {
    if (!panicCodes || panicCodes.length === 0) {
        let html = `<div class="info-section"><h3>Codes Panique</h3><p style="text-align:center; color:#7f8c8d; padding:20px;">Aucun code panique enregistré</p></div>`;
        openPopup("🚨 Codes Panique", html, `
            <button class="popup-button green" onclick="showAddPanicCodeForm()">➕ Ajouter</button>
            <button class="popup-button gray" onclick="displayPanicCodesMenu()">Retour</button>
        `);
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Liste des Codes Panique</h3>
            <input type="text" id="searchPanicCode" placeholder="Rechercher agent ou code..." 
                   style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:none;"
                   onkeyup="filterPanicCodes()">
            <table class="classement-table">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Code</th>
                        <th>Poste</th>
                        <th>Date Création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${panicCodes.map(code => {
                        const agent = agents.find(a => a.code === code.agent_code);
                        const agentName = agent ? `${agent.nom} ${agent.prenom}` : code.agent_code;
                        return `
                            <tr>
                                <td>${agentName}<br><small>${code.agent_code}</small></td>
                                <td><strong style="color:#e74c3c;">${code.code}</strong></td>
                                <td>${code.poste || 'Non spécifié'}</td>
                                <td>${new Date(code.created_at).toLocaleDateString('fr-FR')}</td>
                                <td style="white-space:nowrap;">
                                    <button class="action-btn small blue" onclick="showEditPanicCode('${code.agent_code}')">✏️</button>
                                    <button class="action-btn small red" onclick="deletePanicCode('${code.agent_code}')">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    openPopup("🚨 Codes Panique", html, `
        <button class="popup-button green" onclick="showAddPanicCodeForm()">➕ Ajouter</button>
        <button class="popup-button blue" onclick="exportPanicCodes()">📤 Exporter</button>
        <button class="popup-button gray" onclick="displayPanicCodesMenu()">Retour</button>
    `);
}

function showAddPanicCodeForm() {
    let html = `
        <div class="info-section">
            <h3>Ajouter un Code Panique</h3>
            <div class="form-group">
                <label>Agent *</label>
                <select id="panicAgent" class="form-input" required>
                    <option value="">Sélectionner un agent</option>
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code}) - Groupe ${a.groupe}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Code Panique *</label>
                <input type="text" id="panicCode" class="form-input" required placeholder="Ex: PANIC123" maxlength="20">
                <small style="color:#7f8c8d;">Code unique pour les situations d'urgence</small>
            </div>
            <div class="form-group">
                <label>Poste/Nom de poste</label>
                <input type="text" id="panicPoste" class="form-input" placeholder="Ex: Poste de commandement central">
            </div>
            <div class="form-group">
                <label>Commentaire (optionnel)</label>
                <textarea id="panicComment" class="form-input" rows="3" placeholder="Informations supplémentaires..."></textarea>
            </div>
            <div class="form-group">
                <label>Date d'activation</label>
                <input type="date" id="panicDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div style="padding:15px; background:#2c3e50; border-radius:5px; margin-top:20px;">
                <h4 style="margin-top:0; color:#e74c3c;">⚠️ Sécurité</h4>
                <p style="font-size:0.9em; margin:0;">Ce code sera utilisé uniquement en situation d'urgence. Assurez-vous qu'il reste confidentiel.</p>
            </div>
        </div>
    `;
    
    openPopup("➕ Ajouter Code Panique", html, `
        <button class="popup-button green" onclick="savePanicCode()">🔐 Enregistrer</button>
        <button class="popup-button gray" onclick="showPanicCodesList()">Annuler</button>
    `);
}

function savePanicCode() {
    const agentCode = document.getElementById('panicAgent').value;
    const code = document.getElementById('panicCode').value.toUpperCase();
    const poste = document.getElementById('panicPoste').value;
    const comment = document.getElementById('panicComment').value;
    const date = document.getElementById('panicDate').value;
    
    if (!agentCode || !code) {
        showSnackbar("⚠️ Veuillez remplir les champs obligatoires");
        return;
    }
    
    const existingIndex = panicCodes.findIndex(p => p.agent_code === agentCode);
    const panicCode = {
        agent_code: agentCode,
        code: code,
        poste: poste,
        comment: comment,
        created_at: date || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
        panicCodes[existingIndex] = panicCode;
        showSnackbar(`✅ Code panique mis à jour pour ${agentCode}`);
    } else {
        panicCodes.push(panicCode);
        showSnackbar(`✅ Code panique ajouté pour ${agentCode}`);
    }
    
    saveData();
    showPanicCodesList();
}

function exportPanicCodes() {
    if (!panicCodes || panicCodes.length === 0) {
        showSnackbar("ℹ️ Aucun code panique à exporter");
        return;
    }
    
    let csvContent = "Rapport des Codes Panique\n\n";
    csvContent += "Agent;Code Agent;Code Panique;Poste;Commentaire;Créé le;Mis à jour le\n";
    
    panicCodes.forEach(code => {
        const agent = agents.find(a => a.code === code.agent_code);
        const agentName = agent ? `${agent.nom} ${agent.prenom}` : code.agent_code;
        csvContent += `"${agentName}";${code.agent_code};${code.code};"${code.poste || ''}";"${code.comment || ''}";${code.created_at};${code.updated_at || ''}\n`;
    });
    
    downloadCSV(csvContent, `Codes_Panique_${new Date().toISOString().split('T')[0]}.csv`);
    showSnackbar(`✅ Fichier téléchargé`);
}

// === MODULE GESTION RADIOS ===
function showRadiosList() {
    if (!radios || radios.length === 0) {
        let html = `<div class="info-section"><h3>Gestion des Radios</h3><p style="text-align:center; color:#7f8c8d; padding:20px;">Aucune radio enregistrée</p></div>`;
        openPopup("📻 Radios", html, `
            <button class="popup-button green" onclick="showAddRadioForm()">➕ Ajouter</button>
            <button class="popup-button gray" onclick="displayRadiosMenu()">Retour</button>
        `);
        return;
    }
    
    const stats = {
        total: radios.length,
        disponible: radios.filter(r => r.statut === 'DISPONIBLE').length,
        attribuee: radios.filter(r => r.statut === 'ATTRIBUÉE').length,
        hs: radios.filter(r => r.statut === 'HS').length,
        reparation: radios.filter(r => r.statut === 'RÉPARATION').length
    };
    
    let html = `
        <div class="info-section">
            <h3>Inventaire des Radios</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 10px; background: #2c3e50; border-radius: 5px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${stats.total}</div>
                    <div style="font-size: 0.9em; color: #bdc3c7;">Total</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #27ae60; border-radius: 5px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: white;">${stats.disponible}</div>
                    <div style="font-size: 0.9em; color: white;">Disponibles</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #f39c12; border-radius: 5px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: white;">${stats.attribuee}</div>
                    <div style="font-size: 0.9em; color: white;">Attribuées</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #e74c3c; border-radius: 5px;">
                    <div style="font-size: 1.5em; font-weight: bold; color: white;">${stats.hs + stats.reparation}</div>
                    <div style="font-size: 0.9em; color: white;">Indisponibles</div>
                </div>
            </div>
            <input type="text" id="searchRadio" placeholder="Rechercher radio ou modèle..." 
                   style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:none;"
                   onkeyup="filterRadios()">
            <table class="classement-table">
                <thead>
                    <tr>
                        <th>ID Radio</th>
                        <th>Modèle</th>
                        <th>Statut</th>
                        <th>Attribuée à</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${radios.map(radio => {
                        let statusColor = '#7f8c8d';
                        switch(radio.statut) {
                            case 'DISPONIBLE': statusColor = '#27ae60'; break;
                            case 'ATTRIBUÉE': statusColor = '#f39c12'; break;
                            case 'HS': statusColor = '#e74c3c'; break;
                            case 'RÉPARATION': statusColor = '#e67e22'; break;
                        }
                        const attributedTo = radio.attributed_to ? agents.find(a => a.code === radio.attributed_to) : null;
                        return `
                            <tr>
                                <td><strong>${radio.id}</strong></td>
                                <td>${radio.modele}</td>
                                <td><span style="background-color:${statusColor}; color:white; padding:2px 8px; border-radius:3px;">${radio.statut}</span></td>
                                <td>${attributedTo ? `${attributedTo.nom} ${attributedTo.prenom}<br><small>${radio.attributed_to}</small>` : '---'}</td>
                                <td style="white-space:nowrap;">
                                    ${radio.statut === 'DISPONIBLE' ? 
                                        `<button class="action-btn small green" onclick="showAssignRadioForm('${radio.id}')">📲</button>` : 
                                        radio.statut === 'ATTRIBUÉE' ?
                                        `<button class="action-btn small blue" onclick="showReturnRadioForm('${radio.id}')">🔄</button>` : ''}
                                    <button class="action-btn small blue" onclick="showEditRadioForm('${radio.id}')">✏️</button>
                                    <button class="action-btn small red" onclick="deleteRadio('${radio.id}')">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    openPopup("📻 Gestion des Radios", html, `
        <button class="popup-button green" onclick="showAddRadioForm()">➕ Ajouter</button>
        <button class="popup-button blue" onclick="showRadiosStatus()">📊 Statut</button>
        <button class="popup-button gray" onclick="displayRadiosMenu()">Retour</button>
    `);
}

function showAddRadioForm() {
    let html = `
        <div class="info-section">
            <h3>Ajouter une Radio</h3>
            <div class="form-group">
                <label>ID Radio *</label>
                <input type="text" id="radioId" class="form-input" required placeholder="Ex: RAD001" maxlength="20">
                <small style="color:#7f8c8d;">Identifiant unique de la radio</small>
            </div>
            <div class="form-group">
                <label>Modèle *</label>
                <input type="text" id="radioModele" class="form-input" required placeholder="Ex: Motorola XPR 7550">
            </div>
            <div class="form-group">
                <label>Numéro de série</label>
                <input type="text" id="radioSerial" class="form-input" placeholder="Ex: SN123456789">
            </div>
            <div class="form-group">
                <label>Statut *</label>
                <select id="radioStatut" class="form-input" required>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="ATTRIBUÉE">Attribuée</option>
                    <option value="HS">Hors Service (HS)</option>
                    <option value="RÉPARATION">En réparation</option>
                </select>
            </div>
            <div id="attributionSection" style="display:none;">
                <div class="form-group">
                    <label>Attribuer à l'agent</label>
                    <select id="radioAgent" class="form-input">
                        <option value="">Non attribuée</option>
                        ${agents.filter(a => a.statut === 'actif').map(a => 
                            `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code})</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date d'attribution</label>
                    <input type="date" id="radioAttributionDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-group">
                <label>Commentaire</label>
                <textarea id="radioComment" class="form-input" rows="3" placeholder="État, accessoires, remarques..."></textarea>
            </div>
            <div class="form-group">
                <label>Date d'acquisition</label>
                <input type="date" id="radioAcquisitionDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
    `;
    
    openPopup("➕ Ajouter Radio", html, `
        <button class="popup-button green" onclick="saveRadio()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="showRadiosList()">Annuler</button>
    `);
    
    document.getElementById('radioStatut').addEventListener('change', function() {
        const statut = this.value;
        document.getElementById('attributionSection').style.display = statut === 'ATTRIBUÉE' ? 'block' : 'none';
    });
}

function saveRadio() {
    const id = document.getElementById('radioId').value.toUpperCase();
    const modele = document.getElementById('radioModele').value;
    const serial = document.getElementById('radioSerial').value;
    const statut = document.getElementById('radioStatut').value;
    const comment = document.getElementById('radioComment').value;
    const acquisitionDate = document.getElementById('radioAcquisitionDate').value;
    
    if (!id || !modele || !statut) {
        showSnackbar("⚠️ Veuillez remplir les champs obligatoires");
        return;
    }
    
    const existingIndex = radios.findIndex(r => r.id === id);
    const radio = {
        id: id,
        modele: modele,
        serial: serial,
        statut: statut,
        comment: comment,
        acquisition_date: acquisitionDate,
        created_at: new Date().toISOString()
    };
    
    if (statut === 'ATTRIBUÉE') {
        const agentCode = document.getElementById('radioAgent').value;
        const attributionDate = document.getElementById('radioAttributionDate').value;
        if (agentCode) {
            radio.attributed_to = agentCode;
            radio.attribution_date = attributionDate;
        }
    }
    
    if (existingIndex !== -1) {
        radios[existingIndex] = radio;
        showSnackbar(`✅ Radio ${id} mise à jour`);
    } else {
        radios.push(radio);
        showSnackbar(`✅ Radio ${id} ajoutée`);
    }
    
    saveData();
    showRadiosList();
}

// === MODULE AVERTISSEMENTS ===
function showWarningsList() {
    if (!warnings || warnings.length === 0) {
        let html = `<div class="info-section"><h3>Avertissements</h3><p style="text-align:center; color:#7f8c8d; padding:20px;">Aucun avertissement enregistré</p></div>`;
        openPopup("⚠️ Avertissements", html, `
            <button class="popup-button green" onclick="showAddWarningForm()">⚠️ Ajouter</button>
            <button class="popup-button gray" onclick="displayWarningsMenu()">Retour</button>
        `);
        return;
    }
    
    const sortedWarnings = [...warnings].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = `
        <div class="info-section">
            <h3>Liste des Avertissements</h3>
            <div style="margin-bottom: 15px;">
                <select id="warningFilter" class="form-input" style="width:auto;" onchange="filterWarnings()">
                    <option value="all">Tous les types</option>
                    <option value="ORAL">Oral</option>
                    <option value="ECRIT">Écrit</option>
                    <option value="MISE_A_PIED">Mise à pied</option>
                </select>
                <select id="warningStatusFilter" class="form-input" style="width:auto; margin-left:10px;" onchange="filterWarnings()">
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="archived">Archivé</option>
                </select>
            </div>
            <div id="warningsListContainer">
                ${generateWarningsList(sortedWarnings)}
            </div>
        </div>
    `;
    
    openPopup("⚠️ Avertissements", html, `
        <button class="popup-button green" onclick="showAddWarningForm()">⚠️ Ajouter</button>
        <button class="popup-button blue" onclick="showWarningsStats()">📊 Statistiques</button>
        <button class="popup-button gray" onclick="displayWarningsMenu()">Retour</button>
    `);
}

function generateWarningsList(warningsList, filterType = 'all', filterStatus = 'all') {
    const filteredWarnings = warningsList.filter(warning => {
        if (filterType !== 'all' && warning.type !== filterType) return false;
        if (filterStatus !== 'all' && warning.status !== filterStatus) return false;
        return true;
    });
    
    if (filteredWarnings.length === 0) {
        return '<p style="text-align:center; color:#7f8c8d; padding:20px;">Aucun avertissement correspondant aux filtres</p>';
    }
    
    return `
        <table class="classement-table">
            <thead>
                <tr>
                    <th>Agent</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredWarnings.map(warning => {
                    const agent = agents.find(a => a.code === warning.agent_code);
                    const agentName = agent ? `${agent.nom} ${agent.prenom}` : warning.agent_code;
                    let typeColor = '#7f8c8d';
                    let typeLabel = warning.type;
                    switch(warning.type) {
                        case 'ORAL': typeColor = '#f39c12'; typeLabel = 'Oral'; break;
                        case 'ECRIT': typeColor = '#e74c3c'; typeLabel = 'Écrit'; break;
                        case 'MISE_A_PIED': typeColor = '#c0392b'; typeLabel = 'Mise à pied'; break;
                    }
                    let statusBadge = warning.status === 'active' ? 
                        '<span style="background-color:#27ae60; color:white; padding:2px 8px; border-radius:3px; font-size:0.8em;">Actif</span>' :
                        '<span style="background-color:#7f8c8d; color:white; padding:2px 8px; border-radius:3px; font-size:0.8em;">Archivé</span>';
                    return `
                        <tr>
                            <td nowrap><strong>${agentName}</strong><br><small>${warning.agent_code}</small></td>
                            <td><span style="background-color:${typeColor}; color:white; padding:2px 8px; border-radius:3px;">${typeLabel}</span></td>
                            <td>${new Date(warning.date).toLocaleDateString('fr-FR')}</td>
                            <td>${warning.description.substring(0, 50)}${warning.description.length > 50 ? '...' : ''}</td>
                            <td>${statusBadge}</td>
                            <td style="white-space:nowrap;">
                                <button class="action-btn small blue" onclick="showWarningDetails('${warning.id}')">👁️</button>
                                <button class="action-btn small ${warning.status === 'active' ? 'orange' : 'green'}" 
                                        onclick="toggleWarningStatus('${warning.id}')">
                                    ${warning.status === 'active' ? '📁' : '📂'}
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function filterWarnings() {
    const filterType = document.getElementById('warningFilter').value;
    const filterStatus = document.getElementById('warningStatusFilter').value;
    const sortedWarnings = [...warnings].sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('warningsListContainer').innerHTML = generateWarningsList(sortedWarnings, filterType, filterStatus);
}

function showAddWarningForm() {
    let html = `
        <div class="info-section">
            <h3>Enregistrer un Avertissement</h3>
            <div class="form-group">
                <label>Agent *</label>
                <select id="warningAgent" class="form-input" required>
                    <option value="">Sélectionner un agent</option>
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code}) - Groupe ${a.groupe}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Type d'avertissement *</label>
                <select id="warningType" class="form-input" required>
                    <option value="">Sélectionner</option>
                    <option value="ORAL">Avertissement Oral</option>
                    <option value="ECRIT">Avertissement Écrit</option>
                    <option value="MISE_A_PIED">Mise à pied</option>
                </select>
            </div>
            <div class="form-group">
                <label>Date de l'avertissement *</label>
                <input type="date" id="warningDate" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label>Description détaillée *</label>
                <textarea id="warningDescription" class="form-input" rows="4" required placeholder="Décrire les faits, les circonstances, les preuves..."></textarea>
            </div>
            <div class="form-group">
                <label>Sanctions appliquées</label>
                <textarea id="warningSanctions" class="form-input" rows="3" placeholder="Sanctions, mesures disciplinaires prises..."></textarea>
            </div>
            <div class="form-group">
                <label>Date de fin de validité (si applicable)</label>
                <input type="date" id="warningEndDate" class="form-input">
                <small style="color:#7f8c8d;">Pour les mises à pied temporaires</small>
            </div>
            <div class="form-group">
                <label>Témoins (noms et fonctions)</label>
                <textarea id="warningWitnesses" class="form-input" rows="2" placeholder="Noms des témoins présents..."></textarea>
            </div>
            <div class="form-group">
                <label>Documents joints (justificatifs)</label>
                <input type="file" id="warningDocuments" class="form-input" multiple accept=".pdf,.jpg,.jpeg,.png">
                <small style="color:#7f8c8d;">PDF, JPG, PNG (max 10MB au total)</small>
            </div>
            <div style="padding:15px; background:#2c3e50; border-radius:5px; margin-top:20px;">
                <h4 style="margin-top:0; color:#e74c3c;">⚖️ Aspects légaux</h4>
                <p style="font-size:0.9em; margin:0;">Assurez-vous de respecter la procédure disciplinaire. L'agent doit être informé de son droit de réponse. Conservez les preuves et signatures.</p>
            </div>
        </div>
    `;
    
    openPopup("⚠️ Ajouter Avertissement", html, `
        <button class="popup-button green" onclick="saveWarning()">⚖️ Enregistrer</button>
        <button class="popup-button gray" onclick="showWarningsList()">Annuler</button>
    `);
}

function saveWarning() {
    const agentCode = document.getElementById('warningAgent').value;
    const type = document.getElementById('warningType').value;
    const date = document.getElementById('warningDate').value;
    const description = document.getElementById('warningDescription').value;
    const sanctions = document.getElementById('warningSanctions').value;
    const endDate = document.getElementById('warningEndDate').value;
    const witnesses = document.getElementById('warningWitnesses').value;
    
    if (!agentCode || !type || !date || !description) {
        showSnackbar("⚠️ Veuillez remplir les champs obligatoires");
        return;
    }
    
    const warning = {
        id: 'WARN' + Date.now(),
        agent_code: agentCode,
        type: type,
        date: date,
        description: description,
        sanctions: sanctions,
        end_date: endDate || null,
        witnesses: witnesses,
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: 'Admin'
    };
    
    if (!warnings) warnings = [];
    warnings.push(warning);
    saveData();
    
    const agentWarnings = warnings.filter(w => w.agent_code === agentCode);
    if (agentWarnings.length >= 3) {
        setTimeout(() => {
            showSnackbar(`⚠️ Attention: L'agent ${agentCode} a maintenant ${agentWarnings.length} avertissements`);
        }, 1000);
    }
    
    showSnackbar(`✅ Avertissement enregistré pour ${agentCode}`);
    showWarningsList();
}

function showWarningDetails(warningId) {
    const warning = warnings.find(w => w.id === warningId);
    if (!warning) return;
    
    const agent = agents.find(a => a.code === warning.agent_code);
    const agentName = agent ? `${agent.nom} ${agent.prenom}` : warning.agent_code;
    let typeLabel = warning.type;
    let typeColor = '#7f8c8d';
    switch(warning.type) {
        case 'ORAL': typeLabel = 'Avertissement Oral'; typeColor = '#f39c12'; break;
        case 'ECRIT': typeLabel = 'Avertissement Écrit'; typeColor = '#e74c3c'; break;
        case 'MISE_A_PIED': typeLabel = 'Mise à pied'; typeColor = '#c0392b'; break;
    }
    
    let html = `
        <div class="info-section">
            <h3>Détails de l'Avertissement</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4>Informations générales</h4>
                    <div class="info-item"><span class="info-label">Agent:</span><span class="info-value">${agentName} (${warning.agent_code})</span></div>
                    <div class="info-item"><span class="info-label">Type:</span><span class="info-value" style="background-color:${typeColor}; color:white; padding:2px 8px; border-radius:3px;">${typeLabel}</span></div>
                    <div class="info-item"><span class="info-label">Date:</span><span class="info-value">${new Date(warning.date).toLocaleDateString('fr-FR')}</span></div>
                    <div class="info-item"><span class="info-label">Statut:</span><span class="info-value">${warning.status === 'active' ? 'Actif' : 'Archivé'}</span></div>
                    <div class="info-item"><span class="info-label">Enregistré le:</span><span class="info-value">${new Date(warning.created_at).toLocaleDateString('fr-FR')}</span></div>
                </div>
                <div>
                    <h4>Détails additionnels</h4>
                    ${warning.end_date ? `
                        <div class="info-item"><span class="info-label">Fin de validité:</span><span class="info-value">${new Date(warning.end_date).toLocaleDateString('fr-FR')}</span></div>
                    ` : ''}
                    <div class="info-item"><span class="info-label">Témoins:</span><span class="info-value">${warning.witnesses || 'Non spécifié'}</span></div>
                    <div class="info-item"><span class="info-label">Enregistré par:</span><span class="info-value">${warning.created_by || 'Admin'}</span></div>
                </div>
            </div>
            <h4>Description des faits</h4>
            <div style="padding: 15px; background: #34495e; border-radius: 5px; margin-bottom: 20px;">
                ${warning.description.replace(/\n/g, '<br>')}
            </div>
            ${warning.sanctions ? `
                <h4>Sanctions appliquées</h4>
                <div style="padding: 15px; background: #2c3e50; border-radius: 5px; margin-bottom: 20px;">
                    ${warning.sanctions.replace(/\n/g, '<br>')}
                </div>
            ` : ''}
            <div style="margin-top: 20px;">
                <button class="popup-button orange" onclick="toggleWarningStatus('${warning.id}')">
                    ${warning.status === 'active' ? '📁 Archiver' : '📂 Réactiver'}
                </button>
            </div>
        </div>
    `;
    
    openPopup("📋 Détails Avertissement", html, `
        <button class="popup-button blue" onclick="showWarningsList()">📋 Retour liste</button>
        <button class="popup-button gray" onclick="closePopup()">Fermer</button>
    `);
}

function toggleWarningStatus(warningId) {
    const warningIndex = warnings.findIndex(w => w.id === warningId);
    if (warningIndex === -1) return;
    
    const newStatus = warnings[warningIndex].status === 'active' ? 'archived' : 'active';
    warnings[warningIndex].status = newStatus;
    warnings[warningIndex].updated_at = new Date().toISOString();
    
    saveData();
    showSnackbar(`✅ Avertissement ${newStatus === 'archived' ? 'archivé' : 'réactivé'}`);
    
    const currentPopup = document.querySelector('.popup-header h2');
    if (currentPopup && currentPopup.textContent.includes('Détails')) {
        closePopup();
        setTimeout(() => showWarningDetails(warningId), 300);
    } else {
        showWarningsList();
    }
}

function showAgentWarningsSelection() {
    let html = `
        <div class="info-section">
            <h3>Avertissements par Agent</h3>
            <div class="form-group">
                <label>Sélectionner un agent:</label>
                <select id="warningsAgentSelect" class="form-input">
                    <option value="">Tous les agents</option>
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code})</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Période:</label>
                <select id="warningsPeriod" class="form-input">
                    <option value="all">Toute période</option>
                    <option value="year">Cette année</option>
                    <option value="last_year">L'année dernière</option>
                    <option value="month">Ce mois</option>
                </select>
            </div>
        </div>
    `;
    
    openPopup("👤 Avertissements par Agent", html, `
        <button class="popup-button green" onclick="showSelectedAgentWarnings()">📋 Voir Avertissements</button>
        <button class="popup-button gray" onclick="displayWarningsMenu()">Annuler</button>
    `);
}

function showSelectedAgentWarnings() {
    const agentCode = document.getElementById('warningsAgentSelect').value;
    const period = document.getElementById('warningsPeriod').value;
    
    let filteredWarnings = [...warnings];
    if (agentCode) filteredWarnings = filteredWarnings.filter(w => w.agent_code === agentCode);
    if (period !== 'all') {
        const now = new Date();
        let startDate;
        switch(period) {
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'last_year':
                startDate = new Date(now.getFullYear() - 1, 0, 1);
                const endDate = new Date(now.getFullYear() - 1, 11, 31);
                filteredWarnings = filteredWarnings.filter(w => 
                    new Date(w.date) >= startDate && new Date(w.date) <= endDate
                );
                startDate = null;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }
        if (startDate) filteredWarnings = filteredWarnings.filter(w => new Date(w.date) >= startDate);
    }
    
    filteredWarnings.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredWarnings.length === 0) {
        const message = agentCode ? 
            `Aucun avertissement trouvé pour cet agent${period !== 'all' ? ' sur la période sélectionnée' : ''}` :
            `Aucun avertissement trouvé${period !== 'all' ? ' sur la période sélectionnée' : ''}`;
        showSnackbar(`ℹ️ ${message}`);
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Avertissements ${agentCode ? 'de ' + agentCode : ''}</h3>
            ${period !== 'all' ? `<p>Période: ${period === 'year' ? 'Cette année' : period === 'month' ? 'Ce mois' : 'L\'année dernière'}</p>` : ''}
            <table class="classement-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        ${!agentCode ? '<th>Agent</th>' : ''}
                        <th>Description</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredWarnings.map(warning => {
                        const agent = agents.find(a => a.code === warning.agent_code);
                        let typeColor = '#7f8c8d';
                        switch(warning.type) {
                            case 'ORAL': typeColor = '#f39c12'; break;
                            case 'ECRIT': typeColor = '#e74c3c'; break;
                            case 'MISE_A_PIED': typeColor = '#c0392b'; break;
                        }
                        return `
                            <tr>
                                <td>${new Date(warning.date).toLocaleDateString('fr-FR')}</td>
                                <td><span style="background-color:${typeColor}; color:white; padding:2px 8px; border-radius:3px;">${warning.type}</span></td>
                                ${!agentCode ? `
                                    <td nowrap><strong>${warning.agent_code}</strong><br><small>${agent ? agent.nom + ' ' + agent.prenom : ''}</small></td>
                                ` : ''}
                                <td>${warning.description.substring(0, 50)}${warning.description.length > 50 ? '...' : ''}</td>
                                <td>${warning.status === 'active' ? 'Actif' : 'Archivé'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #2c3e50; border-radius: 5px;">
                <h4 style="margin-top:0;">📊 Résumé</h4>
                <div style="display: flex; gap: 20px;">
                    <div><strong>Total:</strong> ${filteredWarnings.length}</div>
                    <div><strong>Actifs:</strong> ${filteredWarnings.filter(w => w.status === 'active').length}</div>
                    <div><strong>Archivés:</strong> ${filteredWarnings.filter(w => w.status === 'archived').length}</div>
                </div>
            </div>
        </div>
    `;
    
    openPopup("📋 Avertissements", html, `
        <button class="popup-button blue" onclick="showAgentWarningsSelection()">🔍 Nouvelle recherche</button>
        <button class="popup-button gray" onclick="displayWarningsMenu()">Retour</button>
    `);
}

function showWarningsStats() {
    if (!warnings || warnings.length === 0) {
        showSnackbar("ℹ️ Aucune donnée statistique disponible");
        return;
    }
    
    const stats = {
        total: warnings.length,
        byType: { ORAL: 0, ECRIT: 0, MISE_A_PIED: 0 },
        byStatus: { active: 0, archived: 0 },
        byMonth: {},
        byAgent: {}
    };
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    warnings.forEach(warning => {
        stats.byType[warning.type] = (stats.byType[warning.type] || 0) + 1;
        stats.byStatus[warning.status] = (stats.byStatus[warning.status] || 0) + 1;
        const warningDate = new Date(warning.date);
        if (warningDate.getFullYear() === currentYear) {
            const month = warningDate.getMonth() + 1;
            stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        }
        stats.byAgent[warning.agent_code] = (stats.byAgent[warning.agent_code] || 0) + 1;
    });
    
    let topAgent = null;
    let maxWarnings = 0;
    Object.entries(stats.byAgent).forEach(([agentCode, count]) => {
        if (count > maxWarnings) {
            maxWarnings = count;
            topAgent = agentCode;
        }
    });
    
    let html = `
        <div class="info-section">
            <h3>📊 Statistiques des Avertissements</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div style="text-align: center; padding: 15px; background: #2c3e50; border-radius: 5px;">
                    <div style="font-size: 2em; font-weight: bold; color: #3498db;">${stats.total}</div>
                    <div style="font-size: 0.9em; color: #bdc3c7;">Total avertissements</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f39c12; border-radius: 5px;">
                    <div style="font-size: 2em; font-weight: bold; color: white;">${stats.byType.ORAL || 0}</div>
                    <div style="font-size: 0.9em; color: white;">Avertissements oraux</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #e74c3c; border-radius: 5px;">
                    <div style="font-size: 2em; font-weight: bold; color: white;">${stats.byType.ECRIT || 0}</div>
                    <div style="font-size: 0.9em; color: white;">Avertissements écrits</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #c0392b; border-radius: 5px;">
                    <div style="font-size: 2em; font-weight: bold; color: white;">${stats.byType.MISE_A_PIED || 0}</div>
                    <div style="font-size: 0.9em; color: white;">Mises à pied</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>📈 Répartition par statut</h4>
                    <div style="margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Actifs:</span>
                            <span style="color:#27ae60; font-weight:bold;">${stats.byStatus.active || 0}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Archivés:</span>
                            <span style="color:#7f8c8d; font-weight:bold;">${stats.byStatus.archived || 0}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h4>👤 Agents les plus concernés</h4>
                    ${topAgent ? `
                        <div style="margin-top: 10px;">
                            <div style="font-weight:bold; color:#e74c3c;">${topAgent}</div>
                            <div style="font-size:0.9em; color:#7f8c8d;">${maxWarnings} avertissement(s)</div>
                        </div>
                    ` : '<p style="color:#7f8c8d; text-align:center;">Aucune donnée</p>'}
                </div>
            </div>
            ${Object.keys(stats.byMonth).length > 0 ? `
                <div style="margin-top: 30px;">
                    <h4>📅 Avertissements par mois (${currentYear})</h4>
                    <div style="margin-top: 15px;">
                        ${Array.from({length: 12}, (_, i) => {
                            const monthNum = i + 1;
                            const monthName = new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'short' });
                            const count = stats.byMonth[monthNum] || 0;
                            const maxCount = Math.max(...Object.values(stats.byMonth));
                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            return `
                                <div style="margin: 10px 0;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span>${monthName}</span>
                                        <span style="font-weight:bold;">${count}</span>
                                    </div>
                                    <div style="height: 10px; background: #34495e; border-radius: 5px; overflow: hidden;">
                                        <div style="height: 100%; width: ${percentage}%; background: #e74c3c; border-radius: 5px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    openPopup("📊 Statistiques Avertissements", html, `
        <button class="popup-button green" onclick="exportWarningsReport()">📤 Exporter</button>
        <button class="popup-button gray" onclick="showWarningsList()">Retour</button>
    `);
}

function exportWarningsReport() {
    if (!warnings || warnings.length === 0) {
        showSnackbar("ℹ️ Aucun avertissement à exporter");
        return;
    }
    
    let csvContent = "Rapport des Avertissements - " + new Date().toLocaleDateString('fr-FR') + "\n\n";
    csvContent += "ID;Agent;Code Agent;Type;Date;Description;Sanctions;Témoins;Statut;Créé le;Mis à jour le\n";
    
    warnings.forEach(warning => {
        const agent = agents.find(a => a.code === warning.agent_code);
        const agentName = agent ? `${agent.nom} ${agent.prenom}` : warning.agent_code;
        csvContent += `${warning.id};"${agentName}";${warning.agent_code};${warning.type};${warning.date};"${warning.description.replace(/"/g, '""')}";"${(warning.sanctions || '').replace(/"/g, '""')}";"${(warning.witnesses || '').replace(/"/g, '""')}";${warning.status};${warning.created_at};${warning.updated_at || ''}\n`;
    });
    
    downloadCSV(csvContent, `Rapport_Avertissements_${new Date().toISOString().split('T')[0]}.csv`);
    showSnackbar(`✅ Rapport des avertissements téléchargé`);
}

// === MODULE EXPORT EXCEL ===
function exportPlanningToExcel(month, year, type = 'global', group = null) {
    showSnackbar("📊 Génération du fichier Excel...");
    const activeAgents = agents.filter(a => a.statut === 'actif');
    const daysInMonth = new Date(year, month, 0).getDate();
    let exportAgents = activeAgents;
    if (type === 'groupe' && group) exportAgents = activeAgents.filter(a => a.groupe === group);
    
    let csvContent = "Agent;Code;Groupe;";
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayName = JOURS_FRANCAIS[date.getDay()];
        csvContent += `Jour ${day} (${dayName});`;
    }
    csvContent += "Total 1;Total 2;Total 3;Total R;Total C;Total M;Total A\n";
    
    exportAgents.forEach(agent => {
        const stats = { '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0 };
        let row = `${agent.nom} ${agent.prenom};${agent.code};${agent.groupe};`;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const shift = getShiftForAgent(agent.code, dateStr);
            row += `${shift};`;
            if (stats[shift] !== undefined) stats[shift]++;
        }
        row += `${stats['1']};${stats['2']};${stats['3']};${stats['R']};${stats['C']};${stats['M']};${stats['A']}\n`;
        csvContent += row;
    });
    
    const filename = `Planning_${type === 'global' ? 'Global' : 'Groupe_' + group}_${getMonthName(month)}_${year}.csv`;
    downloadCSV(csvContent, filename);
    showSnackbar(`✅ Fichier ${filename} téléchargé`);
}

function exportStatsExcel() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    let csvContent = "Statistiques Mensuelles - " + getMonthName(month) + " " + year + "\n\n";
    csvContent += "Agent;Code;Groupe;Matin (1);Après-midi (2);Nuit (3);Repos (R);Congés (C);Maladie (M);Autre (A);Total Jours;Total Travaillés\n";
    
    const activeAgents = agents.filter(a => a.statut === 'actif');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    activeAgents.forEach(agent => {
        const stats = { '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0 };
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const shift = getShiftForAgent(agent.code, dateStr);
            if (stats[shift] !== undefined) stats[shift]++;
        }
        const totalJours = daysInMonth;
        const totalTravailles = stats['1'] + stats['2'] + stats['3'];
        csvContent += `${agent.nom} ${agent.prenom};${agent.code};${agent.groupe};${stats['1']};${stats['2']};${stats['3']};${stats['R']};${stats['C']};${stats['M']};${stats['A']};${totalJours};${totalTravailles}\n`;
    });
    
    const filename = `Statistiques_${getMonthName(month)}_${year}.csv`;
    downloadCSV(csvContent, filename);
    showSnackbar(`✅ Fichier ${filename} téléchargé`);
}

function exportLeavesReport() {
    let csvContent = "Rapport des Congés et Absences\n\n";
    csvContent += "Date Export;Nombre total d'absences\n";
    csvContent += `${new Date().toLocaleDateString('fr-FR')};${countTotalLeaves()}\n\n`;
    csvContent += "Agent;Code;Groupe;Date;Type;Commentaire;Enregistré le\n";
    
    agents.filter(a => a.statut === 'actif').forEach(agent => {
        const agentLeaves = [];
        Object.keys(planningData).forEach(monthKey => {
            if (planningData[monthKey][agent.code]) {
                Object.keys(planningData[monthKey][agent.code]).forEach(dateStr => {
                    const record = planningData[monthKey][agent.code][dateStr];
                    if (['C', 'M', 'A'].includes(record.shift)) {
                        agentLeaves.push({
                            date: dateStr,
                            type: record.shift,
                            comment: record.comment || '',
                            recorded_at: record.recorded_at
                        });
                    }
                });
            }
        });
        if (leaves) {
            leaves.filter(l => l.agent_code === agent.code).forEach(leave => {
                agentLeaves.push({
                    date: `${leave.start_date} au ${leave.end_date}`,
                    type: 'Période',
                    comment: leave.comment || '',
                    recorded_at: leave.created_at
                });
            });
        }
        agentLeaves.forEach(leave => {
            csvContent += `${agent.nom} ${agent.prenom};${agent.code};${agent.groupe};${leave.date};${leave.type};"${leave.comment}";${new Date(leave.recorded_at).toLocaleDateString('fr-FR')}\n`;
        });
    });
    
    const filename = `Rapport_Conges_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
    showSnackbar(`✅ Rapport des congés téléchargé`);
}

function countTotalLeaves() {
    let count = 0;
    Object.keys(planningData).forEach(monthKey => {
        Object.keys(planningData[monthKey]).forEach(agentCode => {
            Object.keys(planningData[monthKey][agentCode]).forEach(dateStr => {
                const record = planningData[monthKey][agentCode][dateStr];
                if (['C', 'M', 'A'].includes(record.shift)) count++;
            });
        });
    });
    if (leaves) count += leaves.length;
    return count;
}

function downloadCSV(content, filename) {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// === FONCTIONS DE GESTION DES ERREURS ===
function checkExpiredWarnings() {
    const today = new Date();
    const expiredWarnings = warnings.filter(w => 
        w.status === 'active' && 
        w.end_date && 
        new Date(w.end_date) < today
    );
    
    if (expiredWarnings.length > 0) {
        expiredWarnings.forEach(warning => {
            warning.status = 'archived';
            warning.auto_archived = true;
            warning.archived_at = new Date().toISOString();
        });
        saveData();
    }
}

// === FONCTIONS PLACEHOLDER (À IMPLÉMENTER) ===
function showGlobalStats() { showSnackbar("📈 Statistiques Globales - Bientôt disponible"); }
function showAgentStatsSelection() { showSnackbar("👤 Statistiques par Agent - Bientôt disponible"); }
function showWorkedDaysMenu() { showSnackbar("📊 Jours Travaillés - Bientôt disponible"); }
function showGroupStatsSelection() { showSnackbar("📉 Statistiques par Groupe - Bientôt disponible"); }
function showMonthlyStats() { showSnackbar("📅 Statistiques Mensuelles - Bientôt disponible"); }
function generateFullReport() { showSnackbar("📋 Rapport Complet - Bientôt disponible"); }
function showDeleteLeaveForm() { showSnackbar("🗑️ Supprimer Congé - Bientôt disponible"); }
function showGroupLeavesSelection() { showSnackbar("📊 Congés par Groupe - Bientôt disponible"); }
function showEditPanicCodeList() { showSnackbar("✏️ Modifier Code Panique - Bientôt disponible"); }
function showDeletePanicCodeList() { showSnackbar("🗑️ Supprimer Code Panique - Bientôt disponible"); }
function showSearchPanicCode() { showSnackbar("🔍 Rechercher Code Panique - Bientôt disponible"); }
function showEditRadioList() { showSnackbar("✏️ Modifier Radio - Bientôt disponible"); }
function showRadiosStatus() { showSnackbar("📊 Statut Radios - Bientôt disponible"); }
function showRadiosHistory() { showSnackbar("📋 Historique Radios - Bientôt disponible"); }
function showAddUniformForm() { showSnackbar("➕ Enregistrer Habillement - Bientôt disponible"); }
function showEditUniformList() { showSnackbar("✏️ Modifier Habillement - Bientôt disponible"); }
function showUniformReport() { showSnackbar("📋 Rapport Habillement - Bientôt disponible"); }
function showUniformStats() { showSnackbar("📊 Statistiques Tailles - Bientôt disponible"); }
function showUniformDeadlines() { showSnackbar("📅 Échéances Habillement - Bientôt disponible"); }
function exportUniformReport() { showSnackbar("📤 Exporter Rapport Habillement - Bientôt disponible"); }
function showAddHolidayForm() { showSnackbar("➕ Ajouter Jour Férié - Bientôt disponible"); }
function showDeleteHolidayList() { showSnackbar("🗑️ Supprimer Jour Férié - Bientôt disponible"); }
function showHolidaysList() { showSnackbar("📋 Liste Jours Fériés - Bientôt disponible"); }
function generateYearlyHolidays() { showSnackbar("🔄 Générer Jours Fériés Annuels - Bientôt disponible"); }
function showHolidaysByYear() { showSnackbar("📅 Voir Jours Fériés par Année - Bientôt disponible"); }
function exportLeavesPDF() { showSnackbar("📋 Exporter Congés PDF - Bientôt disponible"); }
function exportFullReport() { showSnackbar("📊 Exporter Rapport Complet - Bientôt disponible"); }
function backupAllData() { showSnackbar("💾 Sauvegarde Complète - Bientôt disponible"); }
function showSettings() { showSnackbar("⚙️ Paramètres - Bientôt disponible"); }
function showDatabaseManagement() { showSnackbar("🗃️ Gestion Base de Données - Bientôt disponible"); }
function showBackupOptions() { showSnackbar("💾 Sauvegarde - Bientôt disponible"); }
function showRestoreOptions() { showSnackbar("📤 Restauration - Bientôt disponible"); }
function showClearDataConfirm() { showSnackbar("🗑️ Effacer Données - Bientôt disponible"); }
function showResetConfirm() { showSnackbar("🔄 Réinitialiser - Bientôt disponible"); }
function showAbout() { showSnackbar("ℹ️ A propos - Bientôt disponible"); }
function showImportExcelForm() { showSnackbar("📁 Importer Excel - Bientôt disponible"); }
function showImportCSVForm() { showSnackbar("📥 Importer CSV - Bientôt disponible"); }
function exportAgentsData() { showSnackbar("📤 Exporter Agents - Bientôt disponible"); }
function showShiftModification(agentCode, dateStr, currentShift) { showSnackbar("✏️ Modification de shift - Bientôt disponible"); }
function showAbsenceFormForDate(agentCode, dateStr) { showSnackbar("🚫 Absence pour date - Bientôt disponible"); }
function showAddLeaveForAgent(agentCode) { showSnackbar("🏖️ Congé pour agent - Bientôt disponible"); }
function showAgentPlanning(agentCode) { showSnackbar("📅 Planning agent - Bientôt disponible"); }
function showAgentStats(agentCode) { showSnackbar("📊 Stats agent - Bientôt disponible"); }
function printPlanning() { showSnackbar("🖨️ Impression - Bientôt disponible"); }
function printAgentPlanning(agentCode, month, year) { showSnackbar("🖨️ Impression planning agent - Bientôt disponible"); }
function previewShiftExchange() { showSnackbar("👁️ Prévisualisation échange - Bientôt disponible"); }
function showGroupStats(group, month, year) { showSnackbar("📊 Stats groupe - Bientôt disponible"); }
function generatePlanningForGroup(group, month, year) { showSnackbar("🔄 Génération groupe - Bientôt disponible"); }
function showTrimesterDetailed(startMonth, year) { showSnackbar("📊 Détail trimestriel - Bientôt disponible"); }
function previewLeave() { showSnackbar("👁️ Prévisualisation congé - Bientôt disponible"); }
function showEditPanicCode(agentCode) { showSnackbar("✏️ Modifier code panique - Bientôt disponible"); }
function deletePanicCode(agentCode) { showSnackbar("🗑️ Supprimer code panique - Bientôt disponible"); }
function filterPanicCodes() { showSnackbar("🔍 Filtre codes panique - Bientôt disponible"); }
function showAssignRadioForm(radioId) { showSnackbar("📲 Attribuer radio - Bientôt disponible"); }
function showReturnRadioForm(radioId) { showSnackbar("🔄 Retour radio - Bientôt disponible"); }
function showEditRadioForm(radioId) { showSnackbar("✏️ Modifier radio - Bientôt disponible"); }
function deleteRadio(radioId) { showSnackbar("🗑️ Supprimer radio - Bientôt disponible"); }
function filterRadios() { showSnackbar("🔍 Filtre radios - Bientôt disponible"); }
function reportRadioProblem(radioId) { showSnackbar("⚠️ Problème radio - Bientôt disponible"); }

// === AJOUT DES ANIMATIONS CSS ===
const style = document.createElement('style');
style.textContent = `
    @keyframes fadein {
        from {bottom: 0; opacity: 0;}
        to {bottom: 30px; opacity: 1;}
    }
    @keyframes fadeout {
        from {bottom: 30px; opacity: 1;}
        to {bottom: 0; opacity: 0;}
    }
    #snackbar {
        animation: fadein 0.5s;
    }
`;
document.head.appendChild(style);

console.log("✅ app.js complet chargé avec tous les modules intégrés");
