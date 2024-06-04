import { BrowserOptions, Client } from "./client";
import { ClientOptions } from "./options";
export declare function init(options?: BrowserOptions): void;
export type ClientClass<F extends Client, O extends ClientOptions> = new (options: O) => F;
//# sourceMappingURL=init.d.ts.map
