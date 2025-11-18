import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod";

export function registerRoutes(server: FastifyInstance) {
    const app = server.withTypeProvider<ZodTypeProvider>()
    
    app.get("/woki/discover", async (request, reply) => {
        return { message: "Discover Woki devices - Not implemented yet" }
    })

    app.post("/woki/bookings", async (request, reply) => {
        return { message: "Create Woki booking - Not implemented yet" }
    });

    app.get("/woki/bookings", async (request, reply) => {
        return { message: "Get Woki bookings - Not implemented yet" }
    })
}
