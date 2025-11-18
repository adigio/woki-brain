import { ISODateTime } from "./ISODateTime.js";

export interface Restaurant {
    id: string;
    name: string;
    timezone: string;
    windows?: Array<{ start: string; end: string }>;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}