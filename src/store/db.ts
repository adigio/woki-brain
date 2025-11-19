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

    getRestaurantById(id: string): Restaurant | undefined {
        return this.restaurants.get(id);
    }

    getSectorById(id: string): Sector | undefined {
        return this.sectors.get(id);
    }

    findTablesBySectorId(sectorId: string): Table[] {
        return [...this.tables.values()].filter(t => t.sectorId === sectorId);
    }

    findBookingsByRestaurantAndSector(restaurantId: string, sectorId: string): Booking[] {
        return Array.from(this.bookings.values())
            .filter(b =>
                b.restaurantId === restaurantId &&
                b.sectorId === sectorId &&
                b.status === "CONFIRMED"
            );
    }

    saveBooking(b: Booking) {
        this.bookings.set(b.id, b);
    }

    removeBooking(id: string) {
        const b = this.bookings.get(id);
        if (!b) return false;

        return this.bookings.delete(id);
    }

}