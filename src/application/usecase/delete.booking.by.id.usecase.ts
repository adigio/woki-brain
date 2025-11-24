import {DeleteBookingByIdCommand} from "../port/in/delete.booking.by.id.command";
import {logger} from "../../index";
import {GetBookingByIdRepository} from "../port/out/get.booking.by.id.repository";
import {DeleteBookingByIdRepository} from "../port/out/delete.booking.by.id.repository";
import {NotFoundException} from "../exception/not.found.exception";
import {ErrorDescriptions} from "../../shared/utils/error.descriptions";

export class DeleteBookingByIdUsecase implements DeleteBookingByIdCommand {

    constructor(
        private readonly getBookingByIdRepository: GetBookingByIdRepository,
        private readonly deleteBookingByIdRepository: DeleteBookingByIdRepository
    ) {
    }

    async execute(id: string): Promise<void> {
        logger.info(`Cancelling booking with ID ${id} in WokiBrain`);

        const booking = await this.getBookingByIdRepository.execute(id);

        if (!booking) throw new NotFoundException(ErrorDescriptions.BOOKING_NOT_FOUND);

        if (booking.status === "CANCELLED") {
            return;
        }

        await this.deleteBookingByIdRepository.execute(booking.id);
    }
}