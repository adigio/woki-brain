export interface CreateBookingCommand {
    execute(command: CreateBookingCommand.Command): Promise<void>;
}

export namespace CreateBookingCommand {
    export interface Command {
        idempotencyKey: string | undefined;
        restaurantId: string;
        sectorId: string;
        partySize: number;
        durationMinutes: number;
        date: string;
        windowStart?: string;
        windowEnd?: string;
    }
}