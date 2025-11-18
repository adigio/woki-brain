import { logger } from "../index.js";
import { DateTime } from "luxon";

export interface Interval {
    start: DateTime;
    end: DateTime;
}

export function sortIntervals(intervals: Interval[]): Interval[] {
    return intervals.slice().sort((a, b) => a.start.toMillis() - b.start.toMillis());
}

export function computeGaps(
    bookings: Interval[],
    windowStart: DateTime,
    windowEnd: DateTime
): Interval[] {
    const sorted = sortIntervals(bookings);
    const gaps: Interval[] = [];

    let prevEnd = windowStart;

    for (const b of sorted) {
        if (b.start > prevEnd) {
            gaps.push({ start: prevEnd, end: b.start });
        }
        if (b.end > prevEnd) {
            prevEnd = b.end;
        }
    }

    if (prevEnd < windowEnd) {
        gaps.push({ start: prevEnd, end: windowEnd });
    }

    return gaps;
}

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
