import z from "zod";

export const BookingDateRequest = z.object({
    restaurantId: z.string(),
    sectorId: z.string(),
    date: z.string()
})