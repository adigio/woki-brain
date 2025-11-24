import {FastifyInstance} from "fastify";
import BookingControllerAdapter from "../../../adapter/in/controller/booking.controller.adapter";

export async function registerControllerModules(app: FastifyInstance) {
    app.register(BookingControllerAdapter, { prefix: "/woki" });
}