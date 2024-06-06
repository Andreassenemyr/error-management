var {
    _nullishCoalesce
} = require('@sentry/utils');

Object.defineProperty(exports, '__esModule', { value: true });

const http = require('node:http');
require('node:https');

const INTERNAL = Symbol('AgentBaseInternalState');

class Agent extends http.Agent {

    // Set by `http.Agent` - missing from `@types/node`

    constructor(opts) {
        super(opts);
        this[INTERNAL] = {};
    }

    /**
     * Determine whether this is an `http` or `https` request.
     */
    isSecureEndpoint(options) {
        if (options) {
            // First check the `secureEndpoint` property explicitly, since this
            // means that a parent `Agent` is "passing through" to this instance.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            if (typeof (options ).secureEndpoint === 'boolean') {
                return options.secureEndpoint;
            }

            // If no explicit `secure` endpoint, check if `protocol` property is
            // set. This will usually be the case since using a full string URL
            // or `URL` instance should be the most common usage.
            if (typeof options.protocol === 'string') {
                return options.protocol === 'https:';
            }
        }

        // Finally, if no `protocol` property was set, then fall back to
        // checking the stack trace of the current call stack, and try to
        // detect the "https" module.
        const { stack } = new Error();
        if (typeof stack !== 'string') return false;
        return stack.split('\n').some(l => l.indexOf('(https.js:') !== -1 || l.indexOf('node:https:') !== -1);
    }

    createSocket(req, options, cb) {
        const connectOpts = {
            ...options,
            secureEndpoint: this.isSecureEndpoint(options),
        };
        Promise.resolve()
            .then(() => this.connect(req, connectOpts))
            .then(socket => {
                if (socket instanceof http.Agent) {
                    // @ts-expect-error `addRequest()` isn't defined in `@types/node`
                    return socket.addRequest(req, connectOpts);
                }
                this[INTERNAL].currentSocket = socket;
                // @ts-expect-error `createSocket()` isn't defined in `@types/node`
                super.createSocket(req, options, cb);
            }, cb);
    }

    createConnection() {
        const socket = this[INTERNAL].currentSocket;
        this[INTERNAL].currentSocket = undefined;
        if (!socket) {
            throw new Error('No socket was returned in the `connect()` function');
        }
        return socket;
    }

    get defaultPort() {
        return _nullishCoalesce(this[INTERNAL].defaultPort, () => ( (this.protocol === 'https:' ? 443 : 80)));
    }

    set defaultPort(v) {
        if (this[INTERNAL]) {
            this[INTERNAL].defaultPort = v;
        }
    }

    get protocol() {
        return _nullishCoalesce(this[INTERNAL].protocol, () => ( (this.isSecureEndpoint() ? 'https:' : 'http:')));
    }

    set protocol(v) {
        if (this[INTERNAL]) {
            this[INTERNAL].protocol = v;
        }
    }
}

exports.Agent = Agent;
//# sourceMappingURL=base.js.map
