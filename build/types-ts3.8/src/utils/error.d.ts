import { ConsoleLevel } from "./logger";
export declare class RibbanError extends Error {
    message: string;
    /** Display name of this error instance. */
    name: string;
    logLevel: ConsoleLevel;
    constructor(message: string, logLevel?: ConsoleLevel);
}
//# sourceMappingURL=error.d.ts.map
