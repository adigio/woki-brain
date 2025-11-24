import {FindBookingByDateQuery} from "../port/in/find.booking.by.date.query";
import {logger} from "../../index";
import {NotFoundException} from "../../../old/domain/exception/not.found.exception";
import {ErrorDescriptions} from "../../../old/shared/error.descriptions";
import {Booking} from "../../../old/domain/model/booking.model";
import {GetRestaurantByIdRepository} from "../port/out/get.restaurant.by.id.repository";
import {GetSectorByIdRepository} from "../port/out/get.sector.by.id.repository";
import {FindBookingsByFiltersRepository} from "../port/out/find.bookings.by.filters.repository";

export class FindBookingByDateUsecase implements FindBookingByDateQuery {

    constructor(
        private readonly getRestaurantByIdRepository: GetRestaurantByIdRepository,
        private readonly getSectorByIdRepository: GetSectorByIdRepository,
        private readonly findBookingsByFiltersRepository: FindBookingsByFiltersRepository
    ) {}

    async execute(query: FindBookingByDateQuery.Command): Promise<Booking[]> {
        logger.info("Fetching bookings by date in WokiBrain");

        const { restaurantId, sectorId, date } = query;

        const restaurant = this.getRestaurantByIdRepository.execute(restaurantId);
        if (!restaurant) throw new NotFoundException(ErrorDescriptions.RESTAURANT_NOT_FOUND);

        const sector = this.getSectorByIdRepository.execute(sectorId);
        if (!sector) throw new NotFoundException(ErrorDescriptions.SECTOR_NOT_FOUND);

        return await this.findBookingsByFiltersRepository.execute(restaurantId, sectorId, date);
    }

}