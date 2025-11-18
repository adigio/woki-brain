import { ISODateTime } from "./ISODateTime.js";

type BookingStatus = "CONFIRMED" | "CANCELLED";

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