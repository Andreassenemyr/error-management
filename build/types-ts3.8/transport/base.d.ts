import { InternalBaseTransportOptions, Transport, TransportMakeRequestResponse, TransportRequestExecutor } from "../transport";
import { Envelope } from "../types";
import { PromiseBuffer } from "./promisebuffer";
export type RateLimits = Record<string, string>;
export declare function createTransport(options: InternalBaseTransportOptions, makeRequest: TransportRequestExecutor, buffer?: PromiseBuffer<TransportMakeRequestResponse>): Transport;
export declare function forEachEnvelopeItem<E extends Envelope>(envelope: Envelope, callback: (envelopeItem: E[1][number], envelopeItemType: E[1][number][0]['type']) => boolean | void): boolean;
//# sourceMappingURL=base.d.ts.map
