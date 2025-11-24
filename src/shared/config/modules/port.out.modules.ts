import {FastifyInstance} from "fastify";
import {WokiBrain} from "../../../../old/domain/wokibrain";
import {DB} from "../../../../old/infrastructure/store/db";

export async function registerPortOutModules(app: FastifyInstance) {
    app.decorate("store", new DB());
    app.decorate("brain", new WokiBrain(new DB()));

    app.decorate("")

}