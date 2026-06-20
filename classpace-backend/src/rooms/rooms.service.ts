import { Injectable } from '@nestjs/common';

export interface Room {
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

@Injectable()
export class RoomsService {
    // Temporary mocked data array (to be replaced with database connection later)
    private rooms: Room[] = [
        { id: '101', type: 'Sala Ćwiczeniowa', capacity: 30, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', hasIssue: false, issueDesc: '' },
        { id: '102', type: 'Sala Ćwiczeniowa', capacity: 20, hasProjector: false, isBooked: false, bookedBy: '', time: '', subject: '', hasIssue: false, issueDesc: '' },
        { id: 'AULA_A', type: 'Aula Wykładowa', capacity: 200, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', hasIssue: false, issueDesc: '' },
        { id: 'LAB_1', type: 'Laboratorium IT', capacity: 15, hasProjector: true, isBooked: false, bookedBy: '', time: '', subject: '', hasIssue: false, issueDesc: '' }
    ];

    findAll(): Room[] {
        return this.rooms;
    }
}