/// <reference types="node" />
import { ClientRequest, IncomingHttpHeaders, RequestOptions as HTTPRequestOptions } from 'node:http';
import { RequestOptions as HTTPSRequestOptions } from 'node:https';
export type HTTPModuleRequestOptions = HTTPRequestOptions | HTTPSRequestOptions | string | URL;
export interface HTTPModuleRequestIncomingMessage {
    headers: IncomingHttpHeaders;
    statusCode?: number;
    on(event: 'data' | 'end', listener: () => void): void;
    setEncoding(encoding: string): void;
}
export interface HTTPModule {
    /**
     * Request wrapper
     * @param options These are {@see TransportOptions}
     * @param callback Callback when request is finished
     */
    request(options: HTTPModuleRequestOptions, callback?: (res: HTTPModuleRequestIncomingMessage) => void): ClientRequest;
}
//# sourceMappingURL=http-module.d.ts.map
