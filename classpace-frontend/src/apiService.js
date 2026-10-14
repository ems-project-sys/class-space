const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('classSpaceAccessToken');

const request = async (path, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || `API Error: ${response.status}`;
        throw new Error(message);
    }

    return data;
};

export const ApiService = {
    loginUser: async (email, password) => {
        const session = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        localStorage.setItem('classSpaceAccessToken', session.accessToken);
        return session.user;
    },

    registerUser: async (name, email, password) => {
        const session = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });

        localStorage.setItem('classSpaceAccessToken', session.accessToken);
        return session.user;
    },

    fetchAvailableRooms: (targetDate, targetStartTime, targetEndTime) => {
        const params = new URLSearchParams({
            date: targetDate,
            startTime: targetStartTime,
            endTime: targetEndTime,
        });

        return request(`/rooms/available?${params.toString()}`);
    },

    parseRoomPrompt: (prompt) => request('/ai/parse', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    }),

    subscribeToRooms: (onRoomsUpdatedCallback) => {
        let active = true;

        const loadRooms = async () => {
            try {
                const date = new Date().toISOString().slice(0, 10);
                const rooms = await request(`/rooms?date=${date}`);
                if (active) {
                    onRoomsUpdatedCallback(rooms);
                }
            } catch (error) {
                console.error('Error fetching room summaries:', error);
            }
        };

        loadRooms();
        const interval = setInterval(loadRooms, 5000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    },

    bookRoom: (roomId, date, subject, startTime, endTime) => request('/reservations', {
        method: 'POST',
        body: JSON.stringify({ roomId, date, subject, startTime, endTime }),
    }),

    cancelRoom: (reservationId) => request(`/reservations/${reservationId}`, {
        method: 'DELETE',
    }),

    addSystemLog: async () => undefined,

    reportIssue: (roomId, description) => request('/issues', {
        method: 'POST',
        body: JSON.stringify({ roomId, description }),
    }),

    resolveIssue: (issueId, resolution) => request(`/issues/${issueId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution }),
    }),
};
