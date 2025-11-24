import fastify from "fastify";
import {serializerCompiler, validatorCompiler} from "fastify-type-provider-zod";
import preloadData from "../old/infrastructure/store/preload.js";
import {BusinessException} from "../old/domain/exception/business.exception";

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

await preloadData(app);

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