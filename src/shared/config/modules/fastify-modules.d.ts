export {}

declare module 'fastify' {
    import {FindSeatsByRestaurantIdQuery} from "../../../application/port/in/find.seats.by.restaurant.id.query";
    import {FindBookingByDateQuery} from "../../../application/port/in/find.booking.by.date.query";
    import {DeleteBookingByIdCommand} from "../../../application/port/in/delete.booking.by.id.command";
    import {CreateBookingCommand} from "../../../application/port/in/create.booking.command";

    interface FastifyInstance {
        createBookingCommand: CreateBookingCommand;
        findSeatsByRestaurantIdQuery: FindSeatsByRestaurantIdQuery;
        findBookingByDateQuery: FindBookingByDateQuery;
        deleteBookingByIdCommand: DeleteBookingByIdCommand;
    }
}