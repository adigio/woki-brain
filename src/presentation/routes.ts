import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"
import { BookingQuery, CreateBookingCommand, DiscoverSeatsCommand } from "../domain/wokibrain.js";
import { DiscoverRequest } from "./model/discover.request.model.js";
import { BookingRequest } from "./model/booking.request.model.js";
import { BookingDateRequest } from "./model/booking.date.request.model.js";
import { DiscoverSeatsResponse } from "./model/discover.response.model.js";
import { Booking } from "../domain/model/booking.model.js";
import { BookingResponse } from "./model/booking.response.model.js";

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
            headers: z.object({ "idempotency-key": z.string() }),
            body: BookingRequest
        }
    }, async (request, reply) => {
        app.log.info(`Executing POST for booking creation with restaurant ID ${request.body.restaurantId}`)

        const idempotencyKey = request.headers["idempotency-key"] as string | undefined;

        const bookingResult: Booking = await app.brain.createBooking(buildBookingCommand(request.body), idempotencyKey);

        const response: BookingResponse = buildBookingResponse(bookingResult);

        reply.code(201).send(response);
    });


    app.get("/bookings/day", {
        schema: { querystring: BookingDateRequest }
    }, async (request, reply) => {
        app.log.info(`Executing GET bookings for restaurant with ID ${request.query.restaurantId} on date ${request.query.date}`)

        const result: Booking[] = await app.brain.getBookingsByDate(buildBookingQuery(request.query));

        const response = {
            date: request.query.date,
            items: result.map(b => buildBookingResponse(b))
        }

        reply.code(200).send(response);
    })

    app.delete("/bookings/:id", {
        schema: {
            params: z.object({
                id: z.string()
            })
        }
    }, async (request, reply) => {
        app.log.info(`Executing DELETE booking with ID ${request.params.id}`)

        await app.brain.cancelBooking(request.params.id);

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

const buildBookingResponse = (booking: Booking): BookingResponse => {
    return {
        id: booking.id,
        restaurantId: booking.restaurantId,
        sectorId: booking.sectorId,
        tableIds: booking.tableIds,
        partySize: booking.partySize,
        start: booking.start,
        end: booking.end,
        durationMinutes: booking.durationMinutes,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
    }
}


export default routes;
