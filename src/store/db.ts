import { Booking } from "../domain/model/booking.model.js";
import { Restaurant } from "../domain/model/restaurant.model.js";
import { Sector } from "../domain/model/sector.model.js";
import { Table } from "../domain/model/table.model.js";

export class DB {
    restaurants = new Map<string, Restaurant>;
    sectors = new Map<string, Sector>;
    tables = new Map<string, Table>;
    bookings = new Map<string, Booking>;

    idempotency = new Map<string, any>();

    saveBooking(b: Booking) {
        this.bookings.set(b.id, b);
    }

    removeBooking(id: string) {
        const b = this.bookings.get(id);
        if (!b) return false;

        return this.bookings.delete(id);
    }

}