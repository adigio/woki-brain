export interface BookingResponse {
    id: string;
    restaurantId: string;
    sectorId: string;
    tableIds: string[];
    partySize: number;
    start: string;
    end: string;
    durationMinutes: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}