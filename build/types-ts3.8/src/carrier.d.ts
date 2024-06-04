import { AsyncContextStrategy } from "./async-context";
export interface Carrier {
    __RIBBAN__?: RibbanCarrier;
}
interface RibbanCarrier {
    acs?: AsyncContextStrategy;
}
export interface Carrier {
    __RIBBAN__?: RibbanCarrier;
}
interface RibbanCarrier {
    acs?: AsyncContextStrategy;
    /**
     * Extra Hub properties injected by various SDKs
     */
    extensions?: {
        /** Extension methods for the hub, which are bound to the current Hub instance */
        [key: string]: Function;
    };
}
export declare function getMainCarrier(): Carrier;
export declare function getRibbanCarrier(carrier: Carrier): RibbanCarrier;
export {};
//# sourceMappingURL=carrier.d.ts.map
