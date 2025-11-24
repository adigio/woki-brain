import { ISODateTime } from "../types";
import { Window } from "./window.model";

export interface Restaurant {
    id: string;
    name: string;
    timezone: string;
    windows?: Array<Window>;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}