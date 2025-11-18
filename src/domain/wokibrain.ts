import { MemoryStore } from "../store/db.js";
import { logger } from "../index.js";

export interface DiscoverSeatsCommand {
    restaurantId: string;
    sectorId: string;
    partySize: number;
    duration: number;
    date: string;
    windowStart?: string;
    windowEnd?: string;
    limit?: number;
}

export interface CreateBookingCommand {
    restaurantId: string;
    sectorId: string;
    partySize: number;
    durationMinutes: number;
    date: string;
    windowStart?: string;
    windowEnd?: string;
}

export interface BookingQuery { 
    restaurantId: string;
    sectorId: string;
    date: string;
}

export class WokiBrain {
    private store: MemoryStore;

    constructor(store: MemoryStore) {
        this.store = store;
    }

    async discoverSeats(command: DiscoverSeatsCommand) {
        logger.info("Executing seat discovery in WokiBrain");

        const restaurant = this.store.restaurants.get(command.restaurantId);
        if (!restaurant) throw { status: 404, error: "not_found", detail: "Restaurant not found" };

        const sector = this.store.sectors.get(command.sectorId);
        if (!sector) throw { status: 404, error: "not_found", detail: "Sector not found" };

        return [];
    }

    async createBooking(command: CreateBookingCommand) {
        logger.info("Executing booking creation in WokiBrain");
        return null;
    }

    async getBookingsByDate(query: BookingQuery) {
        logger.info("Fetching bookings by date in WokiBrain");
        return [];
    }

    async deleteBooking(bookingId: string) {
        logger.info(`Deleting booking with ID ${bookingId} in WokiBrain`);
        return false;
    }

}