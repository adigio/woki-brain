import { Booking } from "../domain/model/booking.js";
import { Restaurant } from "../domain/model/restaurant.js";
import { Sector } from "../domain/model/sector.js";
import { Table } from "../domain/model/table.js";

export class MemoryStore {
    restaurants = new Map<string, Restaurant>;
    sectors = new Map<string, Sector>;
    tables = new Map<string, Table>;
    bookings = new Map<string, Booking>;

    saveBooking(b: Booking) {
        this.bookings.set(b.id, b);
    }

    removeBooking(id: string) {
        const b = this.bookings.get(id);
        if (!b) return false;

        return this.bookings.delete(id);
    }


    private dayKey(tableId: string, isoStart: string) {
        return `${tableId}:${isoStart.slice(0, 10)}`; // YYYY-MM-DD
    }

}