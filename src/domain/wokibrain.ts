import { DB } from "../store/db.js";
import { logger } from "../index.js";
import { DateTime } from "luxon";
import { computeGaps, findEarliestSlot, getComboGaps, intersectMany } from "./gaps.js";
import { NotFoundException } from "./exception/not.found.exception.js";
import { Window } from "./model/window.model.js";
import { Table } from "./model/table.model.js";
import { Booking } from "./model/booking.model.js";
import { get } from "http";
import { COMBO, SINGLE } from "../shared/constants.js";
import { ErrorDescription } from "../shared/error.description.js";

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

        const { restaurantId, sectorId, partySize, duration, date } = command;

        const restaurant = this.store.getRestaurantById(restaurantId);
        if (!restaurant) throw new NotFoundException(ErrorDescription.RESTAURANT_NOT_FOUND);

        const sector = this.store.getSectorById(sectorId);
        if (!sector) throw new NotFoundException(ErrorDescription.SECTOR_NOT_FOUND);

        const tables = this.store.findTablesBySectorId(sectorId);
        if (tables.length === 0) throw new NotFoundException(ErrorDescription.NO_TABLES_FOUND);

        const bookings = this.store.findBookingsByRestaurantAndSector(restaurantId, sectorId);

        const window = buildWindowsForDate(
            command.date,
            restaurant.timezone,
            restaurant.windows,
            command.windowStart,
            command.windowEnd
        );

        const candidates: any[] = getSingleTableCandidates(
            tables,
            bookings,
            window,
            partySize,
            duration
        );

        const combos = generateAllCombos(tables);

        for (const combo of combos) {

            const { min: comboMin, max: comboMax } = computeComboCapacity(combo);

            if (partySize < comboMin || partySize > comboMax) continue;

            const intersected = getComboGaps(combo, bookings, window);
            if (intersected.length === 0) continue;

            const gapList = combo.map(table => {

                const tableBookings = bookings
                    .filter(b => b.tableIds.includes(table.id))
                    .map(b => ({
                        start: DateTime.fromISO(b.start),
                        end: DateTime.fromISO(b.end)
                    }));

                return computeGaps(tableBookings, window.start, window.end);
            });

            for (const interval of intersected) {
                const slot = findEarliestSlot(interval, duration);

                if (slot) {
                    candidates.push({
                        kind: COMBO,
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

        const limitedCandidates = command.limit ? sorted.slice(0, command.limit) : sorted;

        logger.info(`Found ${limitedCandidates.length} seat candidates`);
        return limitedCandidates;
    }


    async createBooking(command: CreateBookingCommand, idempotencyKey?: string) {
        return null;
    }

    async getBookingsByDate(query: BookingQuery) {
        logger.info("Fetching bookings by date in WokiBrain");
        return [];
    }

    async cancelBooking(bookingId: string) {
        logger.info(`Deleting booking with ID ${bookingId} in WokiBrain`);
        return false;
    }

}

export function buildWindowsForDate(
    dateISO: string,
    timezone: string,
    windowsInput?: Window[],
    overrideStart?: string,
    overrideEnd?: string
) {

    const dateBase = DateTime.fromISO(dateISO, { zone: timezone });

    const defaultWindows = windowsInput ?? [
        { start: "00:00", end: "23:59" }
    ];

    const requestedWindows = overrideStart && overrideEnd
        ? [{ start: overrideStart, end: overrideEnd }]
        : defaultWindows;


    const windows = requestedWindows.map(w => ({
        start: dateBase.set({
            hour: parseInt(w.start.split(":")[0]),
            minute: parseInt(w.start.split(":")[1]),
            second: 0
        }),
        end: dateBase.set({
            hour: parseInt(w.end.split(":")[0]),
            minute: parseInt(w.end.split(":")[1]),
            second: 0
        })
    }));

    return windows[0];
}

const getSingleTableCandidates = (
    tables: Table[],
    bookings: Booking[],
    window: { start: DateTime; end: DateTime },
    partySize: number,
    duration: number
) => {

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

        for (const gap of gaps) {
            const slot = findEarliestSlot(gap, duration);
            if (slot) {
                candidates.push({
                    kind: SINGLE,
                    tableIds: [table.id],
                    start: slot.start.toISO(),
                    end: slot.end.toISO()
                });
            }
        }
    }

    return candidates;
}

const generateAllCombos = <T>(items: T[]): T[][] => {
    const result: T[][] = []
    backtrack(items, 0, [], result)
    return result
}

const backtrack = <T>(
    items: T[],
    start: number,
    path: T[],
    result: T[][]
) => {
    if (path.length >= 2) result.push([...path])

    for (let i = start; i < items.length; i++) {
        path.push(items[i])
        backtrack(items, i + 1, path, result)
        path.pop()
    }
}

const computeComboCapacity = (combo: Table[]) => {
    const penalty = combo.length - 1;

    const min = combo.reduce((sum, t) => sum + t.minSize, 0) - penalty;
    const max = combo.reduce((sum, t) => sum + t.maxSize, 0) - penalty;

    return { min, max };
};
