import { logger } from "../../src";
import { DateTime } from "luxon";
import { Table } from "./model/table.model";
import { Booking } from "./model/booking.model";

 interface Interval {
    start: DateTime;
    end: DateTime;
}

export function computeGaps(
    bookings: Interval[],
    windowStart: DateTime,
    windowEnd: DateTime
): Interval[] {
    const sortedIntervals = sortIntervals(bookings);
    const gaps: Interval[] = [];

    let currentEnd = windowStart;

    for (const interval of sortedIntervals) {
        if (interval.start > currentEnd) {
            gaps.push({ start: currentEnd, end: interval.start });
        }
        if (interval.end > currentEnd) {
            currentEnd = interval.end;
        }
    }

    if (currentEnd < windowEnd) {
        gaps.push({ start: currentEnd, end: windowEnd });
    }

    return gaps;
}

export function sortIntervals(intervals: Interval[]): Interval[] {
    return intervals.slice().sort((a, b) => a.start.toMillis() - b.start.toMillis());
}

export const getComboGaps = (
    combo: Table[],
    bookings: Booking[],
    window: { start: DateTime; end: DateTime }
) => {
    const gapList = combo.map(table => {
        const tableBookings = bookings
            .filter(b => b.tableIds.includes(table.id))
            .map(b => ({
                start: DateTime.fromISO(b.start),
                end: DateTime.fromISO(b.end)
            }));

        return computeGaps(tableBookings, window.start, window.end);
    });

    return intersectMany(gapList);
};

export function intersectTwo(a: Interval[], b: Interval[]): Interval[] {
    const result: Interval[] = [];

    let i = 0;
    let j = 0;

    while (i < a.length && j < b.length) {
        const A = a[i];
        const B = b[j];

        const latestStart = A.start > B.start ? A.start : B.start;
        const earliestEnd = A.end < B.end ? A.end : B.end;

        if (latestStart < earliestEnd) {
            result.push({ start: latestStart, end: earliestEnd });
        }

        if (A.end < B.end) i++;
        else j++;
    }

    return result;
}

export function intersectMany(list: Interval[][]): Interval[] {
    if (list.length === 0) return [];
    if (list.length === 1) return list[0];

    let result = list[0];
    for (let i = 1; i < list.length; i++) {
        result = intersectTwo(result, list[i]);
        if (result.length === 0) break;
    }
    return result;
}

export function findEarliestSlot(
    gap: Interval,
    durationMinutes: number
): Interval | null {
    const durationMs = durationMinutes * 60_000;

    const gapMs = gap.end.toMillis() - gap.start.toMillis();
    if (gapMs < durationMs) return null;

    return {
        start: gap.start,
        end: gap.start.plus({ minutes: durationMinutes })
    };
}
