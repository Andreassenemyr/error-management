/// <reference types="node" />
import * as http from 'node:http';
import { OutgoingHttpHeaders } from 'node:http';
import * as net from 'node:net';
import * as tls from 'node:tls';
import { Agent } from './base';
import { AgentConnectOpts } from './base';
type Protocol<T> = T extends string ? Protocol : never;
type ConnectOptsMap = {
    http: Pick<net.TcpNetConnectOpts, Exclude<keyof net.TcpNetConnectOpts, 'host' | 'port'>>;
    https: Pick<tls.ConnectionOptions, Exclude<keyof tls.ConnectionOptions, 'host' | 'port'>>;
};
type ConnectOpts<T> = {
    [P in keyof ConnectOptsMap]: Protocol<T> extends P ? ConnectOptsMap[P] : never;
}[keyof ConnectOptsMap];
export type HttpsProxyAgentOptions<T> = ConnectOpts<T> & http.AgentOptions & {
    headers?: OutgoingHttpHeaders | (() => OutgoingHttpHeaders);
};
export declare class HttpsProxyAgent<Uri extends string> extends Agent {
    static protocols: readonly [
        "http",
        "https"
    ];
    readonly proxy: URL;
    proxyHeaders: OutgoingHttpHeaders | (() => OutgoingHttpHeaders);
    connectOpts: net.TcpNetConnectOpts & tls.ConnectionOptions;
    constructor(proxy: Uri | URL, opts?: HttpsProxyAgentOptions<Uri>);
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     */
    connect(req: http.ClientRequest, opts: AgentConnectOpts): Promise<net.Socket>;
}
export {};
//# sourceMappingURL=index.d.ts.map
