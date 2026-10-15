interface ApiUser {
	id: string;
	name: string;
	email: string;
	role: string;
}

interface ApiRoom {
	id: string;
	type: string;
	capacity: number;
	hasProjector: boolean;
	hasIssue: boolean;
	issueDesc: string;
	issueId?: string;
	reservationId?: string;
}

interface ApiRoomSummary extends ApiRoom {
	isBooked: boolean;
	bookedBy: string;
	subject: string;
	time: string;
}

interface ApiReservation {
	id: string;
	date: string;
	startTime: string;
	endTime: string;
	subject: string;
	status: string;
	room: {
		id: string;
		type: string;
		capacity: number;
		hasProjector: boolean;
	};
}

type RoomUpdateCallback = (rooms: ApiRoomSummary[]) => void;

interface AssistantFilters {
	needsProjector: boolean;
	type: string | null;
	capacity: number | null;
}

export declare const ApiService: {
	loginUser: (email: string, password: string) => Promise<ApiUser>;
	registerUser: (name: string, email: string, password: string) => Promise<ApiUser>;
	fetchAvailableRooms: (date: string, startTime: string, endTime: string) => Promise<ApiRoom[]>;
	parseRoomPrompt: (prompt: string) => Promise<{ success: true; filters: AssistantFilters; message: string }>;
	bookRoom: (roomId: string, date: string, subject: string, startTime: string, endTime: string) => Promise<unknown>;
	fetchMyReservations: () => Promise<ApiReservation[]>;
	cancelRoom: (reservationId: string) => Promise<unknown>;
	reportIssue: (roomId: string, description: string) => Promise<unknown>;
	resolveIssue: (issueId: string, resolution: string) => Promise<unknown>;
	subscribeToRooms: (callback: RoomUpdateCallback) => () => void;
	addSystemLog: (...args: unknown[]) => Promise<undefined>;
};