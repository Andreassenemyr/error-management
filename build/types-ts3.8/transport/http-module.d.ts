/// <reference types="node" />
import { ClientRequest, IncomingHttpHeaders, RequestOptions as HTTPRequestOptions } from 'node:http';
import { RequestOptions as HTTPSRequestOptions } from 'node:https';
export type HTTPModuleRequestOptions = HTTPRequestOptions | HTTPSRequestOptions | string | URL;
/**
 * Cut version of http.IncomingMessage.
 * Some transports work in a special Javascript environment where http.IncomingMessage is not available.
 */
export interface HTTPModuleRequestIncomingMessage {
    headers: IncomingHttpHeaders;
    statusCode?: number;
    on(event: 'data' | 'end', listener: () => void): void;
    setEncoding(encoding: string): void;
}
/**
 * Internal used interface for typescript.
 * @hidden
 */
export interface HTTPModule {
    request(options: HTTPModuleRequestOptions, callback?: (res: HTTPModuleRequestIncomingMessage) => void): ClientRequest;
}
//# sourceMappingURL=http-module.d.ts.map
