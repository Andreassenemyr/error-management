import { Mechanism } from "./mechanism";
import { Stacktrace } from "./stacktrace";

export interface Exception {
    type?: string;
    value?: string;
    mechanism?: Mechanism;
    module?: string;
    thread_id?: number;
    stacktrace?: Stacktrace;
}