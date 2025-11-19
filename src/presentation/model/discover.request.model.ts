import { z } from "zod"

export const DiscoverRequest = z.object({
    restaurantId: z.string(),
    sectorId: z.string(),
    partySize: z.coerce.number(),
    duration: z.coerce.number(),
    date: z.string(),
    windowStart: z.string().optional(),
    windowEnd: z.string().optional(),
    limit: z.coerce.number().optional()
})