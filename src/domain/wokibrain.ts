import { DB } from "../store/db.js";
import { logger } from "../index.js";
import { DateTime } from "luxon";
import { computeGaps, findEarliestSlot, intersectMany } from "./gaps.js";
import { NotFoundException } from "./exception/NotFoundException.js";

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
    private store: DB;

    constructor(store: DB) {
        this.store = store;
    }

    async discoverSeats(command: DiscoverSeatsCommand) {
        logger.info("Executing seat discovery in WokiBrain");

        const { restaurantId, sectorId, partySize, duration } = command;

        const restaurant = this.store.restaurants.get(restaurantId);
        if (!restaurant) throw new NotFoundException("Restaurant not found");

        const sector = this.store.sectors.get(sectorId);
        if (!sector) throw new NotFoundException("Sector not found");

        const tz = restaurant.timezone;

        const dateBase = DateTime.fromISO(command.date, { zone: tz });
        const defaultWindows = restaurant.windows ?? [{ start: "00:00", end: "23:59" }];

        const requestedWindow = command.windowStart && command.windowEnd
            ? [{ start: command.windowStart, end: command.windowEnd }]
            : defaultWindows;

        const windows = requestedWindow.map(window => ({
            start: dateBase.set({
                hour: parseInt(window.start.split(":")[0]),
                minute: parseInt(window.start.split(":")[1]),
                second: 0
            }),
            end: dateBase.set({
                hour: parseInt(window.end.split(":")[0]),
                minute: parseInt(window.end.split(":")[1]),
                second: 0
            })
        }));

        const window = windows[0];

        const tables = Array.from(this.store.tables.values())
            .filter(t => t.sectorId === sector.id);

        const bookings = Array.from(this.store.bookings.values())
            .filter(b =>
                b.restaurantId === restaurantId &&
                b.sectorId === sectorId &&
                b.status === "CONFIRMED"
            );

        const candidates: any[] = [];

        for (const table of tables) {
            if (partySize < table.minSize || partySize > table.maxSize) continue;

            const tableBookings = bookings
                .filter(b => b.tableIds.includes(table.id))
                .map(b => ({
                    start: DateTime.fromISO(b.start),
                    end: DateTime.fromISO(b.end)
                }));

            const gaps = computeGaps(tableBookings, window.start, window.end);

            for (const g of gaps) {
                const slot = findEarliestSlot(g, duration);
                if (slot) {
                    candidates.push({
                        kind: "single",
                        tableIds: [table.id],
                        start: slot.start.toISO(),
                        end: slot.end.toISO()
                    });
                }
            }
        }

        const combos = generateAllCombos(tables);

        for (const combo of combos) {

            const comboMin = combo.reduce((a, t) => a + t.minSize, 0);
            const comboMax = combo.reduce((a, t) => a + t.maxSize, 0);

            if (partySize < comboMin || partySize > comboMax) continue;

            const gapList = combo.map(table => {
                const tableBookings = bookings
                    .filter(b => b.tableIds.includes(table.id))
                    .map(b => ({
                        start: DateTime.fromISO(b.start),
                        end: DateTime.fromISO(b.end)
                    }));

                return computeGaps(tableBookings, window.start, window.end);
            });

            const intersected = intersectMany(gapList);
            if (intersected.length === 0) continue;

            for (const g of intersected) {
                const slot = findEarliestSlot(g, duration);
                if (slot) {
                    candidates.push({
                        kind: "combo",
                        tableIds: combo.map(t => t.id),
                        start: slot.start.toISO(),
                        end: slot.end.toISO()
                    });
                }
            }
        }

        const sorted = candidates.sort((a, b) => {
            if (a.start < b.start) return -1;
            if (a.start > b.start) return 1;

            if (a.tableIds.length < b.tableIds.length) return -1;
            if (a.tableIds.length > b.tableIds.length) return 1;

            return a.tableIds.join(",").localeCompare(b.tableIds.join(","));
        });


        const limited = command.limit ? sorted.slice(0, command.limit) : sorted;

        return {
            slotMinutes: 15,
            duration,
            candidates: limited,
        };
    }


    async createBooking(command: CreateBookingCommand, idempotencyKey?: string) {
        logger.info("Executing booking creation in WokiBrain");

        if (idempotencyKey) {
            const prev = this.store.idempotency.get(idempotencyKey);
            if (prev) return prev;
        }

        const restaurant = this.store.restaurants.get(command.restaurantId);
        if (!restaurant) throw new NotFoundException("Restaurant not found");

        const sector = this.store.sectors.get(command.sectorId);
        if (!sector) throw new NotFoundException("Sector not found");

        const seat = this.findAvailableSeat(sector, command);
        if (!seat)
            throw new BusinessException(
                409,
                "no_availability",
                "No seats available in selected time window"
            );



        return null;
    }

    findAvailableSeat(sector: Sector, command: CreateBookingCommand) {
        return sector.seats?.[0] ?? null;
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



function generateAllCombos<T>(items: T[]): T[][] {
    const result: T[][] = [];
    const n = items.length;

    for (let mask = 1; mask < 1 << n; mask++) {
        const subset: T[] = [];
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) subset.push(items[i]);
        }
        if (subset.length >= 2) result.push(subset);
    }

    return result;
}