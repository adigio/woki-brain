import {FastifyInstance} from "fastify";
import {FindSeatsByRestaurantIdUsecase} from "../../../application/usecase/find.seats.by.restaurant.id.usecase";
import {FindBookingByDateUsecase} from "../../../application/usecase/find.booking.by.date.usecase";
import {CreateBookingUsecase} from "../../../application/usecase/create.booking.usecase";
import {DeleteBookingByIdUsecase} from "../../../application/usecase/delete.booking.by.id.usecase";

export async function registerPortInModules(app: FastifyInstance) {
    app.decorate("findSeatsByRestaurantIdQuery", new FindSeatsByRestaurantIdUsecase());
    app.decorate("findBookingByDate", new FindBookingByDateUsecase());
    app.decorate("createBooking", new CreateBookingUsecase());
    app.decorate("deleteBookingById", new DeleteBookingByIdUsecase());
}