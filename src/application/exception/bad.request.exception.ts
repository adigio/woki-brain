import { BusinessException } from "./business.exception";

export class BadRequestException extends BusinessException {
    constructor(detail?: string) {
        super(400, "bad_request", detail);
    }
}