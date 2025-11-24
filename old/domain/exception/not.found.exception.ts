import { BusinessException } from "./business.exception";

export class NotFoundException extends BusinessException {
    constructor(detail?: string) {
        super(404, "not_found", detail);
    }
}