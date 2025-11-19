export const ErrorDescriptions = {
    INTERNAL_ERROR: "internal_error",
    BAD_REQUEST: "bad_request",
    IDEMPOTENCY_KEY_MISSING: "Idempotency-Key header is not present",
    RESTAURANT_NOT_FOUND: "Restaurant not found",
    SECTOR_NOT_FOUND: "Sector not found",
    BOOKING_NOT_FOUND: "Booking not found",
    INCORRECT_SECTOR_FOR_RESTAURANT: "The sector does not belong to the specified restaurant",
    NO_TABLES_FOUND: "No tables found for the sector",
    NO_CAPACITY_AVAILABLE: "No single or combo gap fits duration within window",
    SLOT_TAKEN: "Slot was already taken",
};