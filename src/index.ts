import fastify from "fastify";
import { registerRoutes } from "./routes.js";

const server = fastify({
    logger: true
});

registerRoutes(server);

server.listen({ port: 8080 }, (err, address) => {

    if (err) {
        console.error(err)
        process.exit(1)
    }

    server.log.info(`Started WokiBrain server. Listening at ${address}`)
})