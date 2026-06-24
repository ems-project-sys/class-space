import { Injectable } from '@nestjs/common';

export interface Booking {
    date: string;
    startTime: string;
    endTime: string;
    bookedBy: string;
}

export interface Room {
    id: string;
    type: string;
    capacity: number;
    hasProjector: boolean;
    hasIssue: boolean;
    issueDesc: string;
    bookings: Booking[];
}

@Injectable()
export class RoomsService {
    // Database simulation with one "malicious" reservation from the promoter's Use Case
    private rooms: Room[] = [
        { id: '101', type: 'Sala Ćwiczeniowa', capacity: 30, hasProjector: true, hasIssue: false, issueDesc: '', bookings: [] },
        { 
            id: '102', type: 'Sala Ćwiczeniowa', capacity: 20, hasProjector: false, hasIssue: false, issueDesc: '', 
            bookings: [
                { date: '2026-06-19', startTime: '18:00', endTime: '20:00', bookedBy: 'Promotor' }
            ] 
        },
        { id: 'AULA_A', type: 'Aula Wykładowa', capacity: 200, hasProjector: true, hasIssue: false, issueDesc: '', bookings: [] },
        { id: 'LAB_1', type: 'Laboratorium IT', capacity: 15, hasProjector: true, hasIssue: false, issueDesc: '', bookings: [] }
    ];

    // Mathematical function checking for time collision (the basis of our future tests)
    private isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
        return start1 < end2 && start2 < end1;
    }

    // Filtering algorithm
    getAvailableRooms(targetDate: string, targetStartTime: string, targetEndTime: string): Room[] {
        return this.rooms.filter(room => {
            if (room.hasIssue) return false;

            const hasConflict = room.bookings.some(booking => {
                if (booking.date !== targetDate) return false;
                return this.isTimeOverlapping(targetStartTime, targetEndTime, booking.startTime, booking.endTime);
            });

            return !hasConflict; // Room stays on the list only if there is no conflict
        });
    }
}