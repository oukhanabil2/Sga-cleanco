// app.js - VERSION COMPLÈTE CORRIGÉE - SYSTÈME DE GESTION DES AGENTS (SGA)
// Intègre la logique métier, habillement, radios, avertissements et sécurité

// --- MOT DE PASSE D'ACCÈS ---
const MOT_DE_PASSE = "Nabil1974";
let isAuthenticated = false;

// --- CONSTANTES DE BASE ---
const JOURS_FRANCAIS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DATE_AFFECTATION_BASE = new Date('2025-11-01');

// Shifts et leurs significations
const SHIFT_TYPES = {
    '1': { label: 'Matin', color: '#3498db', workType: 'shift', hours: 8 },
    '2': { label: 'Après-midi', color: '#e74c3c', workType: 'shift', hours: 8 },
    '3': { label: 'Nuit', color: '#9b59b6', workType: 'shift', hours: 8 },
    'R': { label: 'Repos', color: '#2ecc71', workType: 'rest', hours: 0 },
    'C': { label: 'Congé', color: '#f39c12', workType: 'leave', hours: 0 },
    'M': { label: 'Maladie', color: '#e67e22', workType: 'sick', hours: 0 },
    'A': { label: 'Autre absence', color: '#95a5a6', workType: 'other', hours: 0 },
    '-': { label: 'Non défini', color: '#7f8c8d', workType: 'unknown', hours: 0 }
};

// Types d'avertissements
const WARNING_TYPES = {
    'ORAL': { label: 'Avertissement Oral', color: '#f39c12', severity: 1 },
    'ECRIT': { label: 'Avertissement Écrit', color: '#e74c3c', severity: 2 },
    'MISE_A_PIED': { label: 'Mise à pied', color: '#c0392b', severity: 3 }
};

// Statuts des radios
const RADIO_STATUS = {
    'DISPONIBLE': { label: 'Disponible', color: '#27ae60' },
    'ATTRIBUÉE': { label: 'Attribuée', color: '#f39c12' },
    'HS': { label: 'Hors Service', color: '#e74c3c' },
    'RÉPARATION': { label: 'En réparation', color: '#e67e22' }
};

// Tailles d'habillement
const UNIFORM_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// --- VARIABLES GLOBALES ---
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

// --- LOGIQUE MÉTIER DES ROTATIONS ---
class RotationLogic {
    static cycleStandard8Jours = ['1', '1', '2', '2', '3', '3', 'R', 'R'];
    
    static getDecalageStandard(groupe) {
        switch(groupe.toUpperCase()) {
            case 'A': return 0;
            case 'B': return 2;
            case 'C': return 4;
            case 'D': return 6;
            default: return 0;
        }
    }
    
    static getJourCycle(groupe, dateStr, dateEntreeStr) {
        const dateEntree = new Date(dateEntreeStr || DATE_AFFECTATION_BASE);
        const dateCourante = new Date(dateStr);
        
        const diffTemps = dateCourante.getTime() - dateEntree.getTime();
        const diffJours = Math.floor(diffTemps / (1000 * 3600 * 24));
        
        if (diffJours < 0) return -1;
        
        const decalage = this.getDecalageStandard(groupe);
        return (diffJours + decalage) % 8;
    }
    
    static getShiftStandard(groupe, dateStr, dateEntreeStr) {
        const jourCycle = this.getJourCycle(groupe, dateStr, dateEntreeStr);
        if (jourCycle === -1) return '-';
        return this.cycleStandard8Jours[jourCycle];
    }
    
    static getShiftGroupeE(agentCode, dateStr, agentsGroupeE) {
        const date = new Date(dateStr);
        const jourSemaine = date.getDay();
        
        if (jourSemaine === 0 || jourSemaine === 6) return 'R';
        
        const indexAgent = agentsGroupeE.indexOf(agentCode);
        if (indexAgent === -1) return 'R';
        
        const numSemaine = this.getWeekNumber(date);
        const jourPair = (jourSemaine % 2 === 1);
        
        if (indexAgent === 0) {
            if (numSemaine % 2 !== 0) {
                return jourPair ? '2' : '1';
            } else {
                return jourPair ? '1' : '2';
            }
        }
        
        if (indexAgent === 1) {
            if (numSemaine % 2 !== 0) {
                return jourPair ? '1' : '2';
            } else {
                return jourPair ? '2' : '1';
            }
        }
        
        return (indexAgent + numSemaine) % 2 === 0 ? '1' : '2';
    }
    
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    }
    
    static calculateTheoreticalShift(agentCode, dateStr, agentData, agentsGroupeE) {
        const groupe = agentData.groupe;
        const dateEntree = agentData.date_entree || DATE_AFFECTATION_BASE.toISOString().split('T')[0];
        const dateCourante = new Date(dateStr);
        const dateEntreeObj = new Date(dateEntree);
        
        if (agentData.statut !== 'actif' || dateCourante < dateEntreeObj) {
            return '-';
        }
        
        if (groupe === 'E') {
            return this.getShiftGroupeE(agentCode, dateStr, agentsGroupeE);
        } else if (['A', 'B', 'C', 'D'].includes(groupe)) {
            return this.getShiftStandard(groupe, dateStr, dateEntree);
        }
        
        return 'R';
    }
}

// --- FONCTIONS D'AUTHENTIFICATION ---
function checkAuthentication() {
    if (!isAuthenticated) {
        showLoginForm();
        return false;
    }
    return true;
}

function showLoginForm() {
    const html = `
        <div class="info-section">
            <h3>🔐 Authentification Requise</h3>
            <p>Veuillez entrer le mot de passe pour accéder au système :</p>
            <div class="form-group">
                <label>Mot de passe :</label>
                <input type="password" id="passwordInput" class="form-input" placeholder="Entrez le mot de passe">
            </div>
            <div id="loginError" style="color: #e74c3c; display: none; margin-top: 10px;">
                ❌ Mot de passe incorrect
            </div>
        </div>
    `;
    
    openPopup("🔐 Authentification", html, `
        <button class="popup-button green" onclick="verifyPassword()">🔓 Se connecter</button>
        <button class="popup-button gray" onclick="window.close()">🚪 Quitter</button>
    `);
}

function verifyPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === MOT_DE_PASSE) {
        isAuthenticated = true;
        showSnackbar("✅ Authentification réussie !");
        closePopup();
        displayMainMenu();
        loadData();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    // Charger d'abord les données puis afficher le login
    loadData();
    showLoginForm();
});

// --- GESTION DES DONNÉES ---
function loadData() {
    console.log("📥 Chargement des données...");
    
    // Charger depuis data.js si disponible
    if (typeof window.agentsData !== 'undefined') {
        agents = window.agentsData;
        console.log(`✅ ${agents.length} agents chargés depuis data.js`);
    }
    
    if (typeof window.radiosData !== 'undefined') {
        radios = window.radiosData;
        console.log(`✅ ${radios.length} radios chargées depuis data.js`);
    }
    
    if (typeof window.uniformsData !== 'undefined') {
        uniforms = window.uniformsData;
        console.log(`✅ ${uniforms.length} uniformes chargés depuis data.js`);
    }
    
    if (typeof window.warningsData !== 'undefined') {
        warnings = window.warningsData;
        console.log(`✅ ${warnings.length} avertissements chargés depuis data.js`);
    }
    
    if (typeof window.panicCodesData !== 'undefined') {
        panicCodes = window.panicCodesData;
        console.log(`✅ ${panicCodes.length} codes panique chargés depuis data.js`);
    }
    
    if (typeof window.holidaysData !== 'undefined') {
        holidays = window.holidaysData;
        console.log(`✅ ${holidays.length} jours fériés chargés depuis data.js`);
    }
    
    if (typeof window.leavesData !== 'undefined') {
        leaves = window.leavesData;
        console.log(`✅ ${leaves.length} congés chargés depuis data.js`);
    }
    
    // Charger depuis localStorage (écrase data.js si existant)
    const loadItem = (key, defaultValue) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    };
    
    const savedAgents = localStorage.getItem('sga_agents');
    if (savedAgents) {
        try {
            agents = JSON.parse(savedAgents);
        } catch (e) {
            console.error("Erreur chargement agents:", e);
        }
    }
    
    planningData = loadItem('sga_planning', {});
    
    // Ne charger que si pas déjà chargé depuis data.js
    if (holidays.length === 0) holidays = loadItem('sga_holidays', []);
    if (panicCodes.length === 0) panicCodes = loadItem('sga_panic_codes', []);
    if (radios.length === 0) radios = loadItem('sga_radios', []);
    if (uniforms.length === 0) uniforms = loadItem('sga_uniforms', []);
    if (warnings.length === 0) warnings = loadItem('sga_warnings', []);
    if (leaves.length === 0) leaves = loadItem('sga_leaves', []);
    
    radioHistory = loadItem('sga_radio_history', []);
    auditLog = loadItem('sga_audit_log', []);
    
    // Initialiser les jours fériés si vide
    if (holidays.length === 0) initializeHolidays();
    
    console.log("✅ Données chargées avec succès");
    console.log(`- Agents: ${agents.length}`);
    console.log(`- Uniformes: ${uniforms.length}`);
    console.log(`- Radios: ${radios.length}`);
    console.log(`- Avertissements: ${warnings.length}`);
}

function saveData() {
    if (!checkAuthentication()) return;
    
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
    
    showSnackbar("✅ Données sauvegardées");
}

// --- INITIALISATION DES DONNÉES ---
function initializeTestData() {
    if (!checkAuthentication()) return;
    
    if (!confirm("Initialiser les données de test ? Cela remplacera toutes les données actuelles.")) {
        return;
    }
    
    agents = [
        { code: 'A01', nom: 'Dupont', prenom: 'Alice', groupe: 'A', matricule: 'MAT001', cin: 'AA123456', tel: '0601-010101', poste: 'Agent de sécurité', date_entree: '2025-11-01', date_sortie: null, statut: 'actif' },
        { code: 'B02', nom: 'Martin', prenom: 'Bob', groupe: 'B', matricule: 'MAT002', cin: 'BB654321', tel: '0602-020202', poste: 'Superviseur', date_entree: '2025-11-01', date_sortie: null, statut: 'actif' },
        { code: 'C03', nom: 'Lefevre', prenom: 'Carole', groupe: 'C', matricule: 'MAT003', cin: 'CC789012', tel: '0603-030303', poste: 'Agent de sécurité', date_entree: '2025-11-01', date_sortie: null, statut: 'actif' },
        { code: 'D04', nom: 'Dubois', prenom: 'David', groupe: 'D', matricule: 'MAT004', cin: 'DD345678', tel: '0604-040404', poste: 'Chef d\'équipe', date_entree: '2025-11-01', date_sortie: null, statut: 'actif' },
        { code: 'E01', nom: 'Zahiri', prenom: 'Ahmed', groupe: 'E', matricule: 'MAT005', cin: 'EE901234', tel: '0605-050505', poste: 'Agent spécial', date_entree: '2025-11-01', date_sortie: null, statut: 'actif' },
        { code: 'E02', nom: 'Zarrouk', prenom: 'Benoit', groupe: 'E', matricule: 'MAT006', cin: 'FF567890', tel: '0606-060606', poste: 'Agent spécial', date_entree: '2025-11-01', date_sortie: null, statut: 'actif' }
    ];
    
    // Initialiser l'habillement
    uniforms = [
        { code_agent: 'A01', chemise_taille: 'M', chemise_date: '2025-11-01', jacket_taille: 'L', jacket_date: '2025-11-01', pantalon_taille: 'M', pantalon_date: '2025-11-01', cravate: 'OUI', cravate_date: '2025-11-01' },
        { code_agent: 'B02', chemise_taille: 'L', chemise_date: '2025-11-01', jacket_taille: 'XL', jacket_date: '2025-11-01', pantalon_taille: 'L', pantalon_date: '2025-11-01', cravate: 'OUI', cravate_date: '2025-11-01' }
    ];
    
    // Initialiser les radios
    radios = [
        { id: 'RAD001', modele: 'Motorola XPR7550', serial: 'SN001', statut: 'DISPONIBLE', attributed_to: null, attribution_date: null, comment: 'Neuve' },
        { id: 'RAD002', modele: 'Motorola XPR7550', serial: 'SN002', statut: 'ATTRIBUÉE', attributed_to: 'A01', attribution_date: '2025-11-01', comment: 'Attribuée à A01' }
    ];
    
    // Initialiser les avertissements
    warnings = [
        { id: 'WARN001', agent_code: 'B02', type: 'ORAL', date: '2025-11-15', description: 'Retard de 30 minutes', sanctions: 'Avertissement oral', status: 'active', created_at: '2025-11-15', created_by: 'Admin' }
    ];
    
    // Initialiser les codes panique
    panicCodes = [
        { agent_code: 'A01', panic_code: '911A01', poste: 'Poste Central' },
        { agent_code: 'B02', panic_code: '911B02', poste: 'Supervision' }
    ];
    
    initializeHolidays();
    saveData();
    showSnackbar("✅ Données de test initialisées");
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
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
}

function getShiftForAgent(agentCode, dateStr) {
    const monthKey = dateStr.substring(0, 7);
    if (planningData[monthKey] && planningData[monthKey][agentCode] && planningData[monthKey][agentCode][dateStr]) {
        return planningData[monthKey][agentCode][dateStr].shift;
    }
    
    const agent = agents.find(a => a.code === agentCode);
    if (!agent || agent.statut !== 'actif') return '-';
    
    let agentsGroupeE = [];
    if (agent.groupe === 'E') {
        agentsGroupeE = agents
            .filter(a => a.groupe === 'E' && a.statut === 'actif')
            .map(a => a.code)
            .sort();
    }
    
    return RotationLogic.calculateTheoreticalShift(agentCode, dateStr, agent, agentsGroupeE);
}

function calculateAgentStats(agentCode, month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const stats = { '1': 0, '2': 0, '3': 0, 'R': 0, 'C': 0, 'M': 0, 'A': 0, '-': 0 };
    let feriesTravailles = 0;
    let totalShifts = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const shift = getShiftForAgent(agentCode, dateStr);
        
        if (stats[shift] !== undefined) {
            stats[shift]++;
            
            if (['1', '2', '3'].includes(shift)) {
                totalShifts++;
                if (isHolidayDate(dateStr)) {
                    feriesTravailles++;
                }
            }
        }
    }
    
    const agent = agents.find(a => a.code === agentCode);
    let totalOperationnels = totalShifts;
    
    if (agent && agent.groupe !== 'E') {
        totalOperationnels += feriesTravailles;
    }
    
    return {
        stats: stats,
        feriesTravailles: feriesTravailles,
        totalShifts: totalShifts,
        totalOperationnels: totalOperationnels
    };
}

// --- GESTION DES INTERFACES ---
function openPopup(title, body, footer) {
    if (!checkAuthentication()) return;
    
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
    if (!checkAuthentication()) return;
    
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
function displaySubMenu(title, options) {
    if (!checkAuthentication()) return;
    
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

// --- MODULE HABILLEMENT (COMPLET) ---
function displayUniformMenu() {
    displaySubMenu("HABILLEMENT", [
        { text: "➕ Ajouter Habillement", handler: () => showAddUniformForm() },
        { text: "✏️ Modifier Habillement", handler: () => showEditUniformList() },
        { text: "🗑️ Supprimer Habillement", handler: () => showDeleteUniformForm() },
        { text: "📋 Rapport Habillement", handler: () => showUniformReport() },
        { text: "📊 Statistiques Tailles", handler: () => showUniformStats() },
        { text: "📅 Échéances", handler: () => showUniformDeadlines() },
        { text: "📤 Exporter Rapport", handler: () => exportUniformReport() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

function showAddUniformForm() {
    let html = `
        <div class="info-section">
            <h3>Ajouter un habillement</h3>
            <div class="form-group">
                <label>Agent *</label>
                <select id="uniformAgent" class="form-input" required>
                    <option value="">Sélectionner un agent</option>
                    ${agents.filter(a => a.statut === 'actif').map(a => 
                        `<option value="${a.code}">${a.nom} ${a.prenom} (${a.code})</option>`
                    ).join('')}
                </select>
            </div>
            
            <h4>Chemise</h4>
            <div class="form-group">
                <label>Taille *</label>
                <select id="chemiseTaille" class="form-input" required>
                    <option value="">Sélectionner</option>
                    ${UNIFORM_SIZES.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture *</label>
                <input type="date" id="chemiseDate" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <h4>Veste/Jacket</h4>
            <div class="form-group">
                <label>Taille *</label>
                <select id="jacketTaille" class="form-input" required>
                    <option value="">Sélectionner</option>
                    ${UNIFORM_SIZES.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture *</label>
                <input type="date" id="jacketDate" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <h4>Pantalon</h4>
            <div class="form-group">
                <label>Taille *</label>
                <select id="pantalonTaille" class="form-input" required>
                    <option value="">Sélectionner</option>
                    ${UNIFORM_SIZES.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture *</label>
                <input type="date" id="pantalonDate" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <h4>Cravate</h4>
            <div class="form-group">
                <label>Fournie ?</label>
                <select id="cravateOui" class="form-input">
                    <option value="OUI">Oui</option>
                    <option value="NON">Non</option>
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture</label>
                <input type="date" id="cravateDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div class="form-group">
                <label>Remarques</label>
                <textarea id="uniformRemarques" class="form-input" rows="3" placeholder="États, usure, remarques..."></textarea>
            </div>
        </div>
    `;
    
    openPopup("👔 Ajouter Habillement", html, `
        <button class="popup-button green" onclick="saveUniform()">💾 Enregistrer</button>
        <button class="popup-button gray" onclick="displayUniformMenu()">Annuler</button>
    `);
}

function saveUniform() {
    const agentCode = document.getElementById('uniformAgent').value;
    const chemiseTaille = document.getElementById('chemiseTaille').value;
    const chemiseDate = document.getElementById('chemiseDate').value;
    const jacketTaille = document.getElementById('jacketTaille').value;
    const jacketDate = document.getElementById('jacketDate').value;
    const pantalonTaille = document.getElementById('pantalonTaille').value;
    const pantalonDate = document.getElementById('pantalonDate').value;
    const cravateOui = document.getElementById('cravateOui').value;
    const cravateDate = document.getElementById('cravateDate').value;
    const remarques = document.getElementById('uniformRemarques').value;
    
    if (!agentCode || !chemiseTaille || !chemiseDate || !jacketTaille || !jacketDate || !pantalonTaille || !pantalonDate) {
        showSnackbar("⚠️ Veuillez remplir tous les champs obligatoires");
        return;
    }
    
    const existingIndex = uniforms.findIndex(u => u.code_agent === agentCode);
    const uniformData = {
        code_agent: agentCode,
        chemise_taille: chemiseTaille,
        chemise_date: chemiseDate,
        jacket_taille: jacketTaille,
        jacket_date: jacketDate,
        pantalon_taille: pantalonTaille,
        pantalon_date: pantalonDate,
        cravate: cravateOui,
        cravate_date: cravateDate,
        remarques: remarques,
        updated_at: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
        uniforms[existingIndex] = uniformData;
        showSnackbar(`✅ Habillement mis à jour pour ${agentCode}`);
    } else {
        uniforms.push(uniformData);
        showSnackbar(`✅ Habillement ajouté pour ${agentCode}`);
    }
    
    saveData();
    displayUniformMenu();
}

function showEditUniformList() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement enregistré");
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Modifier un habillement</h3>
            <input type="text" id="searchUniform" placeholder="Rechercher agent..." 
                   style="width:100%; padding:10px; margin-bottom:15px; border-radius:5px; border:none;"
                   onkeyup="filterUniforms()">
            <div id="uniformListContainer">
                ${generateUniformsList()}
            </div>
        </div>
    `;
    
    openPopup("✏️ Modifier Habillement", html, `
        <button class="popup-button gray" onclick="displayUniformMenu()">Retour</button>
    `);
}

function generateUniformsList() {
    return `
        <table class="classement-table">
            <thead>
                <tr>
                    <th>Agent</th>
                    <th>Chemise</th>
                    <th>Jacket</th>
                    <th>Pantalon</th>
                    <th>Cravate</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${uniforms.map(uniform => {
                    const agent = agents.find(a => a.code === uniform.code_agent);
                    const agentName = agent ? `${agent.nom} ${agent.prenom}` : uniform.code_agent;
                    return `
                        <tr>
                            <td>${agentName}<br><small>${uniform.code_agent}</small></td>
                            <td>${uniform.chemise_taille}<br><small>${uniform.chemise_date}</small></td>
                            <td>${uniform.jacket_taille}<br><small>${uniform.jacket_date}</small></td>
                            <td>${uniform.pantalon_taille}<br><small>${uniform.pantalon_date}</small></td>
                            <td>${uniform.cravate || 'NON'}</td>
                            <td>
                                <button class="action-btn small blue" onclick="editUniform('${uniform.code_agent}')">✏️</button>
                                <button class="action-btn small red" onclick="deleteUniform('${uniform.code_agent}')">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function filterUniforms() {
    const searchTerm = document.getElementById('searchUniform').value.toLowerCase();
    const rows = document.querySelectorAll('#uniformListContainer table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function editUniform(agentCode) {
    const uniform = uniforms.find(u => u.code_agent === agentCode);
    if (!uniform) return;
    
    const agent = agents.find(a => a.code === agentCode);
    
    let html = `
        <div class="info-section">
            <h3>Modifier habillement - ${agent ? agent.nom + ' ' + agent.prenom : agentCode}</h3>
            
            <h4>Chemise</h4>
            <div class="form-group">
                <label>Taille</label>
                <select id="editChemiseTaille" class="form-input">
                    ${UNIFORM_SIZES.map(size => 
                        `<option value="${size}" ${uniform.chemise_taille === size ? 'selected' : ''}>${size}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture</label>
                <input type="date" id="editChemiseDate" class="form-input" value="${uniform.chemise_date}">
            </div>
            
            <h4>Veste/Jacket</h4>
            <div class="form-group">
                <label>Taille</label>
                <select id="editJacketTaille" class="form-input">
                    ${UNIFORM_SIZES.map(size => 
                        `<option value="${size}" ${uniform.jacket_taille === size ? 'selected' : ''}>${size}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture</label>
                <input type="date" id="editJacketDate" class="form-input" value="${uniform.jacket_date}">
            </div>
            
            <h4>Pantalon</h4>
            <div class="form-group">
                <label>Taille</label>
                <select id="editPantalonTaille" class="form-input">
                    ${UNIFORM_SIZES.map(size => 
                        `<option value="${size}" ${uniform.pantalon_taille === size ? 'selected' : ''}>${size}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture</label>
                <input type="date" id="editPantalonDate" class="form-input" value="${uniform.pantalon_date}">
            </div>
            
            <h4>Cravate</h4>
            <div class="form-group">
                <label>Fournie ?</label>
                <select id="editCravateOui" class="form-input">
                    <option value="OUI" ${uniform.cravate === 'OUI' ? 'selected' : ''}>Oui</option>
                    <option value="NON" ${uniform.cravate === 'NON' ? 'selected' : ''}>Non</option>
                </select>
            </div>
            <div class="form-group">
                <label>Date de fourniture</label>
                <input type="date" id="editCravateDate" class="form-input" value="${uniform.cravate_date || ''}">
            </div>
            
            <div class="form-group">
                <label>Remarques</label>
                <textarea id="editUniformRemarques" class="form-input" rows="3">${uniform.remarques || ''}</textarea>
            </div>
        </div>
    `;
    
    openPopup("✏️ Modifier Habillement", html, `
        <button class="popup-button green" onclick="updateUniform('${agentCode}')">💾 Mettre à jour</button>
        <button class="popup-button gray" onclick="showEditUniformList()">Annuler</button>
    `);
}

function updateUniform(agentCode) {
    const uniformIndex = uniforms.findIndex(u => u.code_agent === agentCode);
    if (uniformIndex === -1) return;
    
    uniforms[uniformIndex] = {
        ...uniforms[uniformIndex],
        chemise_taille: document.getElementById('editChemiseTaille').value,
        chemise_date: document.getElementById('editChemiseDate').value,
        jacket_taille: document.getElementById('editJacketTaille').value,
        jacket_date: document.getElementById('editJacketDate').value,
        pantalon_taille: document.getElementById('editPantalonTaille').value,
        pantalon_date: document.getElementById('editPantalonDate').value,
        cravate: document.getElementById('editCravateOui').value,
        cravate_date: document.getElementById('editCravateDate').value,
        remarques: document.getElementById('editUniformRemarques').value,
        updated_at: new Date().toISOString()
    };
    
    saveData();
    showSnackbar(`✅ Habillement mis à jour pour ${agentCode}`);
    showEditUniformList();
}

function showDeleteUniformForm() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement enregistré");
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>Supprimer un habillement</h3>
            <div class="form-group">
                <label>Sélectionner un agent</label>
                <select id="deleteUniformAgent" class="form-input">
                    <option value="">Sélectionner un agent</option>
                    ${uniforms.map(uniform => {
                        const agent = agents.find(a => a.code === uniform.code_agent);
                        return `<option value="${uniform.code_agent}">${agent ? agent.nom + ' ' + agent.prenom : uniform.code_agent}</option>`;
                    }).join('')}
                </select>
            </div>
            <div id="uniformInfo" style="margin-top: 20px; padding: 15px; background: #2c3e50; border-radius: 5px; display: none;">
                <h4>Détails de l'habillement</h4>
                <div id="uniformDetails"></div>
            </div>
        </div>
    `;
    
    openPopup("🗑️ Supprimer Habillement", html, `
        <button class="popup-button red" onclick="confirmDeleteUniform()" id="deleteBtn" disabled>🗑️ Supprimer</button>
        <button class="popup-button gray" onclick="displayUniformMenu()">Annuler</button>
    `);
    
    document.getElementById('deleteUniformAgent').addEventListener('change', function() {
        const agentCode = this.value;
        if (agentCode) {
            const uniform = uniforms.find(u => u.code_agent === agentCode);
            if (uniform) {
                document.getElementById('uniformInfo').style.display = 'block';
                document.getElementById('uniformDetails').innerHTML = `
                    <p><strong>Chemise:</strong> Taille ${uniform.chemise_taille} (${uniform.chemise_date})</p>
                    <p><strong>Jacket:</strong> Taille ${uniform.jacket_taille} (${uniform.jacket_date})</p>
                    <p><strong>Pantalon:</strong> Taille ${uniform.pantalon_taille} (${uniform.pantalon_date})</p>
                    <p><strong>Cravate:</strong> ${uniform.cravate || 'NON'}</p>
                    ${uniform.remarques ? `<p><strong>Remarques:</strong> ${uniform.remarques}</p>` : ''}
                `;
                document.getElementById('deleteBtn').disabled = false;
            }
        } else {
            document.getElementById('uniformInfo').style.display = 'none';
            document.getElementById('deleteBtn').disabled = true;
        }
    });
}

function confirmDeleteUniform() {
    const agentCode = document.getElementById('deleteUniformAgent').value;
    if (!agentCode) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'habillement de l'agent ${agentCode} ?`)) {
        const index = uniforms.findIndex(u => u.code_agent === agentCode);
        if (index !== -1) {
            uniforms.splice(index, 1);
            saveData();
            showSnackbar(`✅ Habillement supprimé pour ${agentCode}`);
            displayUniformMenu();
        }
    }
}

function deleteUniform(agentCode) {
    if (confirm(`Supprimer l'habillement de ${agentCode} ?`)) {
        const index = uniforms.findIndex(u => u.code_agent === agentCode);
        if (index !== -1) {
            uniforms.splice(index, 1);
            saveData();
            showSnackbar(`✅ Habillement supprimé pour ${agentCode}`);
            showEditUniformList();
        }
    }
}

function showUniformReport() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement enregistré");
        return;
    }
    
    let html = `
        <div class="info-section">
            <h3>📋 Rapport Habillement</h3>
            <div style="margin-bottom: 20px;">
                <button class="popup-button blue" onclick="exportUniformReport()">📤 Exporter Excel</button>
                <button class="popup-button green" onclick="printUniformReport()">🖨️ Imprimer</button>
            </div>
            <table class="classement-table">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Code</th>
                        <th>Chemise</th>
                        <th>Jacket</th>
                        <th>Pantalon</th>
                        <th>Cravate</th>
                        <th>Dernière mise à jour</th>
                    </tr>
                </thead>
                <tbody>
                    ${uniforms.map(uniform => {
                        const agent = agents.find(a => a.code === uniform.code_agent);
                        const chemiseDate = new Date(uniform.chemise_date);
                        const jacketDate = new Date(uniform.jacket_date);
                        const pantalonDate = new Date(uniform.pantalon_date);
                        const today = new Date();
                        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                        
                        const getDateStyle = (date) => {
                            return date < oneYearAgo ? 'color: #e74c3c; font-weight: bold;' : 
                                   date < new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()) ? 'color: #f39c12;' : 
                                   'color: #27ae60;';
                        };
                        
                        return `
                            <tr>
                                <td>${agent ? agent.nom + ' ' + agent.prenom : 'N/A'}</td>
                                <td>${uniform.code_agent}</td>
                                <td><span style="${getDateStyle(chemiseDate)}">${uniform.chemise_taille}</span><br>
                                    <small style="${getDateStyle(chemiseDate)}">${uniform.chemise_date}</small></td>
                                <td><span style="${getDateStyle(jacketDate)}">${uniform.jacket_taille}</span><br>
                                    <small style="${getDateStyle(jacketDate)}">${uniform.jacket_date}</small></td>
                                <td><span style="${getDateStyle(pantalonDate)}">${uniform.pantalon_taille}</span><br>
                                    <small style="${getDateStyle(pantalonDate)}">${uniform.pantalon_date}</small></td>
                                <td>${uniform.cravate || 'NON'}</td>
                                <td><small>${uniform.updated_at ? new Date(uniform.updated_at).toLocaleDateString() : '-'}</small></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px; padding: 10px; background: #34495e; border-radius: 5px;">
                <p><small>🟢 Moins de 6 mois | 🟡 6-12 mois | 🔴 Plus d'un an</small></p>
            </div>
        </div>
    `;
    
    openPopup("📋 Rapport Habillement", html, `
        <button class="popup-button gray" onclick="displayUniformMenu()">Retour</button>
    `);
}

function showUniformStats() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement enregistré");
        return;
    }
    
    // Calcul des statistiques
    const chemiseSizes = {};
    const jacketSizes = {};
    const pantalonSizes = {};
    const cravateCount = { OUI: 0, NON: 0 };
    
    uniforms.forEach(uniform => {
        chemiseSizes[uniform.chemise_taille] = (chemiseSizes[uniform.chemise_taille] || 0) + 1;
        jacketSizes[uniform.jacket_taille] = (jacketSizes[uniform.jacket_taille] || 0) + 1;
        pantalonSizes[uniform.pantalon_taille] = (pantalonSizes[uniform.pantalon_taille] || 0) + 1;
        cravateCount[uniform.cravate || 'NON'] = (cravateCount[uniform.cravate || 'NON'] || 0) + 1;
    });
    
    let html = `
        <div class="info-section">
            <h3>📊 Statistiques Tailles</h3>
            
            <h4>Répartition des tailles de Chemises</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                ${Object.entries(chemiseSizes).map(([size, count]) => `
                    <div style="background: #3498db; padding: 10px; border-radius: 5px; min-width: 80px; text-align: center;">
                        <div style="font-size: 1.5em;">${size}</div>
                        <div>${count} agent(s)</div>
                        <div style="font-size: 0.8em;">${Math.round((count / uniforms.length) * 100)}%</div>
                    </div>
                `).join('')}
            </div>
            
            <h4>Répartition des tailles de Jackets</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                ${Object.entries(jacketSizes).map(([size, count]) => `
                    <div style="background: #e74c3c; padding: 10px; border-radius: 5px; min-width: 80px; text-align: center;">
                        <div style="font-size: 1.5em;">${size}</div>
                        <div>${count} agent(s)</div>
                        <div style="font-size: 0.8em;">${Math.round((count / uniforms.length) * 100)}%</div>
                    </div>
                `).join('')}
            </div>
            
            <h4>Répartition des tailles de Pantalons</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                ${Object.entries(pantalonSizes).map(([size, count]) => `
                    <div style="background: #9b59b6; padding: 10px; border-radius: 5px; min-width: 80px; text-align: center;">
                        <div style="font-size: 1.5em;">${size}</div>
                        <div>${count} agent(s)</div>
                        <div style="font-size: 0.8em;">${Math.round((count / uniforms.length) * 100)}%</div>
                    </div>
                `).join('')}
            </div>
            
            <h4>Cravates fournies</h4>
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="background: #2ecc71; padding: 15px; border-radius: 5px; flex: 1; text-align: center;">
                    <div style="font-size: 1.5em;">${cravateCount.OUI || 0}</div>
                    <div>Avec cravate</div>
                </div>
                <div style="background: #e74c3c; padding: 15px; border-radius: 5px; flex: 1; text-align: center;">
                    <div style="font-size: 1.5em;">${cravateCount.NON || 0}</div>
                    <div>Sans cravate</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 10px; background: #2c3e50; border-radius: 5px;">
                <p><strong>Total agents habillés:</strong> ${uniforms.length}</p>
                <p><strong>Agents sans habillement:</strong> ${agents.filter(a => a.statut === 'actif').length - uniforms.length}</p>
            </div>
        </div>
    `;
    
    openPopup("📊 Statistiques Tailles", html, `
        <button class="popup-button gray" onclick="displayUniformMenu()">Retour</button>
    `);
}

function showUniformDeadlines() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement enregistré");
        return;
    }
    
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    const expired = [];
    const warning = [];
    const ok = [];
    
    uniforms.forEach(uniform => {
        const chemiseDate = new Date(uniform.chemise_date);
        const jacketDate = new Date(uniform.jacket_date);
        const pantalonDate = new Date(uniform.pantalon_date);
        
        const oldestDate = new Date(Math.min(chemiseDate, jacketDate, pantalonDate));
        const agent = agents.find(a => a.code === uniform.code_agent);
        
        const uniformInfo = {
            agent: `${agent ? agent.nom + ' ' + agent.prenom : uniform.code_agent}`,
            code: uniform.code_agent,
            chemise: uniform.chemise_date,
            jacket: uniform.jacket_date,
            pantalon: uniform.pantalon_date,
            oldest: oldestDate.toISOString().split('T')[0]
        };
        
        if (oldestDate < oneYearAgo) {
            expired.push(uniformInfo);
        } else if (oldestDate < sixMonthsAgo) {
            warning.push(uniformInfo);
        } else {
            ok.push(uniformInfo);
        }
    });
    
    let html = `
        <div class="info-section">
            <h3>📅 Échéances Habillement</h3>
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <div style="background: #e74c3c; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                    <div style="font-size: 1.5em;">${expired.length}</div>
                    <div>Expirés (>1 an)</div>
                </div>
                <div style="background: #f39c12; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                    <div style="font-size: 1.5em;">${warning.length}</div>
                    <div>À renouveler (6-12 mois)</div>
                </div>
                <div style="background: #27ae60; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                    <div style="font-size: 1.5em;">${ok.length}</div>
                    <div>À jour (<6 mois)</div>
                </div>
            </div>
            
            <h4 style="color: #e74c3c;">🔴 Expirés (plus d'un an)</h4>
            ${expired.length > 0 ? `
                <table class="classement-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Chemise</th>
                            <th>Jacket</th>
                            <th>Pantalon</th>
                            <th>Ancienneté</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expired.map(item => `
                            <tr>
                                <td>${item.agent}<br><small>${item.code}</small></td>
                                <td>${item.chemise}</td>
                                <td>${item.jacket}</td>
                                <td>${item.pantalon}</td>
                                <td>${Math.floor((today - new Date(item.oldest)) / (1000*3600*24))} jours</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="padding: 10px; background: #2c3e50; border-radius: 5px;">Aucun habillement expiré ✓</p>'}
            
            <h4 style="color: #f39c12;">🟡 À renouveler (6-12 mois)</h4>
            ${warning.length > 0 ? `
                <table class="classement-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Chemise</th>
                            <th>Jacket</th>
                            <th>Pantalon</th>
                            <th>Ancienneté</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${warning.map(item => `
                            <tr>
                                <td>${item.agent}<br><small>${item.code}</small></td>
                                <td>${item.chemise}</td>
                                <td>${item.jacket}</td>
                                <td>${item.pantalon}</td>
                                <td>${Math.floor((today - new Date(item.oldest)) / (1000*3600*24))} jours</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="padding: 10px; background: #2c3e50; border-radius: 5px;">Aucun habillement à renouveler prochainement ✓</p>'}
        </div>
    `;
    
    openPopup("📅 Échéances Habillement", html, `
        <button class="popup-button blue" onclick="exportUniformDeadlines()">📤 Exporter</button>
        <button class="popup-button gray" onclick="displayUniformMenu()">Retour</button>
    `);
}

function exportUniformReport() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement à exporter");
        return;
    }
    
    let csvContent = "Agent;Code;Chemise Taille;Chemise Date;Jacket Taille;Jacket Date;Pantalon Taille;Pantalon Date;Cravate;Cravate Date;Remarques\n";
    
    uniforms.forEach(uniform => {
        const agent = agents.find(a => a.code === uniform.code_agent);
        csvContent += `${agent ? agent.nom + ' ' + agent.prenom : ''};`;
        csvContent += `${uniform.code_agent};`;
        csvContent += `${uniform.chemise_taille};`;
        csvContent += `${uniform.chemise_date};`;
        csvContent += `${uniform.jacket_taille};`;
        csvContent += `${uniform.jacket_date};`;
        csvContent += `${uniform.pantalon_taille};`;
        csvContent += `${uniform.pantalon_date};`;
        csvContent += `${uniform.cravate || 'NON'};`;
        csvContent += `${uniform.cravate_date || ''};`;
        csvContent += `${uniform.remarques || ''}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_habillement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar("✅ Rapport habillement exporté en CSV");
}

function exportUniformDeadlines() {
    if (uniforms.length === 0) {
        showSnackbar("ℹ️ Aucun habillement à exporter");
        return;
    }
    
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    let csvContent = "Statut;Agent;Code;Chemise Date;Jacket Date;Pantalon Date;Plus ancienne;Jours écoulés\n";
    
    uniforms.forEach(uniform => {
        const chemiseDate = new Date(uniform.chemise_date);
        const jacketDate = new Date(uniform.jacket_date);
        const pantalonDate = new Date(uniform.pantalon_date);
        const oldestDate = new Date(Math.min(chemiseDate, jacketDate, pantalonDate));
        const daysDiff = Math.floor((today - oldestDate) / (1000*3600*24));
        
        let statut = "OK";
        if (oldestDate < oneYearAgo) statut = "EXPIRÉ";
        else if (daysDiff > 180) statut = "À RENOUVELER";
        
        const agent = agents.find(a => a.code === uniform.code_agent);
        csvContent += `${statut};`;
        csvContent += `${agent ? agent.nom + ' ' + agent.prenom : ''};`;
        csvContent += `${uniform.code_agent};`;
        csvContent += `${uniform.chemise_date};`;
        csvContent += `${uniform.jacket_date};`;
        csvContent += `${uniform.pantalon_date};`;
        csvContent += `${oldestDate.toISOString().split('T')[0]};`;
        csvContent += `${daysDiff}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `echeances_habillement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar("✅ Échéances habillement exportées en CSV");
}

function printUniformReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Rapport Habillement</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #34495e; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { float: right; }
                    .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #7f8c8d; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Rapport Habillement - SGA</h1>
                    <p>Système de Gestion des Agents</p>
                    <p class="date">Généré le: ${new Date().toLocaleDateString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Code</th>
                            <th>Chemise</th>
                            <th>Jacket</th>
                            <th>Pantalon</th>
                            <th>Cravate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${uniforms.map(uniform => {
                            const agent = agents.find(a => a.code === uniform.code_agent);
                            return `
                                <tr>
                                    <td>${agent ? agent.nom + ' ' + agent.prenom : ''}</td>
                                    <td>${uniform.code_agent}</td>
                                    <td>${uniform.chemise_taille} (${uniform.chemise_date})</td>
                                    <td>${uniform.jacket_taille} (${uniform.jacket_date})</td>
                                    <td>${uniform.pantalon_taille} (${uniform.pantalon_date})</td>
                                    <td>${uniform.cravate || 'NON'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    <p>Total agents: ${uniforms.length} | Généré par Système de Gestion des Agents</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// --- GESTION DES AGENTS ---
function displayAgentsManagementMenu() {
    displaySubMenu("GESTION DES AGENTS", [
        { text: "➕ Ajouter Agent", handler: () => showAddAgentForm() },
        { text: "✏️ Modifier Agent", handler: () => showEditAgentList() },
        { text: "🗑️ Supprimer Agent", handler: () => showDeleteAgentForm() },
        { text: "👥 Liste Agents", handler: () => showAgentsList() },
        { text: "📥 Importer Excel", handler: () => showImportExcelForm() },
        { text: "🎲 Données Test", handler: () => initializeTestData() },
        { text: "🔍 Rechercher Agent", handler: () => showSearchAgentForm() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

// --- GESTION DES RADIOS ---
function displayRadiosMenu() {
    displaySubMenu("GESTION RADIOS", [
        { text: "➕ Ajouter Radio", handler: () => showAddRadioForm() },
        { text: "✏️ Modifier Radio", handler: () => showEditRadioList() },
        { text: "🗑️ Supprimer Radio", handler: () => showDeleteRadioForm() },
        { text: "📋 Liste Radios", handler: () => showRadiosList() },
        { text: "📊 Statistiques", handler: () => showRadiosStats() },
        { text: "📅 Historique", handler: () => showRadioHistory() },
        { text: "📤 Exporter", handler: () => exportRadiosReport() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

// --- GESTION DES AVERTISSEMENTS ---
function displayWarningsMenu() {
    displaySubMenu("AVERTISSEMENTS DISCIPLINAIRES", [
        { text: "➕ Ajouter Avertissement", handler: () => showAddWarningForm() },
        { text: "✏️ Modifier Avertissement", handler: () => showEditWarningList() },
        { text: "🗑️ Supprimer Avertissement", handler: () => showDeleteWarningForm() },
        { text: "📋 Liste Avertissements", handler: () => showWarningsList() },
        { text: "📊 Statistiques", handler: () => showWarningsStats() },
        { text: "📅 Historique Agent", handler: () => showAgentWarningsHistory() },
        { text: "📤 Exporter", handler: () => exportWarningsReport() },
        { text: "↩️ Retour Menu Principal", handler: () => displayMainMenu(), className: "back-button" }
    ]);
}

// Note: Pour compléter l'application, vous devez également implémenter:
// 1. Les fonctions pour les radios (similaires à habillement)
// 2. Les fonctions pour les avertissements
// 3. Les autres menus (planning, statistiques, etc.)
// 4. L'import/export Excel

// --- INITIALISATION FINALE ---
// Assurez-vous que les autres fichiers sont chargés dans l'ordre:
// 1. data.js (si existant)
// 2. app.js
// 3. style.css

console.log("✅ app.js chargé avec succès");
