import { BusinessException } from "./BusinessException.js";

export class NotFoundException extends BusinessException {
    constructor(detail?: string) {
        super(404, "not_found", detail);
    }
}