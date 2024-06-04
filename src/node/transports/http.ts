import { BaseTransportOptions, Transport } from "../../transport";
import { createTransport } from "../../transport/base";
import { consoleSandbox } from "../../utils/logger";
import * as http from 'node:http';
import * as https from 'node:https';
import { Readable } from 'node:stream';
import type { HTTPModule } from './http-module';
import { HttpsProxyAgent } from "../proxy";
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
