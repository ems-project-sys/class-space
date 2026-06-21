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

const campusLayout = {
    'Piętro 3': ['301', '302'],
    'Piętro 2': ['205'],
    'Piętro 1': ['101', '102', 'LAB_1'],
    'Parter': ['AULA_A', 'SPORT']
};

export default function LecturerView() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const userName = localStorage.getItem('classSpaceUserName') || 'Nieznany';

    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('90');
    const [minCapacity, setMinCapacity] = useState(10);
    const [reqProjector, setReqProjector] = useState(false);
    
    const [selectedMapRoomId, setSelectedMapRoomId] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvailableRooms = async () => {
            if (!date || !time || !duration) return;
            
            const endTime = calculateEndTime(time, duration);
            const availableRooms = await ApiService.fetchAvailableRooms(date, time, endTime);
            
            setRooms(availableRooms);
        };

        fetchAvailableRooms();
    }, [date, time, duration]);

    useEffect(() => {
        const now = new Date();
        setDate(now.toLocaleDateString('en-CA'));
        setTime(`${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`);
    }, []);

    const calculateEndTime = (start: string, durationMin: string) => {
        let [hours, minutes] = start.split(':').map(Number);
        minutes += parseInt(durationMin);
        hours += Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    };

    const handleBookRoom = async (roomId: string) => {
        if (!subject.trim()) {
            alert('Wypełnij Temat zajęć przed rezerwacją.');
            return;
        }
        const endTime = calculateEndTime(time, duration);
        try {
            await ApiService.bookRoom(roomId, userName, subject, time, endTime);
            await ApiService.addSystemLog("REZERWACJA", roomId, userName, `Zajęcia: ${subject}`);
            setSelectedMapRoomId(null);
            setSubject(''); 
        } catch (error: any) {
            alert(error.message || "Błąd rezerwacji.");
        }
    };

    const handleCancelRoom = async (roomId: string) => {
        try {
            await ApiService.cancelRoom(roomId);
            await ApiService.addSystemLog("OPUSZCZENIE", roomId, userName, `Zwolnione przez: Wykładowca`);
        } catch (error) {
            alert("Błąd anulowania.");
        }
    };

    const handleReportIssue = async (roomId: string) => {
        const issueDescription = prompt(`Zgłaszasz usterkę w Sali ${roomId}.\nKrótko opisz problem:`);
        if (issueDescription && issueDescription.trim() !== '') {
            try {
                await ApiService.reportIssue(roomId, issueDescription.trim(), userName);
            } catch (error) {
                alert("Błąd zgłaszania usterki.");
            }
        }
    };

    const renderMap = () => {
        return Object.entries(campusLayout).map(([floorName, roomIds]) => (
            <div key={floorName} className="map-floor">
                <div className="map-floor-title">{floorName}</div>
                <div className="floor-grid">
                    {roomIds.map(id => {
                        const room = rooms.find(r => r.id === id);
                        if (!room) return null;

                        const isAvailable = !room.isBooked && room.capacity >= minCapacity && (!reqProjector || room.hasProjector);
                        let statusClass = isAvailable ? 'status-free' : 'status-taken';
                        if (room.hasIssue && isAvailable) statusClass = 'status-issue';
                        if (selectedMapRoomId === id) statusClass = 'status-selected';

                        const extraStyle = (id === 'AULA_A' || id === 'SPORT') ? { gridColumn: 'span 2' } : {};

                        return (
                            <div 
                                key={id} 
                                className={`map-room ${statusClass}`} 
                                style={extraStyle}
                                onClick={() => isAvailable ? setSelectedMapRoomId(selectedMapRoomId === id ? null : id) : null}
                            >
                                {id}
                                <small>{room.type}</small>
                            </div>
                        );
                    })}
                </div>
            </div>
        ));
    };

    const filteredRooms = rooms.filter(room => room.capacity >= minCapacity && (!reqProjector || room.hasProjector));

    return (
        <div className="view-section active">
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
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} />
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

            <div className="section-title">Mapa kampusu</div>
            <div className="interactive-map-container">
                <div className="map-legend">
                    <div className="legend-item"><div className="legend-box status-free"></div> Dostępne</div>
                    <div className="legend-item"><div className="legend-box status-issue"></div> Usterka</div>
                    <div className="legend-item"><div className="legend-box status-taken"></div> Niedostępne</div>
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

            <div className="section-title" style={{ marginTop: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Dostępne sale</div>
            <div>
                {filteredRooms.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '10px' }}>Brak sal spełniających kryteria filtracji.</div>
                ) : (
                    filteredRooms.map(room => {
                        const isMyBooking = room.bookedBy === userName;
                        return (
                            <div key={room.id} className="room-card">
                                <div className="room-info">
                                    <h3>SALA {room.id}</h3>
                                    <p>Typ: {room.type} | Pojemność: {room.capacity} osób</p>
                                    {room.hasIssue && <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '5px' }}><strong>Usterka:</strong> {room.issueDesc}</p>}
                                </div>
                                <div>
                                    {isMyBooking ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-return" onClick={() => handleReportIssue(room.id)}>Usterka</button>
                                            <button className="btn btn-cancel" onClick={() => handleCancelRoom(room.id)}>Anuluj</button>
                                        </div>
                                    ) : room.isBooked ? (
                                        <span className="badge badge-taken">Zajęta: {room.subject}</span>
                                    ) : (
                                        <button className="btn btn-reserve" onClick={() => handleBookRoom(room.id)}>Rezerwuj</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}