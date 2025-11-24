export interface DeleteBookingByIdCommand {
    execute(id: string): Promise<void>;
}