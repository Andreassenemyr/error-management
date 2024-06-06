import { Scope } from ".";
import { BaseClient } from "./baseclient";
import { eventFromClientUnknownInput, eventFromMessage, eventFromUnknownInput } from "./client";
import { getIsolationScope } from "./current-scopes";
import { ClientOptions } from "./options";
import { SessionFlusher } from "./sessionflusher";
import { BaseTransportOptions } from "./transport";
import { resolvedSyncPromise } from "./transport/syncpromise";
import { Event, EventHint, SeverityLevel } from "./types";
import { logger } from "./utils/logger";
import { ParameterizedString } from "./utils/parameterize";

export interface ServerRuntimeClientOptions extends ClientOptions<BaseTransportOptions> {
    platform?: string;
    runtime?: { name: string; version?: string };
    serverName?: string;
}

/**
 * The Sentry Server Runtime Client SDK.
 */
export class ServerRuntimeClient<O extends ClientOptions & ServerRuntimeClientOptions = ServerRuntimeClientOptions,> extends BaseClient<O> {
    protected _sessionFlusher: SessionFlusher | undefined;

    /**
     * Creates a new Edge SDK instance.
     * @param options Configuration options for this SDK.
     */
    public constructor(options: O) {
        super(options);
    }

    /**
     * @inheritDoc
     */
    public eventFromException(exception: unknown, hint?: EventHint): PromiseLike<Event> {
        return resolvedSyncPromise(eventFromClientUnknownInput(this, this.options.stackParser, exception, hint));
    }

    /**
     * @inheritDoc
     */
    public eventFromMessage(
        message: ParameterizedString,
        level: SeverityLevel = 'info',
        hint?: EventHint,
    ): PromiseLike<Event> {
        return resolvedSyncPromise(
            eventFromMessage(this.options.stackParser, message, level, hint, this.options.attachStacktrace),
        );
    }

    /**
     * @inheritDoc
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public captureException(exception: any, hint?: EventHint, scope?: Scope): string {
        // Check if the flag `autoSessionTracking` is enabled, and if `_sessionFlusher` exists because it is initialised only
        // when the `requestHandler` middleware is used, and hence the expectation is to have SessionAggregates payload
        // sent to the Server only when the `requestHandler` middleware is used
        if (this.options.autoSessionTracking && this._sessionFlusher) {
            const requestSession = getIsolationScope().getRequestSession();

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
    public captureEvent(event: Event, hint?: EventHint, scope?: Scope): string {
        // Check if the flag `autoSessionTracking` is enabled, and if `_sessionFlusher` exists because it is initialised only
        // when the `requestHandler` middleware is used, and hence the expectation is to have SessionAggregates payload
        // sent to the Server only when the `requestHandler` middleware is used
        if (this.options.autoSessionTracking && this._sessionFlusher) {
            const eventType = event.type || 'exception';
            const isException =
                eventType === 'exception' && event.exception && event.exception.values && event.exception.values.length > 0;

            // If the event is of type Exception, then a request session should be captured
            if (isException) {
                const requestSession = getIsolationScope().getRequestSession();

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
    public close(timeout?: number): PromiseLike<boolean> {
        if (this._sessionFlusher) {
            this._sessionFlusher.close();
        }
        return super.close(timeout);
    }

    /** Method that initialises an instance of SessionFlusher on Client */
    public initSessionFlusher(): void {
        const { environment } = this.options;

        this._sessionFlusher = new SessionFlusher(this, {
            environment,
        });
    }



    /**
     * Method responsible for capturing/ending a request session by calling `incrementSessionStatusCount` to increment
     * appropriate session aggregates bucket
     */
    protected _captureRequestSession(): void {
        if (!this._sessionFlusher) {
            logger.warn('Discarded request mode session because autoSessionTracking option was disabled');
        } else {
            this._sessionFlusher.incrementSessionStatusCount();
        }
    }

    /**
     * @inheritDoc
     */
    protected _prepareEvent(
        event: Event,
        hint: EventHint,
        scope?: Scope,
        isolationScope?: Scope,
    ): PromiseLike<Event | null> {
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