var {
    _nullishCoalesce
} = require('@sentry/utils');

Object.defineProperty(exports, '__esModule', { value: true });

const base = require('../../transport/base.js');
const logger = require('../../utils/logger.js');
const http = require('node:http');
const https = require('node:https');
const node_stream = require('node:stream');
const index = require('../proxy/index.js');
const node_zlib = require('node:zlib');
const supressTracing = require('../../utils/supress-tracing.js');

function streamFromBody(body) {
    return new node_stream.Readable({
        read() {
            this.push(body);
            this.push(null);
        },
    });
}

function makeNodeTransport(options) {
    let urlSegments;

    try {
        urlSegments = new URL(options.url);
    } catch (e) {
        logger.consoleSandbox(() => {
            // eslint-disable-next-line no-console
            console.warn(
                '[@sentry/node]: Invalid dsn or tunnel option, will not send any events. The tunnel option must be a full URL when used.',
            );
        });

        return base.createTransport(options, () => Promise.resolve({}));
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
        ? (new index.HttpsProxyAgent(proxy) )
        : new nativeHttpModule.Agent({ keepAlive, maxSockets: 30, timeout: 2000 });

    // This ensures we do not generate any spans in OpenTelemetry for the transport
    return supressTracing.suppressTracing(() => {
        const requestExecutor = createRequestExecutor(options, _nullishCoalesce(options.httpModule, () => ( nativeHttpModule)), agent);
        return base.createTransport(options, requestExecutor);
    });
}

function applyNoProxyOption(transportUrlSegments, proxy) {
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
    options,
    httpModule,
    agent,
) {
    const { hostname, pathname, port, protocol, search } = new URL(options.url);
    return function makeRequest(request) {
        return new Promise((resolve, reject) => {
            let body = streamFromBody(request.body);

            const headers = { ...options.headers };

            if (request.body.length > GZIP_THRESHOLD) {
                headers['content-encoding'] = 'gzip';
                body = body.pipe(node_zlib.createGzip());
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
                    const retryAfterHeader = _nullishCoalesce(res.headers['retry-after'], () => ( null));
                    const rateLimitsHeader = _nullishCoalesce(res.headers['x-sentry-rate-limits'], () => ( null));

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

exports.makeNodeTransport = makeNodeTransport;
//# sourceMappingURL=http.js.map
