const firebaseConfig = {
    apiKey: "AIzaSyAYMzJvCR17JzfHvMuLuF_aGmptu0derGU",
    authDomain: "classspace-faeb3.firebaseapp.com",
    projectId: "classspace-faeb3",
    storageBucket: "classspace-faeb3.firebasestorage.app",
    messagingSenderId: "402654981974",
    appId: "1:402654981974:web:f8011e1fe8022d421130f7",
    measurementId: "G-7NT2WYYT21"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
}

const defaultRooms = [{
        id: '101',
        type: 'Sala Ćwiczeniowa',
        capacity: 30,
        hasProjector: true,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: '102',
        type: 'Sala Ćwiczeniowa',
        capacity: 20,
        hasProjector: false,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: 'AULA_A',
        type: 'Aula Wykładowa',
        capacity: 200,
        hasProjector: true,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: 'LAB_1',
        type: 'Laboratorium IT',
        capacity: 15,
        hasProjector: true,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: '205',
        type: 'Sala Seminaryjna',
        capacity: 12,
        hasProjector: false,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: '301',
        type: 'Sala Ćwiczeniowa',
        capacity: 40,
        hasProjector: true,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: '302',
        type: 'Sala Ćwiczeniowa',
        capacity: 45,
        hasProjector: true,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
    {
        id: 'SPORT',
        type: 'Hala Sportowa',
        capacity: 100,
        hasProjector: false,
        isBooked: false,
        bookedBy: '',
        time: '',
        subject: '',
        hasIssue: false,
        issueDesc: ''
    },
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

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('classSpaceTheme', newTheme);
}

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
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`role-${role}`).classList.add('selected');
    document.getElementById('register-role').value = role;
}

let currentCaptchaAnswer = 0;

function generateCaptcha(formType) {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    currentCaptchaAnswer = num1 + num2;
    const eqElement = document.getElementById(`${formType}-captcha-eq`);
    if (eqElement) eqElement.innerText = `${num1} + ${num2} =`;
    const inputElement = document.getElementById(`${formType}-captcha-input`);
    if (inputElement) inputElement.value = '';
}

function checkPasswordStrength() {
    const password = document.getElementById('register-password').value;
    const bar = document.getElementById('strength-bar');
    if (!bar) return;
    if (password.length === 0) {
        bar.style.width = '0%';
        return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    switch (strength) {
        case 1:
            bar.style.width = '33%';
            bar.style.backgroundColor = 'var(--danger)';
            break;
        case 2:
        case 3:
            bar.style.width = '66%';
            bar.style.backgroundColor = 'var(--warning)';
            break;
        case 4:
            bar.style.width = '100%';
            bar.style.backgroundColor = 'var(--success)';
            break;
        default:
            bar.style.width = '10%';
            bar.style.backgroundColor = 'var(--danger)';
    }
}

function showAuthAlert(msg, type) {
    const box = document.getElementById('auth-alert-box');
    box.className = `alert alert-${type}`;
    box.innerText = msg;
    box.style.display = 'block';
}

function hideAuthAlert() {
    document.getElementById('auth-alert-box').style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const captchaInput = parseInt(document.getElementById('login-captcha-input').value);

    if (captchaInput !== currentCaptchaAnswer) {
        showAuthAlert('Błąd weryfikacji. Wprowadź poprawny wynik działania.', 'danger');
        generateCaptcha('login');
        return;
    }

    if (typeof db === 'undefined') {
        showAuthAlert('Błąd bazy danych Firebase.', 'danger');
        return;
    }

    try {
        const hashedPassword = await hashPassword(pass);
        const userDoc = await db.collection('users').doc(email).get();

        if (!userDoc.exists || userDoc.data().password !== hashedPassword) {
            showAuthAlert('Błędny adres e-mail lub hasło.', 'danger');
            return;
        }

        const userData = userDoc.data();
        localStorage.setItem('classSpaceUserRole', userData.role);
        localStorage.setItem('classSpaceUserName', userData.name);

        showAuthAlert('Logowanie udane. Przekierowywanie...', 'success');
        addLiveLog("SYSTEM", "SYSTEM", userData.name, "Pomyślne logowanie do systemu.");

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error("Login error:", error);
        showAuthAlert('Wystąpił błąd podczas logowania.', 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const pass = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const captchaInput = parseInt(document.getElementById('register-captcha-input').value);
    const role = document.getElementById('register-role').value;

    if (pass !== confirm) {
        showAuthAlert('Błąd: Podane hasła nie są identyczne.', 'danger');
        return;
    }
    if (captchaInput !== currentCaptchaAnswer) {
        showAuthAlert('Błąd weryfikacji.', 'danger');
        generateCaptcha('register');
        return;
    }

    try {
        const userRef = db.collection('users').doc(email);
        const docSnap = await userRef.get();
        if (docSnap.exists) {
            showAuthAlert('Konto z tym adresem e-mail już istnieje.', 'danger');
            return;
        }

        const hashedPassword = await hashPassword(pass);

        await userRef.set({
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showAuthAlert('Konto zostało utworzone. Możesz się zalogować.', 'success');
        setTimeout(() => {
            switchTab('login');
        }, 2000);
    } catch (error) {
        showAuthAlert('Wystąpił błąd podczas rejestracji.', 'danger');
    }
}

function logout() {
    const userName = localStorage.getItem('classSpaceUserName') || "Użytkownik";
    addLiveLog("SYSTEM", "SYSTEM", userName, "Wylogowanie z systemu.");
    localStorage.removeItem('classSpaceUserName');
    window.location.href = 'login.html';
}

function addLiveLog(action, roomId, user, details = "") {
    const timeString = new Date().toLocaleString('pl-PL');
    const logData = {
        time: timeString,
        action: action,
        room: roomId,
        user: user,
        details: details
    };

    if (typeof db !== 'undefined') {
        logData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        db.collection("logs").add(logData).catch(err => console.error("Fire DB Error:", err));
    }

    const logString = `[${timeString}] ${action}: ${user} | Sala: ${roomId} | ${details}`;
    auditLogs.unshift(logString);
    if (currentRole === 'admin') renderLogs();
}

async function loadLogsFromFirebase() {
    if (typeof db === 'undefined') return;
    db.collection('logs').orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
        auditLogs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            auditLogs.push(`[${data.time}] ${data.action}: ${data.user} | Sala: ${data.room} | ${data.details}`);
        });
        if (currentRole === 'admin') renderLogs();
    });
}

function renderLogs() {
    const container = document.getElementById('logs-container');
    if (!container) return;
    if (auditLogs.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; margin-top: 20px;">Brak historii działań.</div>';
        return;
    }
    container.innerHTML = auditLogs.map(log => {
        return `<div style="padding: 8px; border-bottom: 1px dashed var(--border);">${log}</div>`;
    }).join('');
}

async function initAndSyncRooms() {
    if (typeof db === 'undefined') return;

    const snapshot = await db.collection('sale').get();
    if (snapshot.empty) {
        const batch = db.batch();
        defaultRooms.forEach(room => {
            const roomRef = db.collection('sale').doc(room.id);
            batch.set(roomRef, room);
        });
        await batch.commit();
        console.log("Inicjalizacja domyślnych sal w Firebase zakończona.");
    }

    db.collection('sale').onSnapshot(liveSnapshot => {
        rooms = [];
        liveSnapshot.forEach(doc => {
            rooms.push(doc.data());
        });
        refreshViews();
        renderPortierniaRooms();
    });
}

function initDateTime() {
    const dateInput = document.getElementById('search-date');
    const timeInput = document.getElementById('search-time');
    if (!dateInput || !timeInput) return;
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
    currentRole = role;
    document.querySelectorAll('.btn-role').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${role}`).classList.add('active');

    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`view-${role}`).classList.add('active');

    document.getElementById('app-alert-msg').style.display = 'none';

    if (role === 'wykladowca') refreshViews();
    if (role === 'portiernia') renderPortierniaRooms();
    if (role === 'admin') renderLogs();
}

function showAppAlert(msg, type) {
    const alertBox = document.getElementById('app-alert-msg');
    alertBox.className = `alert alert-${type}`;
    alertBox.innerText = msg;
    alertBox.style.display = 'block';
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 8000);
}

function calculateEndTime(startTime, durationMinutes) {
    let [hours, minutes] = startTime.split(':').map(Number);
    minutes += parseInt(durationMinutes);
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function refreshViews() {
    if (!document.getElementById('interactive-map')) return;
    renderInteractiveMap();
    renderWykladowcaRooms();
}

function renderInteractiveMap() {
    const mapContainer = document.getElementById('interactive-map');
    const actionPanel = document.getElementById('map-actions-panel');
    const reqProjector = document.getElementById('req-projector') ? document.getElementById('req-projector').checked : false;
    const minCapacity = document.getElementById('min-capacity') ? parseInt(document.getElementById('min-capacity').value) || 0 : 0;

    let html = `<div class="map-legend">
        <div class="legend-item"><div class="legend-box status-free" style="width:12px; height:12px; display:inline-block;"></div> Dostępne</div>
        <div class="legend-item"><div class="legend-box status-issue" style="width:12px; height:12px; display:inline-block;"></div> Usterka</div>
        <div class="legend-item"><div class="legend-box status-taken" style="width:12px; height:12px; display:inline-block;"></div> Niedostępne</div>
        <div class="legend-item"><div class="legend-box status-selected" style="width:12px; height:12px; display:inline-block;"></div> Wybór</div>
    </div><div id="floors-container">`;

    for (const [floorName, roomIds] of Object.entries(campusLayout)) {
        html += `<div class="map-floor"><div class="map-floor-title">${floorName}</div><div class="floor-grid">`;
        roomIds.forEach(id => {
            const room = rooms.find(r => r.id === id);
            if (!room) return;
            let isAvailable = true;
            if (room.isBooked) isAvailable = false;
            if (reqProjector && !room.hasProjector) isAvailable = false;
            if (room.capacity < minCapacity) isAvailable = false;

            let statusClass = isAvailable ? 'status-free' : 'status-taken';
            if (room.hasIssue && isAvailable) statusClass = 'status-issue';
            let onClickAction = isAvailable ? `onclick="selectMapRoom('${id}')"` : '';
            if (selectedMapRoomId === id) statusClass = 'status-selected';

            let extraStyle = (id === 'AULA_A' || id === 'SPORT') ? 'grid-column: span 2;' : '';

            html += `<div class="map-room ${statusClass}" style="${extraStyle}" ${onClickAction}>
                    ${id}<small>${room.type}</small></div>`;
        });
        html += `</div></div>`;
    }
    html += `</div>`;
    mapContainer.innerHTML = html;

    if (selectedMapRoomId) {
        const room = rooms.find(r => r.id === selectedMapRoomId);
        let warningText = room.hasIssue ? `<div style="color: var(--danger); font-weight: bold; margin-bottom: 15px;">Usterka: ${room.issueDesc}</div>` : '';
        actionPanel.innerHTML = `
            <div style="background: var(--card-bg); border: 1px solid var(--border); padding: 20px; border-radius: var(--radius);">
                <h3 style="margin-top:0; color: var(--text-main);">Wybrano: Sala ${selectedMapRoomId}</h3>
                <p style="margin-top:0; font-size: 13px; color: var(--text-muted); margin-bottom: 15px;">Pojemność: ${room.capacity} | Rzutnik: ${room.hasProjector ? 'Tak' : 'Nie'}</p>
                ${warningText}
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-reserve" style="flex: 2;" onclick="bookSelectedMapRoom()">Zarezerwuj Salę</button>
                    <button class="btn btn-return" style="flex: 1;" onclick="reportIssue('${selectedMapRoomId}')">Zgłoś Usterkę</button>
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
    if (selectedMapRoomId) {
        bookRoom(selectedMapRoomId);
        selectedMapRoomId = null;
    }
}

async function reportIssue(roomId) {
    const desc = prompt(`Zgłaszasz usterkę w Sali ${roomId}.\nKrótko opisz problem:`);
    if (desc !== null && desc.trim() !== '') {
        const userName = localStorage.getItem('classSpaceUserName') || "Użytkownik";

        await db.collection('awarie').add({
            roomId: roomId,
            opis: desc.trim(),
            zgloszonePrzez: userName,
            status: 'Otwarta',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('sale').doc(roomId).update({
            hasIssue: true,
            issueDesc: desc.trim()
        });

        await db.collection('logi_usterek').add({
            roomId: roomId,
            akcja: 'ZGŁOSZENIE',
            opis: desc.trim(),
            uzytkownik: userName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        addLiveLog("USTERKA", roomId, userName, `Opis: ${desc.trim()}`);
        showAppAlert(`Zgłoszono usterkę dla sali ${roomId}.`, 'warning');
    }
}

async function resolveIssue(roomId) {
    const desc = prompt(`Zamykasz usterkę w sali ${roomId}.\nPodaj krótki opis naprawy (np. "Wymieniono kabel HDMI"):`);
    if (desc !== null && desc.trim() !== '') {
        const userName = localStorage.getItem('classSpaceUserName') || "Portiernia/Admin";

        await db.collection('sale').doc(roomId).update({
            hasIssue: false,
            issueDesc: ''
        });

        const awarieSnapshot = await db.collection('awarie')
            .where('roomId', '==', roomId)
            .where('status', '==', 'Otwarta')
            .get();

        awarieSnapshot.forEach(async (doc) => {
            const data = doc.data();
            
            await db.collection('awarie').doc(doc.id).update({
                status: 'Zamknięta',
                rozwiazanie: desc.trim(),
                naprawionePrzez: userName,
                dataNaprawy: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (data.zgloszonePrzez) {
                await db.collection('powiadomienia').add({
                    uzytkownik: data.zgloszonePrzez,
                    wiadomosc: `Usterka w sali ${roomId} została zamknięta. Opis naprawy: ${desc.trim()}`,
                    odczytane: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await db.collection('logi_usterek').add({
            roomId: roomId,
            akcja: 'NAPRAWA',
            opis: desc.trim(),
            uzytkownik: userName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        addLiveLog("NAPRAWA", roomId, userName, `Rozwiązano usterkę: ${desc.trim()}`);
        showAppAlert(`Usterka w sali ${roomId} została oznaczona jako naprawiona.`, 'success');
    }
}

function renderWykladowcaRooms() {
    const listDiv = document.getElementById('wykladowca-rooms-list');
    if (!listDiv) return;

    const reqProjector = document.getElementById('req-projector') ? document.getElementById('req-projector').checked : false;
    const minCapacity = document.getElementById('min-capacity') ? parseInt(document.getElementById('min-capacity').value) || 0 : 0;
    const myName = localStorage.getItem('classSpaceUserName');

    listDiv.innerHTML = '';
    const filteredRooms = rooms.filter(room => {
        if (reqProjector && !room.hasProjector) return false;
        if (room.capacity < minCapacity) return false;
        return true;
    });

    if (filteredRooms.length === 0) {
        listDiv.innerHTML = '<div style="color: var(--text-muted); padding: 10px;">Brak sal spełniających kryteria filtracji.</div>';
        return;
    }

    filteredRooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        const isMyBooking = (room.bookedBy === myName);

        let btnHtml = '';
        if (isMyBooking) {
            btnHtml = `<div style="display: flex; gap: 8px;">
                <button class="btn btn-return" onclick="reportIssue('${room.id}')">Usterka</button>
                <button class="btn btn-cancel" onclick="cancelRoom('${room.id}', 'wykladowca')">Anuluj</button>
            </div>`;
        } else if (room.isBooked) {
            btnHtml = `<span class="badge badge-taken">Zajęta: ${room.subject}</span>`;
        } else {
            btnHtml = `<button class="btn btn-reserve" onclick="bookRoom('${room.id}')">Rezerwuj</button>`;
        }

        card.innerHTML = `
            <div class="room-info">
                <h3>SALA ${room.id}</h3>
                <p>Typ: ${room.type} | Pojemność: ${room.capacity} osób</p>
                ${room.hasIssue ? `<p style="color: var(--danger); font-size: 12px; margin-top: 5px;"><strong>Usterka:</strong> ${room.issueDesc}</p>` : ''}
            </div>
            <div>${btnHtml}</div>`;
        listDiv.appendChild(card);
    });
}

function renderPortierniaRooms() {
    const issuesListDiv = document.getElementById('portiernia-issues-list');
    const roomsListDiv = document.getElementById('portiernia-rooms-list');
    if (!issuesListDiv || !roomsListDiv) return;

    issuesListDiv.innerHTML = '';
    roomsListDiv.innerHTML = '';

    const roomsWithIssues = rooms.filter(room => room.hasIssue);
    if (roomsWithIssues.length === 0) {
        issuesListDiv.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Brak aktywnych zgłoszeń serwisowych.</div>';
    } else {
        roomsWithIssues.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card issue-card';
            card.innerHTML = `
                <div class="room-info" style="flex: 1;">
                    <h3 style="color: var(--text-main);">SALA ${room.id}</h3>
                    <p style="margin: 5px 0;"><strong>Zgłoszenie:</strong> ${room.issueDesc}</p>
                </div>
                <div><button class="btn btn-return" onclick="resolveIssue('${room.id}')">Zakończ usterkę</button></div>`;
            issuesListDiv.appendChild(card);
        });
    }

    const bookedRooms = rooms.filter(room => room.isBooked);
    if (bookedRooms.length === 0) {
        roomsListDiv.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted);">Brak aktywnych rezerwacji kluczy.</div>';
        return;
    }

    bookedRooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div class="room-info" style="flex: 1;">
                    <h3>SALA ${room.id}</h3>
                    <p style="margin: 5px 0;">Osoba: <strong>${room.bookedBy}</strong></p>
                    <p style="margin-bottom: 5px;">Temat: ${room.subject} | Godziny: <strong>${room.time}</strong></p>
                </div>
                <div><button class="btn btn-return" onclick="cancelRoom('${room.id}', 'portiernia')">Zakończ</button></div>
            </div>`;
        roomsListDiv.appendChild(card);
    });
}

async function bookRoom(roomId) {
    const nameInput = document.getElementById('user-name');
    const subjectInput = document.getElementById('booking-subject');

    const name = nameInput.value.trim();
    const subject = subjectInput.value.trim();
    const startTime = document.getElementById('search-time').value;
    const duration = document.getElementById('search-duration').value;

    if (!name || !subject) {
        showAppAlert('Wypełnij Imię i Temat zajęć.', 'danger');
        return;
    }

    const endTime = calculateEndTime(startTime, duration);

    try {
        await db.collection('rezerwacje').add({
            roomId: roomId,
            userName: name,
            subject: subject,
            startTime: startTime,
            endTime: endTime,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('sale').doc(roomId).update({
            isBooked: true,
            bookedBy: name,
            subject: subject,
            time: `${startTime} - ${endTime}`
        });

        addLiveLog("REZERWACJA", roomId, name, `Zajęcia: ${subject} (${startTime}-${endTime})`);
        showAppAlert(`Operacja udana. Sala ${roomId} zarezerwowana.`, 'success');
    } catch (e) {
        console.error(e);
        showAppAlert("Błąd bazy danych.", "danger");
    }
}

async function cancelRoom(roomId, source) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const user = room.bookedBy || "Nieznany";

    await db.collection('sale').doc(roomId).update({
        isBooked: false,
        bookedBy: '',
        subject: '',
        time: ''
    });

    addLiveLog("OPUSZCZENIE", roomId, user, `Zwolnione przez moduł: ${source}`);
    if (source === 'wykladowca') showAppAlert(`Rezerwacja sali ${roomId} anulowana.`, 'success');
}

async function adminClearAll() {
    if (!confirm("Czy na pewno chcesz zresetować wszystkie sale do stanu domyślnego?")) return;
    try {
        const batch = db.batch();
        rooms.forEach(room => {
            const roomRef = db.collection('sale').doc(room.id);
            batch.update(roomRef, {
                isBooked: false,
                bookedBy: '',
                subject: '',
                time: '',
                hasIssue: false,
                issueDesc: ''
            });
        });
        await batch.commit();
        const userName = localStorage.getItem('classSpaceUserName') || "Admin";
        addLiveLog("RESET", "WSZYSTKIE", userName, "Twardy reset bazy danych sal.");
        showAppAlert("Wszystkie rezerwacje i usterki zostały pomyślnie wyczyszczone.", "success");
    } catch (e) {
        console.error(e);
        showAppAlert("Błąd podczas resetowania bazy.", "danger");
    }
}

async function checkNotifications() {
    const myName = localStorage.getItem('classSpaceUserName');
    if (!myName || typeof db === 'undefined') return;

    try {
        const snapshot = await db.collection('powiadomienia')
            .where('uzytkownik', '==', myName)
            .where('odczytane', '==', false)
            .get();

        if (!snapshot.empty) {
            let wiadomosci = [];
            snapshot.forEach(doc => {
                wiadomosci.push(doc.data().wiadomosc);
                db.collection('powiadomienia').doc(doc.id).update({ odczytane: true });
            });
            showAppAlert("Masz nowe powiadomienia:\n" + wiadomosci.join("\n"), 'success');
        }
    } catch (e) {
        console.error(e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('classSpaceTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (document.getElementById('login-page')) generateCaptcha('login');

    if (document.getElementById('app-page')) {
        initAndSyncRooms();
        loadLogsFromFirebase();
        initDateTime();

        const savedName = localStorage.getItem('classSpaceUserName');
        if (savedName && document.getElementById('user-name')) {
            document.getElementById('user-name').value = savedName;
            document.getElementById('user-name').disabled = true;
        }

        const savedRole = localStorage.getItem('classSpaceUserRole') || 'wykladowca';
        if (savedRole === 'admin') {
            document.getElementById('btn-wykladowca').style.display = 'block';
            document.getElementById('btn-portiernia').style.display = 'block';
            document.getElementById('btn-admin').style.display = 'block';
            switchAppRole('admin');
        } else if (savedRole === 'portiernia') {
            document.getElementById('btn-wykladowca').style.display = 'none';
            document.getElementById('btn-admin').style.display = 'none';
            switchAppRole('portiernia');
        } else {
            document.getElementById('btn-portiernia').style.display = 'none';
            document.getElementById('btn-admin').style.display = 'none';
            switchAppRole('wykladowca');
        }

        setTimeout(checkNotifications, 1500);
    }
});

function exportToCSV() {
    if (!auditLogs || auditLogs.length === 0) {
        showAppAlert("Brak logów systemowych dostępnych do wyeksportowania.", "warning");
        return;
    }

    let csvContent = "Wpis Historii Działań Systemowych\n";

    auditLogs.forEach(log => {
        const safeLog = log.replace(/"/g, '""');
        csvContent += `"${safeLog}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "logi_systemowe_classspace.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);

    showAppAlert("Pomyślnie wyeksportowano logi do pliku CSV.", "success");
}
