export interface FindSeatsByRestaurantIdQuery {
    execute(command: FindSeatsByRestaurantIdQuery.Command): Promise<any[]>;
}

export namespace FindSeatsByRestaurantIdQuery {
    export interface Command {
        restaurantId: string;
        sectorId: string;
        partySize: number;
        duration: number;
        date: string;
        windowStart?: string;
        windowEnd?: string;
        limit?: number;
    }
}