import { url } from "inspector";
import { BaseTransportOptions, Transport, TransportMakeRequestResponse, TransportRequest, TransportRequestExecutor } from "../transport";
import { HTTPModule } from "./http-module";
import { consoleSandbox } from "../utils/logger";
import { createTransport } from "./base";
import * as http from 'node:http';
import * as https from 'node:https';
import { Readable } from "stream";
import { createGzip } from "zlib";

export interface NodeTransportOptions extends BaseTransportOptions {
    headers?: Record<string, string>;
    proxy?: string;
    caCerts?: string | Buffer | Array<string | Buffer>;
    httpModule?: HTTPModule;
    keepAlive?: boolean;
};

function streamFromBody(body: Uint8Array | string): Readable {
    return new Readable({
        read() {
            this.push(body);
            this.push(null);
        },
    });
}

export function makeNodeTransport(options: NodeTransportOptions): Transport {
    let urlSegments: URL;

    try {
        urlSegments = new URL(options.url);
    } catch (error) {
        consoleSandbox(() => {
            console.warn(
                '[@ribban/error-management] Invalid DSN or tunnel option, will not send any events. The tunnel option must be a valid URL.'
            );
        })

        return createTransport(options, () => Promise.resolve({}))
    };

    const isHttps = urlSegments.protocol === 'https:';

    const nativeHttpModule = isHttps ? https : http;
    const keepAlive = options.keepAlive === undefined ? false : options.keepAlive;

    const agent = new nativeHttpModule.Agent({ keepAlive: keepAlive, maxSockets: 30, timeout: 2000 });

    const requestExecutor = createRequestExecutor(options, options.httpModule ?? nativeHttpModule, agent);
    return createTransport(options, requestExecutor);
    
};

function createRequestExecutor(
    options: NodeTransportOptions,
    httpModule: HTTPModule,
    agent: http.Agent
): TransportRequestExecutor {
    const { hostname, pathname, port, protocol, search } = new URL(options.url);

    return function makeRequest(request: TransportRequest): Promise<TransportMakeRequestResponse> {
        return new Promise((resolve, reject) => {
            let body = streamFromBody(request.body);

            const headers: Record<string, string> = { ...options.headers };

            if (request.body.length > 1024 * 32) {
                headers['Content-Encoding'] = 'gzip';
                body = body.pipe(createGzip());
            }

            const req = httpModule.request({
                method: 'POST',
                agent: agent,
                hostname: hostname,
                headers: headers,
                path: `${pathname}${search}`,
                port: port,
                protocol: protocol,
                ca: options.caCerts,
            }, response => {
                response.on('data', () => {});

                response.on('end', () => {});

                response.setEncoding('utf-8');

                const retryAfterHeader = response.headers['retry-after'] ?? null;
                const rateLimitsHeader = response.headers['x-ribban-rate-limits'] ?? null;

                resolve({
                    statusCode: response.statusCode,
                    headers: {
                        'retry-after': retryAfterHeader,
                        'x-ribban-rate-limits': Array.isArray(rateLimitsHeader) ? rateLimitsHeader[0] : rateLimitsHeader,
                    }
                });
            })

            req.on('error', reject);
            body.pipe(req);
        });
    };
}