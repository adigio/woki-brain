import {FindSeatsByRestaurantIdQuery} from "../port/in/find.seats.by.restaurant.id.query";
import {logger} from "../../index";
import {computeGaps, findEarliestSlot, getComboGaps} from "../../../old/domain/gaps";
import {DateTime} from "luxon";
import {Table} from "../../../old/domain/model/table.model";
import {Booking} from "../../../old/domain/model/booking.model";
import {GetRestaurantByIdRepository} from "../port/out/get.restaurant.by.id.repository";
import {GetSectorByIdRepository} from "../port/out/get.sector.by.id.repository";
import {FindBookingsByFiltersRepository} from "../port/out/find.bookings.by.filters.repository";
import {Sector} from "../model/sector.model";
import {Restaurant} from "../model/restaurant.model";
import {FindTablesBySectorIdRepository} from "../port/out/find.tables.by.sector.id.repository";
import {NotFoundException} from "../exception/not.found.exception";
import { ErrorDescriptions } from "../../shared/utils/error.descriptions";
import {buildWindowsForDate} from "../../../old/domain/wokibrain";

export class FindSeatsByRestaurantIdUsecase implements FindSeatsByRestaurantIdQuery {

    constructor(
        private readonly getRestaurantByIdRepository: GetRestaurantByIdRepository,
        private readonly getSectorByIdRepository: GetSectorByIdRepository,
        private readonly findTablesBySectorIdRepository: FindTablesBySectorIdRepository,
        private readonly findBookingsByFiltersRepository: FindBookingsByFiltersRepository,
    ) {
    }

    async execute(command: FindSeatsByRestaurantIdQuery.Command): Promise<any[]> {
        logger.info("Executing seat discovery in WokiBrain");

        const {restaurantId, sectorId, partySize, duration, date} = command;

        const restaurant: Restaurant | null = await this.getRestaurantByIdRepository.execute(restaurantId);
        if (!restaurant) throw new NotFoundException(ErrorDescriptions.RESTAURANT_NOT_FOUND);

        const sector: Sector | null = await this.getSectorByIdRepository.execute(sectorId);
        if (!sector) throw new NotFoundException(ErrorDescriptions.SECTOR_NOT_FOUND);

        const tables: Table[] = await this.findTablesBySectorIdRepository.execute(sectorId);
        if (tables.length === 0) throw new NotFoundException(ErrorDescriptions.NO_TABLES_FOUND);

        const bookings = await this.findBookingsByFiltersRepository.execute(restaurantId, sectorId);

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

            const {min: comboMin, max: comboMax} = computeComboCapacity(combo);

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

    return {min, max};
};

const generateLockKey = (restaurantId: string, sectorId: string, candidateToBooking: any) => {
    return `${restaurantId}|${sectorId}|${candidateToBooking.tableIds.sort().join("+")}|${candidateToBooking.start}`;
}