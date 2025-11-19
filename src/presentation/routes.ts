import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"
import { BookingQuery, CreateBookingCommand, DiscoverSeatsCommand } from "../domain/wokibrain.js";
import { DiscoverRequest } from "./model/discover.request.model.js";
import { BookingRequest } from "./model/booking.request.model.js";
import { BookingDateRequest } from "./model/booking.date.request.model.js";
import { DiscoverSeatsResponse } from "./model/discover.response.model.js";

const routes = async (server: FastifyInstance) => {
    const app = server.withTypeProvider<ZodTypeProvider>();

    app.get("/discover", {
        schema: { querystring: DiscoverRequest }
    }, async (request, reply) => {
        app.log.info(`Executing GET for seats discovery with restaurant ID ${request.query.restaurantId}`)

        const result = await app.brain.discoverSeats(buildDiscoverSeatsCommand(request.query));

        const response: DiscoverSeatsResponse = {
            slotMinutes: 15,
            duration: request.query.duration,
            candidates: result
        }

        return response;
    })

    app.post("/bookings", {
        schema: {
            headers: z.object({ "idempotency-key": z.string().optional() }).loose(),
            body: BookingRequest
        }
    }, async (request, reply) => {
        app.log.info(`Executing POST for booking creation with restaurant ID ${request.body.restaurantId}`)

        const idempotencyKey = request.headers["idempotency-key"] as string | undefined;

        const result = app.brain.createBooking(buildBookingCommand(request.body), idempotencyKey);


        reply.code(201)
        return { message: "Create Woki booking - Not implemented yet" }
    });


    app.get("/bookings/day", {
        schema: { querystring: BookingDateRequest }
    }, async (request, reply) => {
        app.log.info(`Executing GET bookings for restaurant with ID ${request.query.restaurantId} on date ${request.query.date}`)

        const result = app.brain.getBookingsByDate(buildBookingQuery(request.query));

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

        const result = app.brain.cancelBooking(request.params.id);

        reply.code(204)
    })
}

const buildDiscoverSeatsCommand = (request: any): DiscoverSeatsCommand => {
    return {
        restaurantId: request.restaurantId,
        sectorId: request.sectorId,
        partySize: request.partySize,
        duration: request.duration,
        date: request.date,
        windowStart: request.windowStart,
        windowEnd: request.windowEnd,
        limit: request.limit
    }
};

const buildBookingCommand = (request: any): CreateBookingCommand => {
    return {
        restaurantId: request.restaurantId,
        sectorId: request.sectorId,
        partySize: request.partySize,
        durationMinutes: request.durationMinutes,
        date: request.date,
        windowStart: request.windowStart,
        windowEnd: request.windowEnd
    };
}

const buildBookingQuery = (request: any): BookingQuery => {
    return {
        restaurantId: request.restaurantId,
        sectorId: request.sectorId,
        date: request.date
    }
}


export default routes;
