import { ISODateTime } from "../types";

export interface Table {
    id: string;
    sectorId: string;
    name: string;
    minSize: number;
    maxSize: number;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}