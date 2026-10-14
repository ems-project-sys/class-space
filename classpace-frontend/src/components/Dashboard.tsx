import React, { useState, useEffect } from 'react';

const ROOM_TYPES = ['Wykładowa', 'Aula', 'Ćwiczeniowa', 'Lab. Komputerowe'];
interface Room { id: string; name: string; type: string; capacity: number; hasProjector: boolean; }

const mockRooms: Room[] = [
  { id: '1', name: 'Sala 101', type: 'Wykładowa', capacity: 120, hasProjector: true },
  { id: '2', name: 'Sala 102', type: 'Wykładowa', capacity: 90, hasProjector: true },
  { id: '3', name: 'Sala 103', type: 'Wykładowa', capacity: 80, hasProjector: false },
  { id: '4', name: 'Sala 104', type: 'Wykładowa', capacity: 60, hasProjector: true },
  { id: '5', name: 'Sala 105', type: 'Wykładowa', capacity: 150, hasProjector: true },
  { id: '6', name: 'Aula 1', type: 'Aula', capacity: 300, hasProjector: true },
  { id: '7', name: 'Aula 2', type: 'Aula', capacity: 250, hasProjector: true },
  { id: '8', name: 'Aula 3', type: 'Aula', capacity: 200, hasProjector: true },
  { id: '9', name: 'Sala 201', type: 'Ćwiczeniowa', capacity: 30, hasProjector: false },
  { id: '10', name: 'Sala 202', type: 'Ćwiczeniowa', capacity: 35, hasProjector: true },
  { id: '11', name: 'Sala 203', type: 'Ćwiczeniowa', capacity: 25, hasProjector: false },
  { id: '12', name: 'Sala 204', type: 'Ćwiczeniowa', capacity: 40, hasProjector: true },
  { id: '13', name: 'Sala 205', type: 'Ćwiczeniowa', capacity: 30, hasProjector: false },
  { id: '14', name: 'Lab 1', type: 'Lab. Komputerowe', capacity: 15, hasProjector: true },
  { id: '15', name: 'Lab 2', type: 'Lab. Komputerowe', capacity: 20, hasProjector: true },
  { id: '16', name: 'Lab 3', type: 'Lab. Komputerowe', capacity: 15, hasProjector: false },
  { id: '17', name: 'Lab 4', type: 'Lab. Komputerowe', capacity: 25, hasProjector: true },
  { id: '18', name: 'Lab 5', type: 'Lab. Komputerowe', capacity: 18, hasProjector: true },
  { id: '19', name: 'Sala 301', type: 'Ćwiczeniowa', capacity: 45, hasProjector: true },
  { id: '20', name: 'Sala 302', type: 'Wykładowa', capacity: 75, hasProjector: false },
];

export const Dashboard = ({ userRole, userName, onLogout }: { userRole: string, userName: string, onLogout: () => void }) => {
  const [theme, setTheme] = useState<'merito' | 'dark'>('merito');
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [needsProjector, setNeedsProjector] = useState(false);
  const [requiredCapacity, setRequiredCapacity] = useState<string>('');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [lecturerName, setLecturerName] = useState('');
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Tajny "Easter Egg" dla administratora - panel zniknął z UI całkowicie.
  const handleSecretAdminTrigger = () => {
    if (userRole === 'admin') {
      setShowAdminPanel(true);
    }
  };

  const handleAIQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiThinking(true);
    setAiFeedback(null);

    try {
      const response = await fetch('http://localhost:3000/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) throw new Error('Błąd API');
      
      const data = await response.json();
      
      setNeedsProjector(data.filters.needsProjector);
      setSelectedType(data.filters.type);
      setRequiredCapacity(data.filters.capacity ? data.filters.capacity.toString() : '');
      
      let feedback = [];
      if (data.filters.needsProjector) feedback.push('Rzutnik: Wymagany');
      if (data.filters.type) feedback.push(`Typ: ${data.filters.type}`);
      if (data.filters.capacity) feedback.push(`Miejsca: min. ${data.filters.capacity}`);

      setAiFeedback(feedback.length > 0 ? `Zastosowano: ${feedback.join(', ')}` : 'Brak sprecyzowanych wymagań.');
    } catch (error) {
      console.error(error);
      setAiFeedback('Brak połączenia z backendem (NestJS).');
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setBookingSuccess({ roomName: selectedRoom.name, lecturer: lecturerName, subject: subjectName });
    setSelectedRoom(null); 
    setLecturerName(''); 
    setSubjectName('');
  };

  const filteredRooms = mockRooms.filter(room => {
    if (selectedType && room.type !== selectedType) return false;
    if (needsProjector && !room.hasProjector) return false;
    if (requiredCapacity && room.capacity < Number(requiredCapacity)) return false;
    return true;
  });

  return (
    <div className="container">
      {/* NAGŁÓWEK */}
      <div className="header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            Witaj {userName}!
          </h1>
          {/* Niewidzialny spust panelu - dwukrotne kliknięcie otwiera admina */}
          <p 
            style={{ color: 'var(--text-secondary)', cursor: userRole === 'admin' ? 'pointer' : 'default', userSelect: 'none' }}
            onDoubleClick={handleSecretAdminTrigger}
          >
            System Rezerwacji ClassSpace
          </p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button className={`btn ${theme === 'merito' ? 'btn-primary' : ''}`} style={{ border: 'none', padding: '0.4rem 1rem' }} onClick={() => setTheme('merito')}>Jasny</button>
            <button className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`} style={{ border: 'none', padding: '0.4rem 1rem' }} onClick={() => setTheme('dark')}>Ciemny</button>
          </div>
          {/* Zniknęła stąd zębatka, interfejs jest w 100% czysty */}
          <button className="btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={onLogout}>Wyloguj</button>
        </div>
      </div>

      {/* ASYSTENT AI CLASS-SPACE */}
      <div className="ai-bar">
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Asystent AI</h3>
        <form onSubmit={handleAIQuery} className="ai-input-wrapper">
          <input 
            type="text" 
            className="ai-input" 
            placeholder="W czym mogę pomóc?" 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button type="submit" className="btn-ai" disabled={isAiThinking}>Szukaj</button>
        </form>
        {isAiThinking && <div className="ai-status"><div className="spinner"></div> Model analizuje zapytanie...</div>}
        {aiFeedback && !isAiThinking && <div className="ai-status" style={{ color: '#22c55e' }}>{aiFeedback}</div>}
      </div>

      {/* RĘCZNE FILTROWANIE */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {ROOM_TYPES.map(type => (
            <button key={type} className={`pill ${selectedType === type ? 'active' : ''}`} onClick={() => setSelectedType(selectedType === type ? null : type)}>
              {type}
            </button>
          ))}
        </div>
        <div className="divider"></div>
        <button className={`pill ${needsProjector ? 'active' : ''}`} onClick={() => setNeedsProjector(!needsProjector)}>
          🎥 Rzutnik
        </button>
        <div className="divider"></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Studenci:</label>
          <input 
            type="number" 
            placeholder="Min." 
            className="form-input" 
            style={{ width: '80px', padding: '0.4rem 0.75rem' }}
            value={requiredCapacity}
            onChange={(e) => setRequiredCapacity(e.target.value)}
          />
        </div>
        <button className="btn" style={{ marginLeft: 'auto', fontSize: '0.85rem' }} onClick={() => { setSelectedType(null); setNeedsProjector(false); setRequiredCapacity(''); setAiPrompt(''); setAiFeedback(null); }}>
          Wyczyść filtry
        </button>
      </div>

      {/* SIATKA SAL */}
      <div className="grid">
        {filteredRooms.map(room => (
          <div key={room.id} className="card" onClick={() => setSelectedRoom(room)}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{room.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '1rem' }}>{room.type}</p>
            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>👨‍🎓 {room.capacity} os.</span>
              <span style={{ fontSize: '0.9rem' }}>🎥 {room.hasProjector ? 'Rzutnik' : 'Brak'}</span>
            </div>
          </div>
        ))}
        {filteredRooms.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Nie znaleziono sal spełniających kryteria. Spróbuj wyczyścić filtry.
          </div>
        )}
      </div>

      {/* MODAL REZERWACJI */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRoom(null)}>&times;</button>
            <h2 style={{ fontSize: '1.75rem' }}>{selectedRoom.name}</h2>
            
            <div className="timeline-container">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dostępność Sali</div>
              <div className="timeline-bar">
                <div className="time-slot slot-free"></div>
                <div className="time-slot slot-booked"></div>
                <div className="time-slot slot-free"></div>
                <div className="time-slot slot-free"></div>
              </div>
            </div>

            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Imię i nazwisko prowadzącego</label>
                <input type="text" className="form-input" value={lecturerName} onChange={e => setLecturerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Przedmiot</label>
                <input type="text" className="form-input" value={subjectName} onChange={e => setSubjectName(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>
                Zatwierdź rezerwację
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUKCESU */}
      {bookingSuccess && (
        <div className="modal-overlay" style={{ zIndex: 60 }} onClick={() => setBookingSuccess(null)}>
          <div className="modal-content success-box" onClick={e => e.stopPropagation()}>
            <div className="success-icon">🎉</div>
            <h2 style={{ fontSize: '1.8rem', color: '#16a34a', marginBottom: '1rem' }}>Zarezerwowano!</h2>
            <div style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', marginBottom: '2rem' }}>
              <p><strong>Sala:</strong> {bookingSuccess.roomName}</p>
              <p><strong>Prowadzący:</strong> {bookingSuccess.lecturer}</p>
              <p><strong>Zajęcia:</strong> {bookingSuccess.subject}</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={() => setBookingSuccess(null)}>Zamknij</button>
          </div>
        </div>
      )}

      {/* MODAL ADMINA - Wywoływany tylko podwójnym kliknięciem */}
      {showAdminPanel && (
        <div className="modal-overlay" style={{ zIndex: 60 }} onClick={() => setShowAdminPanel(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdminPanel(false)}>&times;</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Zarządzanie Zespołem</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Zaszyfrowany moduł uprawnień.</p>
            <div className="form-group" style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Nowy Administrator</h3>
              <input type="email" placeholder="Email służbowy" className="form-input" style={{ marginBottom: '0.5rem' }} />
              <button className="btn" style={{ background: '#10b981', color: 'white', border: 'none', width: '100%' }}>Nadaj uprawnienia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};