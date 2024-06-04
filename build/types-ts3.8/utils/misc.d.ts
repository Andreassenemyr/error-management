import { Event } from "../types";
import { Mechanism } from "../types/mechanism";
export declare function checkOrSetAlreadyCaught(exception: unknown): boolean;
export declare function isMatchingPattern(value: string, pattern: RegExp | string, requireExactStringMatch?: boolean): boolean;
export declare function stringMatchesSomePattern(testString: string, patterns?: Array<string | RegExp>, requireExactStringMatch?: boolean): boolean;
export declare function parseSampleRate(sampleRate: unknown): number | undefined;
export declare function addExceptionTypeValue(event: Event, value?: string, type?: string): void;
export declare function addExceptionMechanism(event: Event, newMechanism?: Partial<Mechanism>): void;
//# sourceMappingURL=misc.d.ts.map
