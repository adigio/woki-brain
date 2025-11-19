import { BookingStatus, ISODateTime } from "../types/index.js";

export interface Booking {
    id: string;
    restaurantId: string;
    sectorId: string;
    tableIds: string[];
    partySize: number;
    start: ISODateTime;
    end: ISODateTime;
    durationMinutes: number;
    status: BookingStatus;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}