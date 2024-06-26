Object.defineProperty(exports, '__esModule', { value: true });

const base = require('./base.js');
const syncpromise = require('./syncpromise.js');
const utils = require('./utils.js');

function makeFetchTransport(
    options,
    nativeFetch = utils.getNativeFetchImplementation(),
) {
    let pendingBodySize = 0;
    let pendingCount = 0;

    function makeRequest(request) {
        const requestSize = request.body.length;
        pendingBodySize += requestSize;
        pendingCount++;

        const requestOptions = {
            body: request.body,
            method: 'POST',
            headers: options.headers,
            // Outgoing requests are usually cancelled when navigating to a different page, causing a "TypeError: Failed to
            // fetch" error and sending a "network_error" client-outcome - in Chrome, the request status shows "(cancelled)".
            // The `keepalive` flag keeps outgoing requests alive, even when switching pages. We want this since we're
            // frequently sending events right before the user is switching pages (eg. whenfinishing navigation transactions).
            // Gotchas:
            // - `keepalive` isn't supported by Firefox
            // - As per spec (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
            //   If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error.
            //   We will therefore only activate the flag when we're below that limit.
            // There is also a limit of requests that can be open at the same time, so we also limit this to 15
            keepalive: pendingBodySize <= 60000 && pendingCount < 15,
            ...options.fetchOptions,
        };

        if (!nativeFetch) {
            utils.clearCachedFetchImplementation();
            return syncpromise.rejectedSyncPromise('No fetch implementation available');
        }

        try {
            return nativeFetch(options.url, requestOptions).then(response => {
                pendingBodySize -= requestSize;
                pendingCount--;
                return {
                    statusCode: response.status,
                    headers: {
                        'x-ribban-rate-limits': response.headers.get('X-Ribban-Rate-Limits'),
                        'retry-after': response.headers.get('Retry-After'),
                    },
                };
            });
        } catch (e) {
            utils.clearCachedFetchImplementation();
            pendingBodySize -= requestSize;
            pendingCount--;
            return syncpromise.rejectedSyncPromise(e);
        }
    }

    return base.createTransport(options, makeRequest);
}

exports.makeFetchTransport = makeFetchTransport;
//# sourceMappingURL=fetch.js.map
