export interface DiscoverSeatsResponse {
    slotMinutes: number;
    duration: number;
    candidates: Array<{
        tableIds: string[];
        start: string;
        end: string;
    }>;
}