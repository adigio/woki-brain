import { ISODateTime } from "./ISODateTime.js";

export interface Table {
    id: string;
    sectorId: string;
    name: string;
    minSize: number;
    maxSize: number;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}