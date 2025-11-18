import { ISODateTime } from "./ISODateTime.js";

export interface Sector {
    id: string;
    restaurantId: string;
    name: string;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}