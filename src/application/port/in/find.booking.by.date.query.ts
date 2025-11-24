import {Booking} from "../../model/booking.model";

export interface FindBookingByDateQuery {
    execute(query: FindBookingByDateQuery.Command): Promise<Booking[]>;
}

export namespace FindBookingByDateQuery {
    export interface Command {
        restaurantId: string;
        sectorId: string;
        date: string;
    }
}