import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"
import { BookingQuery, CreateBookingCommand, DiscoverSeatsCommand } from "./domain/wokibrain.js";

const routes = async (server: FastifyInstance) => {
    const app = server.withTypeProvider<ZodTypeProvider>();

    app.get("/discover", {
        schema: {
            querystring: z.object({
                restaurantId: z.string(),
                sectorId: z.string(),
                partySize: z.coerce.number(),
                duration: z.coerce.number(),
                date: z.string(),
                windowStart: z.string().optional(),
                windowEnd: z.string().optional(),
                limit: z.coerce.number().optional()
            })
        }
    }, async (request, reply) => {
        app.log.info(`Executing GET for seats discovery with restaurant ID ${request.query.restaurantId}`)

        const command: DiscoverSeatsCommand = {
            restaurantId: request.query.restaurantId,
            sectorId: request.query.sectorId,
            partySize: request.query.partySize,
            duration: request.query.duration,
            date: request.query.date,
            windowStart: request.query.windowStart,
            windowEnd: request.query.windowEnd,
            limit: request.query.limit
        };

        const result = await app.brain.discoverSeats(command);

        return result;
    })

    app.post("/bookings", {
        schema: {
            headers: z.object({ "idempotency-key": z.string().optional() }).loose(),
            body: z.object({
                restaurantId: z.string(),
                sectorId: z.string(),
                partySize: z.number().positive(),
                durationMinutes: z.number(),
                date: z.string(),
                windowStart: z.string().optional(),
                windowEnd: z.string().optional()
            })
        }
    }, async (request, reply) => {
        app.log.info(`Executing POST for booking creation with restaurant ID ${request.body.restaurantId}`)

        const idempotencyKey = request.headers["idempotency-key"] as string | undefined;

        const command: CreateBookingCommand = {
            restaurantId: request.body.restaurantId,
            sectorId: request.body.sectorId,
            partySize: request.body.partySize,
            durationMinutes: request.body.durationMinutes,
            date: request.body.date,
            windowStart: request.body.windowStart,
            windowEnd: request.body.windowEnd
        };

        const result = app.brain.createBooking(command, idempotencyKey);

        reply.code(201)
        return { message: "Create Woki booking - Not implemented yet" }
    });


    app.get("/bookings/day", {
        schema: {
            querystring: z.object({
                restaurantId: z.string(),
                sectorId: z.string(),
                date: z.string()
            })
        }
    }, async (request, reply) => {
        app.log.info(`Executing GET bookings for restaurant with ID ${request.query.restaurantId} on date ${request.query.date}`)

        const command: BookingQuery = {
            restaurantId: request.query.restaurantId,
            sectorId: request.query.sectorId,
            date: request.query.date
        };

        const result = app.brain.getBookingsByDate(command);

        return { message: "Get Woki bookings - Not implemented yet" }
    })


    app.delete("/bookings/:id", {
        schema: {
            params: z.object({
                id: z.string()
            })
        }
    }, async (request, reply) => {
        app.log.info(`Executing DELETE booking with ID `)

        reply.code(204)
    })
}

export default routes;
