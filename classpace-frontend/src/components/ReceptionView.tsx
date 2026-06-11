import { useState, useEffect } from 'react';
import { ApiService } from '../apiService.js';

interface Room {
    id: string;
    type: string;
    capacity: number;
    hasProjector: boolean;
    isBooked: boolean;
    bookedBy: string;
    time: string;
    subject: string;
    hasIssue: boolean;
    issueDesc: string;
}

export default function ReceptionView() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentTime, setCurrentTime] = useState<string>('');
    const userName = localStorage.getItem('classSpaceUserName') || 'Portiernia';

    useEffect(() => {
        // Subskrypcja na salę
        const unsubscribe = ApiService.subscribeToRooms((fetchedRooms: Room[]) => {
            setRooms(fetchedRooms);
        });

        // "Żywy" zegar odświeżany co sekundę
        const timerInterval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('pl-PL'));
        }, 1000);

        // Sprzątanie procesów w tle, gdy komponent zostanie zamknięty
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
            clearInterval(timerInterval);
        };
    }, []);

    const handleResolveIssue = async (roomId: string) => {
        const resolutionDescription = prompt(`Zamykasz usterkę w sali ${roomId}.\nPodaj krótki opis naprawy (np. "Wymieniono kabel HDMI"):`);
        if (resolutionDescription && resolutionDescription.trim() !== '') {
            try {
                await ApiService.resolveIssue(roomId, resolutionDescription.trim(), userName);
                alert(`Usterka w sali ${roomId} została oznaczona jako naprawiona.`);
            } catch (error: any) {
                alert(error.message || "Błąd podczas rozwiązywania usterki.");
            }
        }
    };

    const handleCancelBooking = async (roomId: string) => {
        try {
            await ApiService.cancelRoom(roomId);
            await ApiService.addSystemLog("OPUSZCZENIE", roomId, userName, `Zwolnione przez moduł: Portiernia`);
            alert(`Zakończono rezerwację dla sali ${roomId}.`);
        } catch (error: any) {
            alert("Błąd podczas kończenia rezerwacji.");
        }
    };

    const roomsWithIssues = rooms.filter(room => room.hasIssue);
    const bookedRooms = rooms.filter(room => room.isBooked);

    return (
        <div className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>Panel Zarządzania</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--success)', fontWeight: '600' }}>Zgłoszenia zsynchronizowane w bazie.</p>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {currentTime}
                </div>
            </div>

            <div className="section-title">Zgłoszenia serwisowe z sal</div>
            <div style={{ marginBottom: '50px' }}>
                {roomsWithIssues.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Brak aktywnych zgłoszeń serwisowych.</div>
                ) : (
                    roomsWithIssues.map(room => (
                        <div key={room.id} className="room-card issue-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                            <div className="room-info" style={{ flex: 1 }}>
                                <h3 style={{ color: 'var(--text-main)' }}>SALA {room.id}</h3>
                                <p style={{ margin: '5px 0' }}><strong>Zgłoszenie:</strong> {room.issueDesc}</p>
                            </div>
                            <div>
                                <button className="btn btn-return" onClick={() => handleResolveIssue(room.id)}>Zakończ usterkę</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="section-title">Klucze w użyciu (Zajęcia)</div>
            <div>
                {bookedRooms.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Brak aktywnych rezerwacji kluczy.</div>
                ) : (
                    bookedRooms.map(room => (
                        <div key={room.id} className="room-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div className="room-info" style={{ flex: 1 }}>
                                    <h3>SALA {room.id}</h3>
                                    <p style={{ margin: '5px 0' }}>Osoba: <strong>{room.bookedBy}</strong></p>
                                    <p style={{ marginBottom: '5px' }}>Temat: {room.subject} | Godziny: <strong>{room.time}</strong></p>
                                </div>
                                <div>
                                    <button className="btn btn-return" onClick={() => handleCancelBooking(room.id)}>Zakończ</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}