import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
    let service: RoomsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RoomsService],
        }).compile();

        service = module.get<RoomsService>(RoomsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('Room Availability Algorithm', () => {
        const testDate = '2026-06-19';

        it('should return room 102 when requested time is BEFORE the existing booking', () => {
            // Istniejąca rezerwacja: 18:00 - 20:00. Szukamy sali w godzinach 15:00 - 17:00.
            const availableRooms = service.getAvailableRooms(testDate, '15:00', '17:00');
            const room102 = availableRooms.find(r => r.id === '102');
            
            // Oczekujemy, że sala zostanie znaleziona (będzie dostępna)
            expect(room102).toBeDefined();
        });

        it('should filter out room 102 when requested time OVERLAPS with existing booking', () => {
            // Istniejąca rezerwacja: 18:00 - 20:00. Szukamy sali w godzinach 17:00 - 19:00 (Konflikt!).
            const availableRooms = service.getAvailableRooms(testDate, '17:00', '19:00');
            const room102 = availableRooms.find(r => r.id === '102');
            
            // Oczekujemy, że sala NIE zostanie znaleziona (zostanie odfiltrowana)
            expect(room102).toBeUndefined(); 
        });

        it('should return room 102 when requested time is AFTER the existing booking', () => {
            // Istniejąca rezerwacja: 18:00 - 20:00. Szukamy sali w godzinach 20:00 - 22:00.
            const availableRooms = service.getAvailableRooms(testDate, '20:00', '22:00');
            const room102 = availableRooms.find(r => r.id === '102');
            
            // Oczekujemy, że sala zostanie znaleziona (będzie dostępna)
            expect(room102).toBeDefined();
        });
    });
});