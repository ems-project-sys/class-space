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

type RoomUpdateCallback = (rooms: ApiRoomSummary[]) => void;

export declare const ApiService: {
	loginUser: (email: string, password: string) => Promise<ApiUser>;
	registerUser: (name: string, email: string, password: string) => Promise<ApiUser>;
	fetchAvailableRooms: (date: string, startTime: string, endTime: string) => Promise<ApiRoom[]>;
	bookRoom: (roomId: string, date: string, subject: string, startTime: string, endTime: string) => Promise<unknown>;
	cancelRoom: (reservationId: string) => Promise<unknown>;
	reportIssue: (roomId: string, description: string) => Promise<unknown>;
	resolveIssue: (issueId: string, resolution: string) => Promise<unknown>;
	subscribeToRooms: (callback: RoomUpdateCallback) => () => void;
	addSystemLog: (...args: unknown[]) => Promise<undefined>;
};