import { BusinessException } from "./business.exception.js";

export class BadRequestException extends BusinessException {
    constructor(detail?: string) {
        super(400, "bad_request", detail);
    }
}