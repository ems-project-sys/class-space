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

    bookRoom: (roomId, date, subject, startTime, endTime) => request('/reservations', {
        method: 'POST',
        body: JSON.stringify({ roomId, date, subject, startTime, endTime }),
    }),

    cancelRoom: (reservationId) => request(`/reservations/${reservationId}`, {
        method: 'DELETE',
    }),

    addSystemLog: async () => undefined,

    reportIssue: async () => {
        throw new Error('Issue reporting API is not migrated yet.');
    },

    resolveIssue: async () => {
        throw new Error('Issue resolution API is not migrated yet.');
    },

    subscribeToRooms: (onRoomsUpdatedCallback) => {
        onRoomsUpdatedCallback([]);
        return () => undefined;
    },
};
