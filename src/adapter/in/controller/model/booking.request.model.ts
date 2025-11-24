import z from "zod";

export const BookingRequest = z.object({
    restaurantId: z.string(),
    sectorId: z.string(),
    partySize: z.number().positive(),
    durationMinutes: z.number(),
    date: z.string(),
    windowStart: z.string().optional(),
    windowEnd: z.string().optional()
})

export type BookingRequest = z.infer<typeof BookingRequest>;