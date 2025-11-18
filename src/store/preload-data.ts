import { FastifyInstance } from "fastify";
import seed from "../../resources/seed.json" with { type: "json" };

const preloadData = async (app: FastifyInstance) => {

    app.store.restaurants.set(seed.restaurant.id, seed.restaurant);
    app.store.sectors.set(seed.sector.id, seed.sector);
    seed.tables.forEach(t => app.store.tables.set(t.id, t));
    //seed.bookings.forEach(b => app.store.saveBooking(b));

};

export default preloadData;