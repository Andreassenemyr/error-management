import { AsyncContextStrategy } from "./async-context";
import { GLOBAL_OBJ } from "./worldwide";

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
      // eslint-disable-next-line @typescript-eslint/ban-types
      [key: string]: Function;
    };
}

export function getMainCarrier(): Carrier {
    // This ensures a Ribban carrier exists
    getRibbanCarrier(GLOBAL_OBJ);
    return GLOBAL_OBJ;
}
  
export function getRibbanCarrier(carrier: Carrier): RibbanCarrier {
    if (!carrier.__RIBBAN__) {
        carrier.__RIBBAN__ = {
            extensions: {},
        };
    }
    return carrier.__RIBBAN__;
}