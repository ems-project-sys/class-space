// ==========================================
// apiService.js - Database Communication Layer
// ==========================================

// 1. Database Configuration and Initialization (Only here!)
const firebaseConfig = {
    apiKey: "AIzaSyAYMzJvCR17JzfHvMuLuF_aGmptu0derGU",
    authDomain: "classspace-faeb3.firebaseapp.com",
    projectId: "classspace-faeb3",
    storageBucket: "classspace-faeb3.firebasestorage.app",
    messagingSenderId: "402654981974",
    appId: "1:402654981974:web:f8011e1fe8022d421130f7",
    measurementId: "G-7NT2WYYT21"
};

// Check if Firebase is loaded from HTML file
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// 2. Internal helper functions (Invisible to the rest of the application)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3. Our main Service (API Interface)
export const ApiService = {

    // ------------------------------------------
    // AUTHORIZATION (LOGIN / REGISTRATION)
    // ------------------------------------------
    
    loginUser: async (email, password) => {
        if (!db) throw new Error("No database connection.");
        
        const hashedPassword = await hashPassword(password);
        const userDoc = await db.collection('users').doc(email).get();

        if (!userDoc.exists || userDoc.data().password !== hashedPassword) {
            throw new Error("Invalid email address or password.");
        }
        return userDoc.data();
    },

    registerUser: async (name, email, password, role) => {
        if (!db) throw new Error("No database connection.");

        const userRef = db.collection('users').doc(email);
        const docSnap = await userRef.get();
        
        if (docSnap.exists) {
            throw new Error("Account with this email already exists.");
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
    // ROOM MANAGEMENT (RESERVATIONS)
    // ------------------------------------------

    // Function returning live rooms list
    subscribeToRooms: (onRoomsUpdatedCallback) => {
        if (!db) return;
        return db.collection('sale').onSnapshot(snapshot => {
            const rooms = [];
            snapshot.forEach(doc => rooms.push(doc.data()));
            onRoomsUpdatedCallback(rooms);
        });
    },

    // Initialize default rooms if database is empty
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
            console.log("Default rooms initialization in Firebase finished.");
        }
    },

    // Fetching available rooms based on date and time (for calendar)
    fetchAvailableRooms: async (targetDate, targetStartTime, targetEndTime) => {
        try {
            const response = await fetch(`http://localhost:3000/api/rooms/available?date=${targetDate}&startTime=${targetStartTime}&endTime=${targetEndTime}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching available rooms:", error);
            return [];
        }
    },

    bookRoom: async (roomId, userName, subject, startTime, endTime) => {
        if (!db) throw new Error("No database connection.");
        
        // Save to reservation history
        await db.collection('rezerwacje').add({
            roomId: roomId,
            userName: userName,
            subject: subject,
            startTime: startTime,
            endTime: endTime,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update physical room status
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
    // ISSUES AND REPORTS
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

        // Reset issue status in room
        await db.collection('sale').doc(roomId).update({
            hasIssue: false,
            issueDesc: ''
        });

        // Search and close open reports
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

            // Send notification to the reporter
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
    // ADMINISTRATION AND LOGS
    // ------------------------------------------

    resetAllRooms: async (roomsArray) => {
        if (!db) throw new Error("No database connection.");
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