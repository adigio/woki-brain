import { BusinessException } from "./business.exception";

export class ConflictException extends BusinessException {
  constructor(message: string, detail?: string) {
    super(409, message, detail);
  }
}