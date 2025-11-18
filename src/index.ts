import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { MemoryStore } from "./store/db.js";
import { WokiBrain } from "./domain/wokibrain.js";
import routes from "./routes.js";
import { Gaps } from "./domain/gaps.js";
import preloadData from "./store/preload-data.js";

declare module 'fastify' {
    interface FastifyInstance {
        store: MemoryStore;
        brain: WokiBrain;
        gaps: Gaps;
    }
}

const store = new MemoryStore();
const wokiBrain = new WokiBrain(store);
const gaps = new Gaps();

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

app.decorate("db", store);
app.decorate("brain", wokiBrain);
app.decorate("gaps", gaps);


app.register(preloadData);
app.register(routes, { prefix: "/woki" });

app.listen({ port: 8080 }, (err, address) => {

    if (err) {
        console.error(err)
        process.exit(1)
    }
})

export const logger = app.log;