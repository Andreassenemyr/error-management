/// <reference types="node" />
/**
 * https://github.com/TooTallNate/proxy-agents/tree/b133295fd16f6475578b6b15bd9b4e33ecb0d0b7
*/
import * as http from 'node:http';
import * as https from 'node:https';
import { Readable } from 'node:stream';
export type ThenableRequest = http.ClientRequest & {
    then: Promise<http.IncomingMessage>['then'];
};
export declare function toBuffer(stream: Readable): Promise<Buffer>;
export declare function json(stream: Readable): Promise<any>;
export declare function req(url: string | URL, opts?: https.RequestOptions): ThenableRequest;
//# sourceMappingURL=helpers.d.ts.map
