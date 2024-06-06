/// <reference types="node" />
import { BaseTransportOptions, Transport } from "../../transport";
import type { HTTPModule } from './http-module';
export interface NodeTransportOptions extends BaseTransportOptions {
    headers?: Record<string, string>;
    proxy?: string;
    caCerts?: string | Buffer | Array<string | Buffer>;
    httpModule?: HTTPModule;
    keepAlive?: boolean;
}
export declare function makeNodeTransport(options: NodeTransportOptions): Transport;
//# sourceMappingURL=http.d.ts.map