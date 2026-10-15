import { useState, useEffect } from 'react';
import { ApiService } from '../apiService.js';
import InlineNotice from './InlineNotice';

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

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
    room: {
        id: string;
        type: string;
        capacity: number;
        hasProjector: boolean;
    };
}

const campusLayout = {
    'Piętro 3': ['301', '302'],
    'Piętro 2': ['205'],
    'Piętro 1': ['101', '102', 'LAB_1'],
    'Parter': ['AULA_A', 'SPORT']
};

export default function LecturerView() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [myReservations, setMyReservations] = useState<Reservation[]>([]);
    const userName = localStorage.getItem('classSpaceUserName') || 'Nieznany';

    const [subject, setSubject] = useState('');
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [time, setTime] = useState(() => `${String((new Date().getHours() + 1) % 24).padStart(2, '0')}:00`);
    const [duration, setDuration] = useState('90');
    const [minCapacity, setMinCapacity] = useState(10);
    const [reqProjector, setReqProjector] = useState(false);
    const [roomType, setRoomType] = useState<string | null>(null);
    const [assistantPrompt, setAssistantPrompt] = useState('');
    const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    
    const [selectedMapRoomId, setSelectedMapRoomId] = useState<string | null>(null);

    const calculateEndTime = (start: string, durationMin: string) => {
        if (!start) return '';
        let [hours, minutes] = start.split(':').map(Number);
        minutes += parseInt(durationMin);
        hours += Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    };

    const loadMyReservations = async () => {
        try {
            setMyReservations(await ApiService.fetchMyReservations());
        } catch {
            setMyReservations([]);
        }
    };

    useEffect(() => {
        const fetchReservations = async () => {
            await loadMyReservations();
        };

        void fetchReservations();
    }, []);

    useEffect(() => {
        const fetchAvailableRooms = async () => {
            if (!date || !time || !duration) return;
            const endTime = calculateEndTime(time, duration);
            const availableRooms = await ApiService.fetchAvailableRooms(date, time, endTime);
            setRooms(availableRooms);
            await loadMyReservations();
            setSelectedMapRoomId(null); 
        };
        fetchAvailableRooms();
    }, [date, time, duration, minCapacity, reqProjector]);

    const handleBookRoom = async (roomId: string) => {
        if (!subject.trim()) {
            setNotice({ message: 'Wypełnij temat zajęć przed rezerwacją.', type: 'error' });
            return;
        }
        const endTime = calculateEndTime(time, duration);
        try {
            await ApiService.bookRoom(roomId, date, subject, time, endTime);

            const [availableRooms] = await Promise.all([
                ApiService.fetchAvailableRooms(date, time, endTime),
                loadMyReservations(),
            ]);
            setRooms(availableRooms);
            
            setSelectedMapRoomId(null);
            setSubject(''); 
            setNotice({ message: `Pomyślnie zarezerwowano salę ${roomId}.`, type: 'success' });
        } catch (error: unknown) {
            setNotice({ message: getErrorMessage(error, 'Błąd rezerwacji.'), type: 'error' });
        }
    };

    const handleReportIssue = async (roomId: string) => {
        const issueDescription = prompt(`Zgłaszasz usterkę w Sali ${roomId}.\nKrótko opisz problem:`);
        if (issueDescription && issueDescription.trim() !== '') {
            try {
                await ApiService.reportIssue(roomId, issueDescription.trim());
                setNotice({ message: 'Zgłoszono usterkę.', type: 'success' });
            } catch {
                setNotice({ message: 'Błąd zgłaszania usterki.', type: 'error' });
            }
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        try {
            await ApiService.cancelRoom(reservationId);
            const [availableRooms] = await Promise.all([
                ApiService.fetchAvailableRooms(date, time, calculateEndTime(time, duration)),
                loadMyReservations(),
            ]);
            setRooms(availableRooms);
            setNotice({ message: 'Rezerwacja została anulowana.', type: 'success' });
        } catch (error: unknown) {
            setNotice({ message: getErrorMessage(error, 'Nie udało się anulować rezerwacji.'), type: 'error' });
        }
    };

    const handleAssistantQuery = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!assistantPrompt.trim()) return;

        setIsAssistantLoading(true);
        setAssistantMessage(null);

        try {
            const response = await ApiService.parseRoomPrompt(assistantPrompt);
            const { filters } = response;

            setReqProjector(filters.needsProjector);
            setRoomType(filters.type);
            if (filters.capacity !== null) {
                setMinCapacity(filters.capacity);
            }

            const appliedFilters = [
                filters.needsProjector ? 'rzutnik' : null,
                filters.type,
                filters.capacity ? `min. ${filters.capacity} osób` : null,
            ].filter(Boolean);
            setAssistantMessage(
                appliedFilters.length > 0
                    ? `Zastosowano: ${appliedFilters.join(', ')}`
                    : 'Nie rozpoznano konkretnych filtrów.',
            );
        } catch (error: unknown) {
            setAssistantMessage(getErrorMessage(error, 'Nie udało się przeanalizować zapytania.'));
        } finally {
            setIsAssistantLoading(false);
        }
    };

    const matchesRoomType = (room: Room) => {
        if (!roomType) return true;
        if (roomType === 'Aula') return room.type.includes('Aula');
        if (roomType === 'Wykładowa') return room.type.includes('Wykładowa');
        if (roomType === 'Ćwiczeniowa') return room.type.includes('Ćwiczeniowa');
        if (roomType === 'Lab. Komputerowe') return room.type.includes('Laboratorium');
        return true;
    };

    const renderMap = () => {
        return Object.entries(campusLayout).map(([floorName, roomIds]) => (
            <div key={floorName} className="map-floor">
                <div className="map-floor-title">{floorName}</div>
                <div className="floor-grid">
                    {roomIds.map(id => {
                        const room = rooms.find(r => r.id === id);
                        const extraStyle = (id === 'AULA_A' || id === 'SPORT') ? { gridColumn: 'span 2' } : {};

                        const isAvailable = room && room.capacity >= minCapacity && (!reqProjector || room.hasProjector) && matchesRoomType(room);

                        let statusClass = 'status-taken'; 
                        if (isAvailable && !room.hasIssue) statusClass = 'status-free';
                        if (isAvailable && room.hasIssue) statusClass = 'status-issue';
                        if (selectedMapRoomId === id && isAvailable) statusClass = 'status-selected';

                        return (
                            <div 
                                key={id} 
                                className={`map-room ${statusClass}`} 
                                style={extraStyle}
                                onClick={() => isAvailable ? setSelectedMapRoomId(selectedMapRoomId === id ? null : id) : null}
                            >
                                {id}
                                {room && <small>{room.type}</small>}
                            </div>
                        );
                    })}
                </div>
            </div>
        ));
    };

    const filteredRooms = rooms.filter(room => room.capacity >= minCapacity && (!reqProjector || room.hasProjector) && matchesRoomType(room));

    return (
        <div className="view-section active">
            <InlineNotice message={notice?.message || null} type={notice?.type || 'info'} />
            <div className="form-panel">
                <div className="form-row">
                    <div className="input-group">
                        <label>Imię i Nazwisko</label>
                        <input type="text" value={userName} disabled />
                    </div>
                    <div className="input-group">
                        <label>Temat zajęć</label>
                        <input type="text" placeholder="np. Algorytmy" value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="input-group">
                        <label>Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toLocaleDateString('en-CA')} />
                    </div>
                    <div className="input-group">
                        <label>Godzina rozpoczęcia</label>
                        <select value={time} onChange={e => setTime(e.target.value)}>
                            {/* Academic/Standard time blocks */}
                            <option value="08:00">08:00</option>
                            <option value="09:45">09:45</option>
                            <option value="11:30">11:30</option>
                            <option value="13:15">13:15</option>
                            <option value="15:00">15:00</option>
                            <option value="16:45">16:45</option>
                            <option value="18:30">18:30</option>
                            <option value="20:15">20:15</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Czas trwania (min)</label>
                        <select value={duration} onChange={e => setDuration(e.target.value)}>
                            <option value="45">45 min</option>
                            <option value="90">90 min</option>
                            <option value="180">180 min</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Min. pojemność</label>
                        <input type="number" min="1" value={minCapacity} onChange={e => setMinCapacity(parseInt(e.target.value) || 0)} />
                    </div>
                </div>
                <div className="checkbox-group">
                    <input type="checkbox" id="req-projector" checked={reqProjector} onChange={e => setReqProjector(e.target.checked)} />
                    <label htmlFor="req-projector" style={{ textTransform: 'none', fontSize: '14px' }}>Wymaga rzutnika</label>
                </div>
            </div>

            <div className="assistant-panel">
                <div className="assistant-heading">
                    <div>
                        <h3>Asystent wyboru sali</h3>
                        <p>Opisz potrzeby zajęć, a asystent ustawi filtry.</p>
                    </div>
                </div>
                <form className="assistant-form" onSubmit={handleAssistantQuery}>
                    <input
                        value={assistantPrompt}
                        onChange={(event) => setAssistantPrompt(event.target.value)}
                        placeholder="np. wykład dla 80 osób z rzutnikiem"
                        aria-label="Opis potrzeb dotyczących sali"
                    />
                    <button type="submit" disabled={isAssistantLoading}>
                        {isAssistantLoading ? 'Analizuję...' : 'Zastosuj'}
                    </button>
                </form>
                {assistantMessage && <p className="assistant-message">{assistantMessage}</p>}
            </div>

            <div className="section-title">Moje rezerwacje</div>
            <div className="reservation-list">
                {myReservations.length === 0 ? (
                    <p className="reservation-empty">Nie masz jeszcze aktywnych rezerwacji.</p>
                ) : (
                    myReservations.map((reservation) => (
                        <div className="reservation-card" key={reservation.id}>
                            <div>
                                <h3>Sala {reservation.room.id}</h3>
                                <p>{reservation.room.type} | {reservation.room.capacity} osób</p>
                                <p><strong>{reservation.date}</strong> | {reservation.startTime} - {reservation.endTime}</p>
                                <p>Temat: {reservation.subject}</p>
                            </div>
                            <button
                                className="btn btn-return"
                                onClick={() => void handleCancelReservation(reservation.id)}
                            >
                                Anuluj
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="section-title">Mapa kampusu</div>
            <div className="interactive-map-container">
                <div className="map-legend">
                    <div className="legend-item"><div className="legend-box status-free"></div> Dostępne</div>
                    <div className="legend-item"><div className="legend-box status-issue"></div> Usterka</div>
                    <div className="legend-item"><div className="legend-box status-taken"></div> Niedostępne / Nie pasują</div>
                    <div className="legend-item"><div className="legend-box status-selected"></div> Wybór</div>
                </div>
                <div id="floors-container">
                    {renderMap()}
                </div>
            </div>

            {selectedMapRoomId && (() => {
                const room = rooms.find(r => r.id === selectedMapRoomId);
                if (!room) return null;
                return (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius)', marginBottom: '40px' }}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>Wybrano: Sala {selectedMapRoomId}</h3>
                        <p style={{ marginTop: 0, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>Pojemność: {room.capacity} | Rzutnik: {room.hasProjector ? 'Tak' : 'Nie'}</p>
                        {room.hasIssue && <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '15px' }}>Usterka: {room.issueDesc}</div>}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button className="btn btn-reserve" style={{ flex: 2 }} onClick={() => handleBookRoom(selectedMapRoomId)}>Zarezerwuj Salę</button>
                            <button className="btn btn-return" style={{ flex: 1 }} onClick={() => handleReportIssue(selectedMapRoomId)}>Zgłoś Usterkę</button>
                        </div>
                    </div>
                );
            })()}

            <div className="section-title" style={{ marginTop: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Idealnie dopasowane sale</div>
            <div>
                {filteredRooms.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '10px' }}>Brak wolnych sal spełniających Twoje kryteria. Zmień filtry lub czas.</div>
                ) : (
                    filteredRooms.map(room => (
                        <div key={room.id} className="room-card" style={{ borderLeft: '4px solid var(--success)' }}>
                            <div className="room-info">
                                <h3>SALA {room.id}</h3>
                                <p>Typ: {room.type} | Pojemność: {room.capacity} osób</p>
                                {room.hasIssue && <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px' }}><strong>Usterka:</strong> {room.issueDesc}</p>}
                            </div>
                            <div>
                                <button className="btn btn-reserve" onClick={() => handleBookRoom(room.id)}>Rezerwuj</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}