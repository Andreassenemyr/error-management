/// <reference types="node" />
/**
 * https://github.com/TooTallNate/proxy-agents/tree/b133295fd16f6475578b6b15bd9b4e33ecb0d0b7
*/
import { IncomingHttpHeaders } from 'node:http';
import { Readable } from 'node:stream';
export interface ConnectResponse {
    statusCode: number;
    statusText: string;
    headers: IncomingHttpHeaders;
}
export declare function parseProxyResponse(socket: Readable): Promise<{
    connect: ConnectResponse;
    buffered: Buffer;
}>;
//# sourceMappingURL=parse-proxy-response.d.ts.map
