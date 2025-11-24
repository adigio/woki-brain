import {CreateBookingCommand} from "../port/in/create.booking.command";
import {logger} from "../../index";

import {DateTime} from "luxon";
import {Booking} from "../../../old/domain/model/booking.model";
import {BadRequestException} from "../exception/bad.request.exception";
import {ErrorDescriptions} from "../../shared/utils/error.descriptions";
import {ConflictException} from "../exception/conflict.exception";
import {ErrorMessages} from "../../shared/utils/error.messages";
import {GetIdempotencyRepository} from "../port/out/get.idempotency.repository";
import {GetLockRepository} from "../port/out/get.lock.repository";
import {CreateIdempotencyRepository} from "../port/out/create.idempotency.repository";
import {CreateBookingRepository} from "../port/out/create.booking.repository";
import {ReleaseLockRepository} from "../port/out/release.lock.repository";

export class CreateBookingUsecase implements CreateBookingCommand {

    constructor(
        private readonly getIdempotencyRepository: GetIdempotencyRepository,
        private readonly getLockRepository: GetLockRepository,
        private readonly createIdempotencyRepository: CreateIdempotencyRepository,
        private readonly createBookingRepository: CreateBookingRepository,
        private readonly releaseLockRepository: ReleaseLockRepository,
    ) {
    }

    async execute(command: CreateBookingCommand.Command): Promise<Booking> {
        logger.info("Executing booking creation in WokiBrain");

        const { idempotencyKey } = command;

        if (!idempotencyKey) throw new BadRequestException(ErrorDescriptions.IDEMPOTENCY_KEY_MISSING);

        const existing: string | null = await this.getIdempotencyRepository.execute(idempotencyKey);
        if (existing) return existing.response;

        const {
            restaurantId,
            sectorId,
            partySize,
            durationMinutes,
            date,
            windowStart,
            windowEnd
        } = command;

        const candidates = await this.discoverSeats({
            restaurantId,
            sectorId,
            partySize,
            duration: durationMinutes,
            date,
            windowStart,
            windowEnd,
            limit: 1
        });

        if (!candidates.length) {
            throw new ConflictException(ErrorMessages.NO_CAPACITY, ErrorDescriptions.NO_CAPACITY_AVAILABLE);
        }

        const candidate = candidates[0];

        const lockKey = generateLockKey(restaurantId, sectorId, candidate);
        this.getLockRepository.execute(lockKey);

        try {
            const existingBookings = this.store.findBookingsByRestaurantAndSector(restaurantId, sectorId);

            for (const booking of existingBookings) {
                if (booking.status !== "CONFIRMED") continue;

                const overlaps =
                    booking.tableIds.some((id: string) => candidate.tableIds.includes(id)) &&
                    !(DateTime.fromISO(candidate.end) <= DateTime.fromISO(booking.start) ||
                        DateTime.fromISO(candidate.start) >= DateTime.fromISO(booking.end));

                if (overlaps) {
                    throw new ConflictException(ErrorMessages.NO_CAPACITY, ErrorDescriptions.SLOT_TAKEN);
                }
            }

            const id: string = this.store.generateBookingId();
            const dateNow: string = DateTime.now().toISO();

            const savedBooking: Booking = {
                id,
                restaurantId,
                sectorId,
                tableIds: candidate.tableIds,
                partySize,
                start: candidate.start,
                end: candidate.end,
                durationMinutes,
                status: "CONFIRMED",
                createdAt: dateNow,
                updatedAt: dateNow
            };

            await this.createBookingRepository.execute(savedBooking);

            await this.createIdempotencyRepository.execute(idempotencyKey, {
                response: savedBooking,
                expiresAt: DateTime.now().plus({ seconds: 60 }).toMillis()
            });

            return savedBooking;
        } finally {
            await this.releaseLockRepository.execute(lockKey);
        }
    }
}