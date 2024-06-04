import { Envelope } from "./types";
export type TransportRequest = {
    body: string | Uint8Array;
};
export type TransportMakeRequestResponse = {
    statusCode?: number;
    headers?: {
        [key: string]: string | null;
        'x-ribban-rate-limits': string | null;
        'retry-after': string | null;
    };
};
export interface InternalBaseTransportOptions {
    tunnel?: string;
    bufferSize?: number;
}
export interface BaseTransportOptions extends InternalBaseTransportOptions {
    url: string;
}
export interface Transport {
    send(request: Envelope): PromiseLike<TransportMakeRequestResponse>;
    flush(timeout?: number): PromiseLike<boolean>;
}
export type TransportRequestExecutor = (request: TransportRequest) => PromiseLike<TransportMakeRequestResponse>;
//# sourceMappingURL=transport.d.ts.map
