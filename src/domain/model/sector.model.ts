import { ISODateTime } from "../types";

export interface Sector {
    id: string;
    restaurantId: string;
    name: string;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}