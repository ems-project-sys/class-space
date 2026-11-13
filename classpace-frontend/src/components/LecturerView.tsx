import { useEffect, useMemo, useState } from 'react';
import { ApiService } from '../apiService.js';
import InlineNotice from './InlineNotice';

const ROOM_TYPES = ['Wykładowa', 'Aula', 'Ćwiczeniowa', 'Lab. Komputerowe'];

interface Room {
    id: string;
    type: string;
    capacity: number;
    hasProjector: boolean;
    hasIssue: boolean;
    issueDesc: string;
}

interface Reservation {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    room: { id: string; type: string; capacity: number; hasProjector: boolean };
}

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

const calculateEndTime = (start: string, duration: string) => {
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + Number(duration);
    return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
};

export default function LecturerView({ onLogout }: { onLogout: () => void }) {
    const userName = localStorage.getItem('classSpaceUserName') || 'Nieznany';
    const [theme, setTheme] = useState<'light' | 'dark'>(
        (localStorage.getItem('classSpaceTheme') as 'light' | 'dark') || 'light',
    );
    const [rooms, setRooms] = useState<Room[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [needsProjector, setNeedsProjector] = useState(false);
    const [requiredCapacity, setRequiredCapacity] = useState('');
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [time, setTime] = useState('08:00');
    const [duration, setDuration] = useState('90');
    const [assistantPrompt, setAssistantPrompt] = useState('');
    const [assistantFeedback, setAssistantFeedback] = useState<string | null>(null);
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [subject, setSubject] = useState('');
    const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('classSpaceTheme', theme);
    }, [theme]);

    const loadData = async () => {
        if (!date || !time || !duration) return;
        try {
            const endTime = calculateEndTime(time, duration);
            const [availableRooms, myReservations] = await Promise.all([
                ApiService.fetchAvailableRooms(date, time, endTime),
                ApiService.fetchMyReservations(),
            ]);
            setRooms(availableRooms);
            setReservations(myReservations);
        } catch (error: unknown) {
            setNotice({ message: getErrorMessage(error, 'Nie udało się pobrać danych.'), type: 'error' });
        }
    };

    useEffect(() => {
        let active = true;
        const fetchData = async () => {
            if (!date || !time || !duration) return;
            try {
                const endTime = calculateEndTime(time, duration);
                const [availableRooms, myReservations] = await Promise.all([
                    ApiService.fetchAvailableRooms(date, time, endTime),
                    ApiService.fetchMyReservations(),
                ]);
                if (active) {
                    setRooms(availableRooms);
                    setReservations(myReservations);
                }
            } catch (error: unknown) {
                if (active) {
                    setNotice({ message: getErrorMessage(error, 'Nie udało się pobrać danych.'), type: 'error' });
                }
            }
        };
        void fetchData();
        return () => {
            active = false;
        };
    }, [date, time, duration]);

    const handleAssistantQuery = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!assistantPrompt.trim()) return;

        setIsAssistantLoading(true);
        setAssistantFeedback(null);
        try {
            const { filters } = await ApiService.parseRoomPrompt(assistantPrompt);
            setNeedsProjector(filters.needsProjector);
            setSelectedType(filters.type);
            setRequiredCapacity(filters.capacity ? String(filters.capacity) : '');
            const feedback = [
                filters.needsProjector ? 'Rzutnik: wymagany' : null,
                filters.type ? `Typ: ${filters.type}` : null,
                filters.capacity ? `Miejsca: min. ${filters.capacity}` : null,
            ].filter(Boolean);
            setAssistantFeedback(feedback.length > 0 ? `Zastosowano: ${feedback.join(', ')}` : 'Nie rozpoznano wymagań.');
        } catch (error: unknown) {
            setAssistantFeedback(getErrorMessage(error, 'Nie udało się połączyć z asystentem.'));
        } finally {
            setIsAssistantLoading(false);
        }
    };

    const filteredRooms = useMemo(() => rooms.filter((room) => (
        (!selectedType || room.type.includes(selectedType === 'Lab. Komputerowe' ? 'Laboratorium' : selectedType)) &&
        (!needsProjector || room.hasProjector) &&
        (!requiredCapacity || room.capacity >= Number(requiredCapacity))
    )), [rooms, selectedType, needsProjector, requiredCapacity]);

    const handleBooking = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedRoom || !subject.trim()) return;

        try {
            await ApiService.bookRoom(
                selectedRoom.id,
                date,
                subject.trim(),
                time,
                calculateEndTime(time, duration),
            );
            setSelectedRoom(null);
            setSubject('');
            setNotice({ message: `Pomyślnie zarezerwowano salę ${selectedRoom.id}.`, type: 'success' });
            await loadData();
        } catch (error: unknown) {
            setNotice({ message: getErrorMessage(error, 'Nie udało się zarezerwować sali.'), type: 'error' });
        }
    };

    const cancelReservation = async (reservationId: string) => {
        try {
            await ApiService.cancelRoom(reservationId);
            setNotice({ message: 'Rezerwacja została anulowana.', type: 'success' });
            await loadData();
        } catch (error: unknown) {
            setNotice({ message: getErrorMessage(error, 'Nie udało się anulować rezerwacji.'), type: 'error' });
        }
    };

    return (
        <div className="lecturer-dashboard">
            <div className="header lecturer-header">
                <div>
                    <h1>Witaj {userName}!</h1>
                    <p>System Rezerwacji ClassSpace</p>
                </div>
                <div className="header-actions">
                    <div className="theme-switcher">
                        <button className={`btn ${theme === 'light' ? 'btn-primary' : ''}`} onClick={() => setTheme('light')}>Jasny</button>
                        <button className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`} onClick={() => setTheme('dark')}>Ciemny</button>
                    </div>
                    <button className="btn btn-logout" onClick={onLogout}>Wyloguj</button>
                </div>
            </div>

            <InlineNotice message={notice?.message || null} type={notice?.type || 'info'} />

            <div className="ai-bar">
                <h3>✨ Asystent AI</h3>
                <form onSubmit={handleAssistantQuery} className="ai-input-wrapper">
                    <input
                        className="ai-input"
                        value={assistantPrompt}
                        onChange={(event) => setAssistantPrompt(event.target.value)}
                        placeholder="W czym mogę pomóc?"
                    />
                    <button type="submit" className="btn-ai" disabled={isAssistantLoading}>Szukaj</button>
                </form>
                {isAssistantLoading && <div className="ai-status"><span className="spinner" /> Model analizuje zapytanie...</div>}
                {assistantFeedback && !isAssistantLoading && <div className="ai-status ai-success">{assistantFeedback}</div>}
            </div>

            <div className="filter-bar">
                <div className="filter-pills">
                    {ROOM_TYPES.map((type) => (
                        <button
                            key={type}
                            className={`pill ${selectedType === type ? 'active' : ''}`}
                            onClick={() => setSelectedType(selectedType === type ? null : type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="divider" />
                <button className={`pill ${needsProjector ? 'active' : ''}`} onClick={() => setNeedsProjector(!needsProjector)}>
                    🎥 Rzutnik
                </button>
                <div className="divider" />
                <label className="capacity-filter">
                    Studenci:
                    <input type="number" min="1" placeholder="Min." value={requiredCapacity} onChange={(event) => setRequiredCapacity(event.target.value)} />
                </label>
            </div>

            <div className="booking-date-bar">
                <label>Data <input type="date" value={date} min={new Date().toLocaleDateString('en-CA')} onChange={(event) => setDate(event.target.value)} /></label>
                <label>Godzina <select value={time} onChange={(event) => setTime(event.target.value)}>
                    {['08:00', '09:45', '11:30', '13:15', '15:00', '16:45', '18:30', '20:15'].map((slot) => <option key={slot}>{slot}</option>)}
                </select></label>
                <label>Czas trwania <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                    <option value="45">45 min</option><option value="90">90 min</option><option value="180">180 min</option>
                </select></label>
            </div>

            <div className="section-title">Dostępne sale</div>
            <div className="grid">
                {filteredRooms.map((room) => (
                    <button key={room.id} className="card room-card-button" onClick={() => setSelectedRoom(room)}>
                        <h3>Sala {room.id}</h3>
                        <p>{room.type}</p>
                        <div className="room-card-meta">
                            <span>👨‍🎓 {room.capacity} os.</span>
                            <span>🎥 {room.hasProjector ? 'Rzutnik' : 'Brak'}</span>
                        </div>
                    </button>
                ))}
                {filteredRooms.length === 0 && <div className="empty-rooms">Nie znaleziono sal spełniających kryteria.</div>}
            </div>

            <div className="section-title reservation-heading">Moje rezerwacje</div>
            <div className="reservation-list">
                {reservations.length === 0 ? <p className="reservation-empty">Nie masz jeszcze aktywnych rezerwacji.</p> : reservations.map((reservation) => (
                    <div className="reservation-card" key={reservation.id}>
                        <div>
                            <h3>Sala {reservation.room.id}</h3>
                            <p>{reservation.room.type} | {reservation.room.capacity} osób</p>
                            <p><strong>{reservation.date}</strong> | {reservation.startTime} - {reservation.endTime}</p>
                            <p>Temat: {reservation.subject}</p>
                        </div>
                        <button className="btn btn-return" onClick={() => void cancelReservation(reservation.id)}>Anuluj</button>
                    </div>
                ))}
            </div>

            {selectedRoom && (
                <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
                    <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedRoom(null)}>&times;</button>
                        <h2>Sala {selectedRoom.id}</h2>
                        <p className="modal-room-details">{selectedRoom.type} | {selectedRoom.capacity} osób | {selectedRoom.hasProjector ? 'Rzutnik' : 'Brak rzutnika'}</p>
                        <div className="timeline-container"><strong>Dostępność sali</strong><div className="timeline-bar"><div className="time-slot slot-free" /><div className="time-slot slot-booked" /><div className="time-slot slot-free" /><div className="time-slot slot-free" /></div></div>
                        <form onSubmit={handleBooking}>
                            <div className="form-group"><label>Przedmiot</label><input className="form-input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="np. Algorytmy" required /></div>
                            <div className="modal-booking-summary"><span>{date}</span><span>{time} - {calculateEndTime(time, duration)}</span></div>
                            <button type="submit" className="btn btn-primary modal-submit">Zatwierdź rezerwację</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
