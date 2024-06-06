import { BaseTransportOptions, Transport, TransportMakeRequestResponse, TransportRequest, TransportRequestExecutor } from "../../transport";
import { createTransport } from "../../transport/base";
import { consoleSandbox } from "../../utils/logger";
import * as http from 'node:http';
import * as https from 'node:https';
import { Readable } from 'node:stream';
import type { HTTPModule } from './http-module';
import { HttpsProxyAgent } from "../proxy";
import { createGzip } from 'node:zlib';
import { suppressTracing } from "../../utils/supress-tracing";

export interface NodeTransportOptions extends BaseTransportOptions {
    headers?: Record<string, string>;
    proxy?: string;
    caCerts?: string | Buffer | Array<string | Buffer>;
    httpModule?: HTTPModule;
    keepAlive?: boolean;
}

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
    } catch (e) {
        consoleSandbox(() => {
            // eslint-disable-next-line no-console
            console.warn(
                '[@sentry/node]: Invalid dsn or tunnel option, will not send any events. The tunnel option must be a full URL when used.',
            );
        });

        return createTransport(options, () => Promise.resolve({}));
    }

    const isHttps = urlSegments.protocol === 'https:';

    // Proxy prioritization: http => `options.proxy` | `process.env.http_proxy`
    // Proxy prioritization: https => `options.proxy` | `process.env.https_proxy` | `process.env.http_proxy`
    const proxy = applyNoProxyOption(
        urlSegments,
        options.proxy || (isHttps ? process.env.https_proxy : undefined) || process.env.http_proxy,
    );

    const nativeHttpModule = isHttps ? https : http;
    const keepAlive = options.keepAlive === undefined ? false : options.keepAlive;

    // TODO(v9): Evaluate if we can set keepAlive to true. This would involve testing for memory leaks in older node
    // versions(>= 8) as they had memory leaks when using it: #2555
    const agent = proxy
        ? (new HttpsProxyAgent(proxy) as http.Agent)
        : new nativeHttpModule.Agent({ keepAlive, maxSockets: 30, timeout: 2000 });

    // This ensures we do not generate any spans in OpenTelemetry for the transport
    return suppressTracing(() => {
        const requestExecutor = createRequestExecutor(options, options.httpModule ?? nativeHttpModule, agent);
        return createTransport(options, requestExecutor);
    });
}

function applyNoProxyOption(transportUrlSegments: URL, proxy: string | undefined): string | undefined {
    const { no_proxy } = process.env;

    const urlIsExemptFromProxy =
        no_proxy &&
        no_proxy
            .split(',')
            .some(
                exemption => transportUrlSegments.host.endsWith(exemption) || transportUrlSegments.hostname.endsWith(exemption),
            );

    if (urlIsExemptFromProxy) {
        return undefined;
    } else {
        return proxy;
    }
}

const GZIP_THRESHOLD = 1024 * 32;

function createRequestExecutor(
    options: NodeTransportOptions,
    httpModule: HTTPModule,
    agent: http.Agent,
): TransportRequestExecutor {
    const { hostname, pathname, port, protocol, search } = new URL(options.url);
    return function makeRequest(request: TransportRequest): Promise<TransportMakeRequestResponse> {
        return new Promise((resolve, reject) => {
            let body = streamFromBody(request.body);

            const headers: Record<string, string> = { ...options.headers };

            if (request.body.length > GZIP_THRESHOLD) {
                headers['content-encoding'] = 'gzip';
                body = body.pipe(createGzip());
            }

            const req = httpModule.request(
                {
                    method: 'POST',
                    agent,
                    headers,
                    hostname,
                    path: `${pathname}${search}`,
                    port,
                    protocol,
                    ca: options.caCerts,
                },
                res => {
                    res.on('data', () => {
                        // Drain socket
                    });

                    res.on('end', () => {
                        // Drain socket
                    });

                    res.setEncoding('utf8');

                    // "Key-value pairs of header names and values. Header names are lower-cased."
                    // https://nodejs.org/api/http.html#http_message_headers
                    const retryAfterHeader = res.headers['retry-after'] ?? null;
                    const rateLimitsHeader = res.headers['x-sentry-rate-limits'] ?? null;

                    resolve({
                        statusCode: res.statusCode,
                        headers: {
                            'retry-after': retryAfterHeader,
                            'x-ribban-rate-limits': Array.isArray(rateLimitsHeader) ? rateLimitsHeader[0] : rateLimitsHeader,
                        },
                    });
                },
            );

            req.on('error', reject);
            body.pipe(req);
        });
    };
}