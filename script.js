// =============================================================================
// [KONFIGURACJA FIRE DB] - Wklej tutaj swoje dane z Firebase Console
// =============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAYMzJvCR17JzfHvMuLuF_aGmptu0derGU",
    authDomain: "classspace-faeb3.firebaseapp.com",
    projectId: "classspace-faeb3",
    storageBucket: "classspace-faeb3.firebasestorage.app",
    messagingSenderId: "402654981974",
    appId: "1:402654981974:web:f8011e1fe8022d421130f7",
    measurementId: "G-7NT2WYYT21"
}; 

// Inicjalizacja Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
}

// =============================================================================
// ZMIENNE GLOBALNE I BAZA
// =============================================================================
const defaultRooms = [
    { id: '101', type: 'Sala Ćwiczeniowa', capacity: 30, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: '102', type: 'Sala Ćwiczeniowa', capacity: 20, hasProjector: false, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: 'AULA_A', type: 'Aula Wykładowa', capacity: 200, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: 'LAB_1', type: 'Laboratorium IT', capacity: 15, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: '205', type: 'Sala Seminaryjna', capacity: 12, hasProjector: false, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: '301', type: 'Sala Ćwiczeniowa', capacity: 40, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: '302', type: 'Sala Ćwiczeniowa', capacity: 45, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
    { id: 'SPORT', type: 'Hala Sportowa', capacity: 100, hasProjector: false, isBooked: false, bookedBy: '', time: '', subject: '', isMyBooking: false, hasIssue: false, issueDesc: '' },
];

const campusLayout = {
    'Piętro 3': ['301', '302'],
    'Piętro 2': ['205'],
    'Piętro 1': ['101', '102', 'LAB_1'],
    'Parter': ['AULA_A', 'SPORT']
};

let rooms = [];
let auditLogs = [];
let currentRole = 'wykladowca';
let selectedMapRoomId = null; 

// === MOTYW ===
function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('classSpaceTheme', newTheme);
    updateThemeButtons(newTheme);
}

function updateThemeButtons(theme) {
    const newText = theme === 'light' ? '🌙 Ciemny' : '☀️ Jasny';
    const btnLogin = document.getElementById('theme-btn-login');
    const btnApp = document.getElementById('theme-btn-app');
    if(btnLogin) btnLogin.innerText = newText;
    if(btnApp) btnApp.innerText = newText;
}

// === CZĘŚĆ LOGOWANIA ===
function switchTab(tabName) {
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('form-login').classList.remove('active');
    document.getElementById('form-register').classList.remove('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`form-${tabName}`).classList.add('active');
    hideAuthAlert();
    generateCaptcha(tabName);
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = 'Ukryj';
    } else {
        input.type = 'password';
        btn.innerText = 'Pokaż';
    }
}

function selectRole(role) {
    document.getElementById('role-lecturer').classList.remove('selected');
    document.getElementById('role-admin').classList.remove('selected');
    document.getElementById(`role-${role}`).classList.add('selected');
    document.getElementById('register-role').value = role;
}

let currentCaptchaAnswer = 0;
function generateCaptcha(formType) {
    const num1 = Math.floor(Math.random() * 10) + 1; 
    const num2 = Math.floor(Math.random() * 10) + 1; 
    currentCaptchaAnswer = num1 + num2;
    document.getElementById(`${formType}-captcha-eq`).innerText = `${num1} + ${num2} =`;
    document.getElementById(`${formType}-captcha-input`).value = '';
}

function checkPasswordStrength() {
    const password = document.getElementById('register-password').value;
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');

    if (password.length === 0) { bar.style.width = '0%'; text.innerText = 'Wpisz hasło'; return; }

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

    switch (strength) {
        case 1: bar.style.width = '33%'; bar.style.backgroundColor = 'var(--danger)'; text.innerText = 'Słabe'; text.style.color = 'var(--danger)'; break;
        case 2: case 3: bar.style.width = '66%'; bar.style.backgroundColor = 'var(--warning)'; text.innerText = 'Średnie'; text.style.color = 'var(--warning)'; break;
        case 4: bar.style.width = '100%'; bar.style.backgroundColor = 'var(--success)'; text.innerText = 'Silne'; text.style.color = 'var(--success)'; break;
        default: bar.style.width = '10%'; bar.style.backgroundColor = 'var(--danger)'; text.innerText = 'Bardzo słabe'; text.style.color = 'var(--danger)';
    }
}

function showAuthAlert(msg, type) {
    const box = document.getElementById('auth-alert-box');
    box.className = `alert alert-${type}`;
    box.innerText = msg;
    box.style.display = 'block';
}
function hideAuthAlert() { document.getElementById('auth-alert-box').style.display = 'none'; }

function handleLogin(e) {
    e.preventDefault();
    const captchaInput = parseInt(document.getElementById('login-captcha-input').value);
    if (captchaInput !== currentCaptchaAnswer) {
        showAuthAlert('Błąd: Niepoprawny wynik z zabezpieczenia Captcha!', 'danger');
        generateCaptcha('login');
        return;
    }
    showAuthAlert('Logowanie udane! Przekierowywanie do ClassSpace...', 'success');
    
    // Zapisujemy log przed przejściem
    addLiveLog("SYSTEM", "SYSTEM", "Użytkownik", "Użytkownik pomyślnie zalogowany do systemu.");

    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
}

function handleRegister(e) {
    e.preventDefault();
    const pass = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const captchaInput = parseInt(document.getElementById('register-captcha-input').value);

    if (pass !== confirm) { showAuthAlert('Błąd: Podane hasła nie są identyczne!', 'danger'); return; }
    if (captchaInput !== currentCaptchaAnswer) { showAuthAlert('Błąd: Niepoprawny wynik z zabezpieczenia Captcha!', 'danger'); generateCaptcha('register'); return; }

    const role = document.getElementById('register-role').value;
    localStorage.setItem('classSpaceUserRole', role);
    showAuthAlert('Konto zostało utworzone! Możesz się teraz zalogować.', 'success');
    setTimeout(() => { switchTab('login'); }, 2000);
}

function logout() {
    addLiveLog("SYSTEM", "SYSTEM", "Użytkownik", "Użytkownik został wylogowany.");
    window.location.href = 'login.html';
}

// === SYSTEM LOGÓW (FIREBASE + LOCAL) ===
function loadLogs() {
    const saved = localStorage.getItem('classSpaceLogs');
    if (saved) { auditLogs = JSON.parse(saved); }
}
function saveLogs() { localStorage.setItem('classSpaceLogs', JSON.stringify(auditLogs)); }

function addLiveLog(action, roomId, user, details = "") {
    const timeString = new Date().toLocaleString('pl-PL');
    
    const logData = {
        time: timeString,
        action: action,
        room: roomId,
        user: user,
        details: details
    };

    // Zapis do Fire DB (jeśli połączono)
    if (typeof db !== 'undefined') {
        logData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        db.collection("logs").add(logData).catch(err => console.error("Fire DB Error:", err));
    }

    // Dodanie do lokalnej tablicy na potrzeby widoku
    const logString = `[${timeString}] ${action}: ${user} | Sala: ${roomId} | ${details}`;
    auditLogs.unshift(logString);
    saveLogs();
    
    if(currentRole === 'admin') renderLogs();
}

function renderLogs() {
    const container = document.getElementById('logs-container');
    if(!container) return;
    if(auditLogs.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; margin-top: 20px;">Brak historii działań.</div>';
        return;
    }
    container.innerHTML = auditLogs.map(log => {
        let color = "inherit";
        if(log.includes('SYSTEM')) color = "var(--primary)";
        if(log.includes('USTERKA')) color = "var(--warning)";
        if(log.includes('NAPRAWA')) color = "var(--success)";
        if(log.includes('OPUSZCZENIE') || log.includes('SYSTEM_RESET')) color = "var(--danger)";
        
        return `<div style="padding: 8px; border-bottom: 1px dashed var(--border); color: ${color};">${log}</div>`;
    }).join('');
}

function adminClearAll() {
    if (confirm("⚠️ CZY NA PEWNO CHCESZ ZRESETOWAĆ WSZYSTKIE REZERWACJE W LIVE DB? Tej operacji nie można cofnąć!")) {
        rooms = JSON.parse(JSON.stringify(defaultRooms));
        saveRooms();
        refreshViews();
        
        auditLogs = [];
        addLiveLog("SYSTEM_RESET", "ALL", "Administrator", "Pełne czyszczenie bazy sal i logów");
        showAppAlert("Baza danych została zresetowana!", "success");
    }
}

function exportToCSV() {
    if(auditLogs.length === 0) {
        alert("Brak danych do wyeksportowania.");
        return;
    }
    showAppAlert("Generowanie raportu CSV...", "success");
    let csvContent = "data:text/csv;charset=utf-8,Data i Czas,Akcja\n";
    auditLogs.forEach(log => {
        let parts = log.split('] ');
        let time = parts[0].replace('[', '');
        let action = parts[1] ? parts[1].replace(/"/g, '""') : '';
        csvContent += `"${time}","${action}"\n`;
    });

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "class_space_audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// === OBSŁUGA APLIKACJI GŁÓWNEJ ===
function loadRooms() {
    const saved = localStorage.getItem('classSpaceRooms');
    if (saved) { rooms = JSON.parse(saved); } else { rooms = JSON.parse(JSON.stringify(defaultRooms)); }
}
function saveRooms() { localStorage.setItem('classSpaceRooms', JSON.stringify(rooms)); }

function initDateTime() {
    const dateInput = document.getElementById('search-date');
    const timeInput = document.getElementById('search-time');
    if(!dateInput || !timeInput) return;
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); 
    dateInput.value = today;
    dateInput.min = today; 
    const nextHour = String((now.getHours() + 1) % 24).padStart(2, '0');
    timeInput.value = `${nextHour}:00`;
}

setInterval(() => {
    const clock = document.getElementById('live-clock');
    if (clock) clock.innerText = new Date().toLocaleTimeString('pl-PL');
}, 1000);

function switchAppRole(role) {
    if (role === 'admin') {
        const password = prompt("🔐 Weryfikacja: Podaj hasło administratora:");
        if (password !== "admin123") {
            showAppAlert("❌ Brak dostępu: Niepoprawne hasło!", "danger");
            addLiveLog("PRÓBA_LOGOWANIA", "SYSTEM", "Nieznany", "Błędne hasło admina");
            return;
        }
        addLiveLog("ADMIN_LOGIN", "SYSTEM", "Administrator", "Pomyślne zalogowanie do panelu Admina");
    }

    currentRole = role;
    
    const btnWykladowca = document.getElementById('btn-wykladowca');
    const btnPortiernia = document.getElementById('btn-portiernia');
    const btnAdmin = document.getElementById('btn-admin');
    
    if(btnWykladowca) btnWykladowca.classList.toggle('active', role === 'wykladowca');
    if(btnPortiernia) btnPortiernia.classList.toggle('active', role === 'portiernia');
    if(btnAdmin) btnAdmin.classList.toggle('active', role === 'admin');
    
    document.getElementById('view-wykladowca').classList.toggle('active', role === 'wykladowca');
    document.getElementById('view-portiernia').classList.toggle('active', role === 'portiernia');
    document.getElementById('view-admin').classList.toggle('active', role === 'admin');
    
    document.getElementById('app-alert-msg').style.display = 'none';

    if(role === 'wykladowca') refreshViews();
    if(role === 'portiernia') renderPortierniaRooms();
    if(role === 'admin') renderLogs();
}

function showAppAlert(msg, type) {
    const alertBox = document.getElementById('app-alert-msg');
    alertBox.className = `alert alert-${type}`;
    alertBox.innerText = msg;
    alertBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

function calculateEndTime(startTime, durationMinutes) {
    let [hours, minutes] = startTime.split(':').map(Number);
    minutes += parseInt(durationMinutes);
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function refreshViews() {
    selectedMapRoomId = null; 
    renderInteractiveMap();
    renderWykladowcaRooms();
}

// === MAPA ===
function renderInteractiveMap() {
    const mapContainer = document.getElementById('interactive-map');
    const actionPanel = document.getElementById('map-actions-panel');
    const reqProjector = document.getElementById('req-projector').checked;
    const minCapacity = parseInt(document.getElementById('min-capacity').value) || 0;

    if(!mapContainer) return;

    let html = `<div class="map-legend">
        <div class="legend-item"><div class="legend-box" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.5);"></div> Wolne</div>
        <div class="legend-item"><div class="legend-box" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5);"></div> Usterka</div>
        <div class="legend-item"><div class="legend-box" style="background: var(--border); border-color: var(--text-muted);"></div> Zajęte / Filtr</div>
        <div class="legend-item"><div class="legend-box" style="background: var(--primary); border-color: var(--primary-hover);"></div> Twój wybór</div>
    </div><div id="floors-container">`;

    for (const [floorName, roomIds] of Object.entries(campusLayout)) {
        html += `<div class="map-floor"><div class="map-floor-title">${floorName}</div><div class="floor-grid">`;
        roomIds.forEach(id => {
            const room = rooms.find(r => r.id === id);
            if(!room) return;
            let isAvailable = true;
            if (room.isBooked) isAvailable = false;
            if (reqProjector && !room.hasProjector) isAvailable = false;
            if (room.capacity < minCapacity) isAvailable = false;

            let statusClass = isAvailable ? 'status-free' : 'status-taken';
            if (room.hasIssue && isAvailable) statusClass = 'status-issue';
            let onClickAction = isAvailable ? `onclick="selectMapRoom('${id}')"` : '';
            if (selectedMapRoomId === id) statusClass = 'status-selected';

            let extraStyle = (id === 'AULA_A' || id === 'SPORT') ? 'grid-column: span 2;' : '';
            let warningIcon = room.hasIssue ? '⚠️ ' : '';

            html += `<div class="map-room ${statusClass}" style="${extraStyle}" ${onClickAction} title="Pojemność: ${room.capacity} osób">
                    ${warningIcon}${id}<small>${room.type}</small></div>`;
        });
        html += `</div></div>`;
    }
    html += `</div>`;
    mapContainer.innerHTML = html;

    if (selectedMapRoomId) {
        const room = rooms.find(r => r.id === selectedMapRoomId);
        let warningText = room.hasIssue ? `<div style="color: var(--warning); font-weight: bold; margin-bottom: 15px;">⚠️ Usterka: ${room.issueDesc}</div>` : '';
        actionPanel.innerHTML = `
            <div style="background: var(--card-bg); border: 2px solid var(--primary); padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h3 style="margin-top:0; margin-bottom: 10px;">Wybrano: Sala ${selectedMapRoomId}</h3>
                <p style="margin-top:0; color: var(--text-muted);">Pojemność: ${room.capacity} | Rzutnik: ${room.hasProjector ? 'Tak' : 'Nie'}</p>
                ${warningText}
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-reserve" style="flex: 2; padding: 14px; font-size: 16px;" onclick="bookSelectedMapRoom()">📅 Zarezerwuj Salę</button>
                    <button class="btn btn-warning" style="flex: 1;" onclick="reportIssue('${selectedMapRoomId}')">⚠️ Zgłoś Usterkę</button>
                </div>
            </div>`;
        actionPanel.style.display = 'block';
    } else {
        actionPanel.style.display = 'none';
    }
}

function selectMapRoom(roomId) {
    selectedMapRoomId = (selectedMapRoomId === roomId) ? null : roomId;
    renderInteractiveMap(); 
}

function bookSelectedMapRoom() {
    if(selectedMapRoomId) { bookRoom(selectedMapRoomId); selectedMapRoomId = null; refreshViews(); }
}

function reportIssue(roomId) {
    const desc = prompt(`Zgłaszasz usterkę w Sali ${roomId}.\nKrótko opisz problem (np. Brak kabla HDMI, zepsuta klimatyzacja):`);
    if (desc !== null && desc.trim() !== '') {
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex !== -1) {
            rooms[roomIndex].hasIssue = true;
            rooms[roomIndex].issueDesc = desc.trim();
            saveRooms();
            const user = document.getElementById('user-name') ? document.getElementById('user-name').value.trim() || "Wykładowca" : "System";
            addLiveLog("USTERKA", roomId, user, `Opis: ${desc.trim()}`);
            showAppAlert(`⚠️ Zgłoszono usterkę dla sali ${roomId}. Powiadomiono dział IT.`, 'warning');
            renderInteractiveMap(); renderWykladowcaRooms();
        }
    }
}

function resolveIssue(roomId) {
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
        rooms[roomIndex].hasIssue = false;
        rooms[roomIndex].issueDesc = '';
        saveRooms();
        addLiveLog("NAPRAWA", roomId, "Portiernia/Admin", `Usterka rozwiązana.`);
        renderPortierniaRooms(); 
    }
}

function renderWykladowcaRooms() {
    const reqProjector = document.getElementById('req-projector').checked;
    const minCapacity = parseInt(document.getElementById('min-capacity').value) || 0;
    const listDiv = document.getElementById('wykladowca-rooms-list');
    if(!listDiv) return;
    
    listDiv.innerHTML = '';

    const filteredRooms = rooms.filter(room => {
        if (reqProjector && !room.hasProjector) return false;
        if (room.capacity < minCapacity) return false;
        return true;
    });

    if(filteredRooms.length === 0) {
        listDiv.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted);">Brak sal spełniających kryteria.</div>';
        return;
    }

    filteredRooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        let btnHtml = '';
        if (room.isMyBooking) { btnHtml = `<button class="btn btn-cancel" onclick="cancelRoom('${room.id}', 'wykladowca')">Anuluj rezerwację</button>`; } 
        else if (room.isBooked) { btnHtml = `<span class="badge badge-taken">Zajęta: ${room.subject}</span>`; } 
        else { btnHtml = `<button class="btn btn-reserve" onclick="bookRoom('${room.id}')">Rezerwuj</button>`; }

        let badges = '';
        if (room.hasProjector) badges += '<span class="badge badge-projector">📺 Rzutnik</span> ';
        if (room.isMyBooking) badges += '<span class="badge badge-mine">Moja Rezerwacja</span> ';
        if (room.hasIssue) badges += `<span class="badge badge-issue" title="${room.issueDesc}">⚠️ Usterka</span>`;

        card.innerHTML = `
            <div class="room-info">
                <h3>SALA ${room.id} ${badges}</h3>
                <p>Typ: ${room.type} | 👥 Pojemność: ${room.capacity} osób</p>
                ${room.hasIssue ? `<p style="color: var(--warning); font-size: 12px; margin-top: 5px;">Szczegóły: ${room.issueDesc}</p>` : ''}
            </div>
            <div>${btnHtml}</div>`;
        listDiv.appendChild(card);
    });
}

function renderPortierniaRooms() {
    const issuesListDiv = document.getElementById('portiernia-issues-list');
    const roomsListDiv = document.getElementById('portiernia-rooms-list');
    if(!issuesListDiv || !roomsListDiv) return;

    issuesListDiv.innerHTML = ''; roomsListDiv.innerHTML = '';

    const roomsWithIssues = rooms.filter(room => room.hasIssue);
    if(roomsWithIssues.length === 0) {
        issuesListDiv.innerHTML = '<div style="color: var(--success); font-weight: bold; padding: 10px 0;">✅ Brak zgłoszonych usterek na kampusie.</div>';
    } else {
        roomsWithIssues.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card issue-card';
            card.innerHTML = `
                <div class="room-info" style="flex: 1;">
                    <h3 style="color: var(--warning-hover);">⚠️ SALA ${room.id} <span style="font-size: 14px; color: var(--text-muted);">(${room.type})</span></h3>
                    <p style="margin: 10px 0; font-size: 16px;"><strong>Zgłoszenie:</strong> ${room.issueDesc}</p>
                </div>
                <div>
                    <button class="btn btn-success" style="background-color: var(--success); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;" onclick="resolveIssue('${room.id}')">Oznacz jako Naprawione</button>
                </div>`;
            issuesListDiv.appendChild(card);
        });
    }

    const bookedRooms = rooms.filter(room => room.isBooked);
    if(bookedRooms.length === 0) {
        roomsListDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); border: 2px dashed var(--border); border-radius: 12px;">Wszystkie klucze są w portierni. Brak aktywnych zajęć.</div>';
        return;
    }

    bookedRooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div class="room-info" style="flex: 1;">
                    <h3>SALA ${room.id} <span style="font-size: 14px; font-weight: normal; color: var(--text-muted); margin-left: 10px;">(${room.type})</span></h3>
                    <p style="margin: 10px 0; font-size: 18px;">Osoba: <strong>${room.bookedBy}</strong></p>
                    <p style="margin-bottom: 10px;">Temat: ${room.subject}</p>
                    <p>Zajęcia trwają: <span class="time-badge">${room.time}</span></p>
                </div>
                <div>
                    <button class="btn btn-return" onclick="cancelRoom('${room.id}', 'portiernia')">Odbierz klucz<br><small>(Zakończ)</small></button>
                </div>
            </div>`;
        roomsListDiv.appendChild(card);
    });
}

function bookRoom(roomId) {
    const name = document.getElementById('user-name').value.trim();
    const subject = document.getElementById('booking-subject').value.trim();
    const startTime = document.getElementById('search-time').value;
    const duration = document.getElementById('search-duration').value;

    if (!name || !subject) {
        showAppAlert('Błąd: Wypełnij pole "Imię i Nazwisko" oraz "Temat zajęć" na samej górze!', 'danger');
        return;
    }

    const roomIndex = rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
        const endTime = calculateEndTime(startTime, duration);
        rooms[roomIndex].isBooked = true;
        rooms[roomIndex].isMyBooking = true;
        rooms[roomIndex].bookedBy = name;
        rooms[roomIndex].subject = subject;
        rooms[roomIndex].time = `${startTime} - ${endTime}`;
        saveRooms(); 
        
        addLiveLog("REZERWACJA", roomId, name, `Zajęcia: ${subject} (${startTime}-${endTime})`);

        showAppAlert(`✅ Sukces! Sala ${roomId} została zarezerwowana w godzinach ${startTime} - ${endTime}.`, 'success');
        refreshViews();
    }
}

function cancelRoom(roomId, source) {
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
        const user = rooms[roomIndex].bookedBy || "Nieznany";
        rooms[roomIndex].isBooked = false;
        rooms[roomIndex].isMyBooking = false;
        rooms[roomIndex].bookedBy = '';
        rooms[roomIndex].subject = '';
        rooms[roomIndex].time = '';
        saveRooms(); 
        
        addLiveLog("OPUSZCZENIE", roomId, user, `Zwolnione przez: ${source}`);

        if (source === 'wykladowca') { showAppAlert(`🗑️ Rezerwacja sali ${roomId} została anulowana.`, 'success'); refreshViews(); } 
        else if (source === 'portiernia') { renderPortierniaRooms(); }
    }
}

// === Inicjalizacja przy ładowaniu strony ===
document.addEventListener('DOMContentLoaded', () => {
    // Odczytaj zapisany motyw
    const savedTheme = localStorage.getItem('classSpaceTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButtons(savedTheme);

    // Jeśli jesteśmy na stronie logowania
    if (document.getElementById('login-page')) {
        generateCaptcha('login');
    }

    // Jeśli jesteśmy w głównej aplikacji
    if (document.getElementById('app-page')) {
        loadRooms();
        loadLogs();
        initDateTime();
        
        const savedRole = localStorage.getItem('classSpaceUserRole') || 'wykladowca';
        // Automatyczne przełączenie na zapisaną rolę, jeśli to nie admin (wymaga hasła, więc lepiej nie wymuszać)
        if (savedRole !== 'admin') {
            switchAppRole(savedRole);
        } else {
            switchAppRole('wykladowca'); 
        }
    }
});