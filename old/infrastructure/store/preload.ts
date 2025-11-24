import { FastifyInstance } from "fastify";
import fs from "fs";
import { Booking } from "../../domain/model/booking.model";
import { Table } from "../../domain/model/table.model";

const preloadData = async (app: FastifyInstance) => {
    const jsonPath = new URL("../../resources/seed.json", import.meta.url);
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const seed = JSON.parse(raw);

    app.store.restaurants.set(seed.restaurant.id, seed.restaurant);
    app.store.sectors.set(seed.sector.id, seed.sector);

    seed.tables.forEach((t: any) => app.store.tables.set(t.id, t as Table));
    seed.bookings.forEach((b: any) => app.store.saveBooking(b as Booking));
};

export default preloadData;