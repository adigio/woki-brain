import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { DB } from "./store/db.js";
import { WokiBrain } from "./domain/wokibrain.js";
import routes from "./presentation/routes.js";

import preloadData from "./store/preload.js";
import { BusinessException } from "./domain/exception/business.exception.js";

declare module 'fastify' {
    interface FastifyInstance {
        store: DB;
        brain: WokiBrain;
    }
}

const store = new DB();
const wokiBrain = new WokiBrain(store);

const app = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    }
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.decorate("store", store);
app.decorate("brain", wokiBrain);

app.register(preloadData);
app.register(routes, { prefix: "/woki" });

app.setErrorHandler((err, request, reply) => {
    const error = err as Error;

    if (error.name === "ZodError") {
        reply.status(400).send({
            error: "bad_request",
            detail: (err as any).issues?.map((e: any) => e.message).join(", ")
        });
        return;
    }

    if (error instanceof BusinessException) {
        reply.status(error.status).send({
            error: error.message,
            detail: error.detail,
        });
        return;
    }

    reply.status(500).send({
        error: "internal_error",
        detail: error.message,
    });
});

app.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
})

export const logger = app.log;