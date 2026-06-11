// ==========================================
// apiService.js - Warstwa Komunikacji z Bazą Danych
// ==========================================

// 1. Konfiguracja i Inicjalizacja Bazy (Tylko tutaj!)
const firebaseConfig = {
    apiKey: "AIzaSyAYMzJvCR17JzfHvMuLuF_aGmptu0derGU",
    authDomain: "classspace-faeb3.firebaseapp.com",
    projectId: "classspace-faeb3",
    storageBucket: "classspace-faeb3.firebasestorage.app",
    messagingSenderId: "402654981974",
    appId: "1:402654981974:web:f8011e1fe8022d421130f7",
    measurementId: "G-7NT2WYYT21"
};

// Sprawdzamy, czy Firebase został załadowany z pliku HTML
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// 2. Wewnętrzne funkcje pomocnicze (Niewidoczne dla reszty aplikacji)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3. Nasz główny Serwis (Interfejs API)
export const ApiService = {

    // ------------------------------------------
    // AUTORYZACJA (LOGIN / REJESTRACJA)
    // ------------------------------------------
    
    loginUser: async (email, password) => {
        if (!db) throw new Error("Brak połączenia z bazą danych.");
        
        const hashedPassword = await hashPassword(password);
        const userDoc = await db.collection('users').doc(email).get();

        if (!userDoc.exists || userDoc.data().password !== hashedPassword) {
            throw new Error("Błędny adres e-mail lub hasło.");
        }
        return userDoc.data();
    },

    registerUser: async (name, email, password, role) => {
        if (!db) throw new Error("Brak połączenia z bazą danych.");

        const userRef = db.collection('users').doc(email);
        const docSnap = await userRef.get();
        
        if (docSnap.exists) {
            throw new Error("Konto z tym adresem e-mail już istnieje.");
        }

        const hashedPassword = await hashPassword(password);
        await userRef.set({
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return true;
    },

    // ------------------------------------------
    // ZARZĄDZANIE SALAMI (REZERWACJE)
    // ------------------------------------------

    // Funkcja pobierająca listę sal "na żywo"
    subscribeToRooms: (onRoomsUpdatedCallback) => {
        if (!db) return;
        return db.collection('sale').onSnapshot(snapshot => {
            const rooms = [];
            snapshot.forEach(doc => rooms.push(doc.data()));
            onRoomsUpdatedCallback(rooms);
        });
    },

    // Inicjalizacja domyślnych sal, jeśli baza jest pusta
    initDefaultRooms: async (defaultRoomsData) => {
        if (!db) return;
        const snapshot = await db.collection('sale').get();
        if (snapshot.empty) {
            const batch = db.batch();
            defaultRoomsData.forEach(room => {
                const roomRef = db.collection('sale').doc(room.id);
                batch.set(roomRef, room);
            });
            await batch.commit();
            console.log("Inicjalizacja domyślnych sal w Firebase zakończona.");
        }
    },

    bookRoom: async (roomId, userName, subject, startTime, endTime) => {
        if (!db) throw new Error("Brak połączenia z bazą danych.");
        
        // Zapis do historii rezerwacji
        await db.collection('rezerwacje').add({
            roomId: roomId,
            userName: userName,
            subject: subject,
            startTime: startTime,
            endTime: endTime,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Aktualizacja statusu fizycznej sali
        await db.collection('sale').doc(roomId).update({
            isBooked: true,
            bookedBy: userName,
            subject: subject,
            time: `${startTime} - ${endTime}`
        });
    },

    cancelRoom: async (roomId) => {
        if (!db) return;
        await db.collection('sale').doc(roomId).update({
            isBooked: false,
            bookedBy: '',
            subject: '',
            time: ''
        });
    },

    // ------------------------------------------
    // USTERKI I ZGŁOSZENIA
    // ------------------------------------------

    reportIssue: async (roomId, desc, userName) => {
        if (!db) return;
        
        await db.collection('awarie').add({
            roomId: roomId,
            opis: desc,
            zgloszonePrzez: userName,
            status: 'Otwarta',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('sale').doc(roomId).update({
            hasIssue: true,
            issueDesc: desc
        });

        await db.collection('logi_usterek').add({
            roomId: roomId,
            akcja: 'ZGŁOSZENIE',
            opis: desc,
            uzytkownik: userName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    resolveIssue: async (roomId, desc, userName) => {
        if (!db) return;

        // Resetowanie błędu w sali
        await db.collection('sale').doc(roomId).update({
            hasIssue: false,
            issueDesc: ''
        });

        // Wyszukanie i zamknięcie otwartych zgłoszeń
        const awarieSnapshot = await db.collection('awarie')
            .where('roomId', '==', roomId)
            .where('status', '==', 'Otwarta')
            .get();

        for (const doc of awarieSnapshot.docs) {
            const data = doc.data();
            
            await db.collection('awarie').doc(doc.id).update({
                status: 'Zamknięta',
                rozwiazanie: desc,
                naprawionePrzez: userName,
                dataNaprawy: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Wysłanie powiadomienia do zgłaszającego
            if (data.zgloszonePrzez) {
                await db.collection('powiadomienia').add({
                    uzytkownik: data.zgloszonePrzez,
                    wiadomosc: `Usterka w sali ${roomId} została zamknięta. Opis naprawy: ${desc}`,
                    odczytane: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        await db.collection('logi_usterek').add({
            roomId: roomId,
            akcja: 'NAPRAWA',
            opis: desc,
            uzytkownik: userName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // ------------------------------------------
    // ADMINISTRACJA I LOGI
    // ------------------------------------------

    resetAllRooms: async (roomsArray) => {
        if (!db) throw new Error("Brak połączenia z bazą danych.");
        const batch = db.batch();
        roomsArray.forEach(room => {
            const roomRef = db.collection('sale').doc(room.id);
            batch.update(roomRef, {
                isBooked: false, bookedBy: '', subject: '', time: '',
                hasIssue: false, issueDesc: ''
            });
        });
        await batch.commit();
    },

    subscribeToLogs: (onLogsUpdatedCallback) => {
        if (!db) return;
        return db.collection('logs').orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
            const logs = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                logs.push(`[${data.time}] ${data.action}: ${data.user} | Sala: ${data.room} | ${data.details}`);
            });
            onLogsUpdatedCallback(logs);
        });
    },

    addSystemLog: async (action, roomId, user, details = "") => {
        if (!db) return;
        const timeString = new Date().toLocaleString('pl-PL');
        await db.collection("logs").add({
            time: timeString,
            action: action,
            room: roomId,
            user: user,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    fetchAndClearNotifications: async (userName) => {
        if (!db) return [];
        const snapshot = await db.collection('powiadomienia')
            .where('uzytkownik', '==', userName)
            .where('odczytane', '==', false)
            .get();

        if (snapshot.empty) return [];

        let wiadomosci = [];
        snapshot.forEach(doc => {
            wiadomosci.push(doc.data().wiadomosc);
            db.collection('powiadomienia').doc(doc.id).update({ odczytane: true });
        });

        return wiadomosci;
    }
};