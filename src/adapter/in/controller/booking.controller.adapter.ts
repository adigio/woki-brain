import {FastifyInstance} from "fastify"
import {ZodTypeProvider} from "fastify-type-provider-zod";
import {z} from "zod"
import {DiscoverRequest} from "./model/discover.request.model";
import {BookingRequest} from "./model/booking.request.model";
import {BookingDateRequest} from "./model/booking.date.request.model";
import {DiscoverSeatsResponse} from "./model/discover.response.model";
import {BookingResponse} from "./model/booking.response.model";
import {Booking} from "../../../application/model/booking.model";
import {FindSeatsByRestaurantIdQuery} from "../../../application/port/in/find.seats.by.restaurant.id.query";
import {FindBookingByDateQuery} from "../../../application/port/in/find.booking.by.date.query";
import {CreateBookingCommand} from "../../../application/port/in/create.booking.command";

const BookingControllerAdapter = async (server: FastifyInstance) => {
    const app = server.withTypeProvider<ZodTypeProvider>();

    app.get("/discover", {
        schema: { querystring: DiscoverRequest }
    }, async (request): Promise<DiscoverSeatsResponse> => {
        app.log.info(`Executing GET for seats discovery with restaurant ID ${request.query.restaurantId}`)

        const result = await app.findSeatsByRestaurantIdQuery.execute(buildFindSeatsByRestaurantIdCommand(request.query));

        return buildDiscoverSeatsResponse(request.query.duration, result);
    })

    app.post("/bookings", {
        schema: {
            headers: z.object({ "idempotency-key": z.string() }),
            body: BookingRequest
        }
    }, async (request, reply) => {
        app.log.info(`Executing POST for booking creation with restaurant ID ${request.body.restaurantId}`)

        const idempotencyKey = request.headers["idempotency-key"] as string | undefined;

        const bookingResult: Booking = await app.createBookingCommand.execute(buildCreateBookingCommand(idempotencyKey, request.body), idempotencyKey);

        const response: BookingResponse = buildBookingResponse(bookingResult);

        reply.code(201).send(response);
    });


    app.get("/bookings/day", {
        schema: { querystring: BookingDateRequest }
    }, async (request, reply) => {
        app.log.info(`Executing GET bookings for restaurant with ID ${request.query.restaurantId} on date ${request.query.date}`)

        const result: Booking[] = await app.findBookingByDateQuery.execute(buildFindBookingByDateQueryCommand(request.query));

        const response = {
            date: request.query.date,
            items: result.map(b => buildBookingResponse(b))
        }

        reply.code(200).send(response);
    })

    app.delete("/bookings/:id", {
        schema: { params: z.object({ id: z.string() }) }
    }, async (request, reply) => {
        app.log.info(`Executing DELETE booking with ID ${request.params.id}`)

        await app.deleteBookingByIdCommand.execute(request.params.id);

        reply.code(204)
    })
}

const buildFindSeatsByRestaurantIdCommand = (
    request: DiscoverRequest
): FindSeatsByRestaurantIdQuery.Command => {
    return {
        restaurantId: request.restaurantId,
        sectorId: request.sectorId,
        partySize: request.partySize,
        duration: request.duration,
        date: request.date,
        windowStart: request.windowStart,
        windowEnd: request.windowEnd,
        limit: request.limit
    };
};

const buildCreateBookingCommand = (
    idempotencyKey: string | undefined,
    request: BookingRequest
): CreateBookingCommand.Command => {
    return {
        idempotencyKey: idempotencyKey,
        restaurantId: request.restaurantId,
        sectorId: request.sectorId,
        partySize: request.partySize,
        durationMinutes: request.durationMinutes,
        date: request.date,
        windowStart: request.windowStart,
        windowEnd: request.windowEnd
    };
}

const buildFindBookingByDateQueryCommand = (
    request: BookingDateRequest
): FindBookingByDateQuery.Command => {
    return {
        restaurantId: request.restaurantId,
        sectorId: request.sectorId,
        date: request.date
    }
}

const buildDiscoverSeatsResponse = (
    duration: number,
    result: any
): DiscoverSeatsResponse => {
    return {
        slotMinutes: 15,
        duration: duration,
        candidates: result
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

export default BookingControllerAdapter;
