import { DateTime } from "luxon";
import { Booking } from "../../domain/model/booking.model";
import { Restaurant } from "../../domain/model/restaurant.model";
import { Sector } from "../../domain/model/sector.model";
import { Table } from "../../domain/model/table.model";

export class DB {
    restaurants = new Map<string, Restaurant>;
    sectors = new Map<string, Sector>;
    tables = new Map<string, Table>;
    bookings = new Map<string, Booking>;

    idempotency = new Map<string, any>();
    locks = new Map<string, boolean>();

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

    findBookingsByRestaurantIdAndSectorIdAndDate(restaurantId: string, sectorId: string, date: string) {
        return [...this.bookings.values()].filter(b => {
            if (b.restaurantId !== restaurantId) return false;
            if (b.sectorId !== sectorId) return false;
            if (b.status !== "CONFIRMED") return false;

            return b.start.startsWith(date);
        });
    }

    generateBookingId(): string {
        const prefix = "B";

        const ids = Array.from(this.bookings.keys());

        if (ids.length === 0) return prefix + "1";

        const numbers = ids
            .map(id => parseInt(id.slice(prefix.length), 10))
            .filter(n => !isNaN(n));

        const max = Math.max(...numbers);

        return prefix + (max + 1);
    }

    saveBooking(booking: Booking) {
        this.bookings.set(booking.id, booking);
    }

    cancelBooking(booking: Booking): boolean {
        booking.status = "CANCELLED";
        booking.updatedAt = DateTime.now().toISO();

        this.bookings.set(booking.id, booking);

        return this.bookings.delete(booking.id);
    }

    getIdempotency(key: string): any | undefined {
        return this.idempotency.get(key);
    }

    saveIdempotency(key: string, record: any) {
        this.idempotency.set(key, record);
    }

    tryGetLock(key: string): boolean {
        if (this.locks.get(key)) {
            return false;
        }
        this.locks.set(key, true);
        return true;
    }

    releaseLock(key: string): void {
        this.locks.delete(key);
    }

}