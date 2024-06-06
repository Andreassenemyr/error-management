Object.defineProperty(exports, '__esModule', { value: true });

const baseclient = require('./baseclient.js');
const client = require('./client.js');
const currentScopes = require('./current-scopes.js');
const sessionflusher = require('./sessionflusher.js');
const syncpromise = require('./transport/syncpromise.js');
const logger = require('./utils/logger.js');

/**
 * The Sentry Server Runtime Client SDK.
 */
class ServerRuntimeClient extends baseclient.BaseClient {

    /**
     * Creates a new Edge SDK instance.
     * @param options Configuration options for this SDK.
     */
     constructor(options) {
        super(options);
    }

    /**
     * @inheritDoc
     */
     eventFromException(exception, hint) {
        return syncpromise.resolvedSyncPromise(client.eventFromClientUnknownInput(this, this.options.stackParser, exception, hint));
    }

    /**
     * @inheritDoc
     */
     eventFromMessage(
        message,
        level = 'info',
        hint,
    ) {
        return syncpromise.resolvedSyncPromise(
            client.eventFromMessage(this.options.stackParser, message, level, hint, this.options.attachStacktrace),
        );
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
     captureException(exception, hint, scope) {
        // Check if the flag `autoSessionTracking` is enabled, and if `_sessionFlusher` exists because it is initialised only
        // when the `requestHandler` middleware is used, and hence the expectation is to have SessionAggregates payload
        // sent to the Server only when the `requestHandler` middleware is used
        if (this.options.autoSessionTracking && this._sessionFlusher) {
            const requestSession = currentScopes.getIsolationScope().getRequestSession();

            // Necessary checks to ensure this is code block is executed only within a request
            // Should override the status only if `requestSession.status` is `Ok`, which is its initial stage
            if (requestSession && requestSession.status === 'ok') {
                requestSession.status = 'errored';
            }
        }

        return super.captureException(exception, hint, scope);
    }

    /**
     * @inheritDoc
     */
     captureEvent(event, hint, scope) {
        // Check if the flag `autoSessionTracking` is enabled, and if `_sessionFlusher` exists because it is initialised only
        // when the `requestHandler` middleware is used, and hence the expectation is to have SessionAggregates payload
        // sent to the Server only when the `requestHandler` middleware is used
        if (this.options.autoSessionTracking && this._sessionFlusher) {
            const eventType = event.type || 'exception';
            const isException =
                eventType === 'exception' && event.exception && event.exception.values && event.exception.values.length > 0;

            // If the event is of type Exception, then a request session should be captured
            if (isException) {
                const requestSession = currentScopes.getIsolationScope().getRequestSession();

                // Ensure that this is happening within the bounds of a request, and make sure not to override
                // Session Status if Errored / Crashed
                if (requestSession && requestSession.status === 'ok') {
                    requestSession.status = 'errored';
                }
            }
        }

        return super.captureEvent(event, hint, scope);
    }

    /**
     *
     * @inheritdoc
     */
     close(timeout) {
        if (this._sessionFlusher) {
            this._sessionFlusher.close();
        }
        return super.close(timeout);
    }

    /** Method that initialises an instance of SessionFlusher on Client */
     initSessionFlusher() {
        const { environment } = this.options;

        this._sessionFlusher = new sessionflusher.SessionFlusher(this, {
            environment,
        });
    }

    /**
     * Method responsible for capturing/ending a request session by calling `incrementSessionStatusCount` to increment
     * appropriate session aggregates bucket
     */
     _captureRequestSession() {
        if (!this._sessionFlusher) {
            logger.logger.warn('Discarded request mode session because autoSessionTracking option was disabled');
        } else {
            this._sessionFlusher.incrementSessionStatusCount();
        }
    }

    /**
     * @inheritDoc
     */
     _prepareEvent(
        event,
        hint,
        scope,
        isolationScope,
    ) {
        if (this.options.platform) {
            event.platform = event.platform || this.options.platform;
        }

        if (this.options.runtime) {
            event.contexts = {
                ...event.contexts,
                runtime: (event.contexts || {}).runtime || this.options.runtime,
            };
        }

        if (this.options.serverName) {
            event.server_name = event.server_name || this.options.serverName;
        }

        return super._prepareEvent(event, hint, scope, isolationScope);
    }
}

exports.ServerRuntimeClient = ServerRuntimeClient;
//# sourceMappingURL=server-runtime-client.js.map
