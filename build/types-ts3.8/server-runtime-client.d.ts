import { Scope } from ".";
import { BaseClient } from "./baseclient";
import { ClientOptions } from "./options";
import { SessionFlusher } from "./sessionflusher";
import { BaseTransportOptions } from "./transport";
import { Event, EventHint, SeverityLevel } from "./types";
import { ParameterizedString } from "./utils/parameterize";
export interface ServerRuntimeClientOptions extends ClientOptions<BaseTransportOptions> {
    platform?: string;
    runtime?: {
        name: string;
        version?: string;
    };
    serverName?: string;
}
/**
 * The Sentry Server Runtime Client SDK.
 */
export declare class ServerRuntimeClient<O extends ClientOptions & ServerRuntimeClientOptions = ServerRuntimeClientOptions> extends BaseClient<O> {
    protected _sessionFlusher: SessionFlusher | undefined;
    /**
     * Creates a new Edge SDK instance.
     * @param options Configuration options for this SDK.
     */
    constructor(options: O);
    /**
     * @inheritDoc
     */
    eventFromException(exception: unknown, hint?: EventHint): PromiseLike<Event>;
    /**
     * @inheritDoc
     */
    eventFromMessage(message: ParameterizedString, level?: SeverityLevel, hint?: EventHint): PromiseLike<Event>;
    /**
     * @inheritDoc
     */
    captureException(exception: any, hint?: EventHint, scope?: Scope): string;
    /**
     * @inheritDoc
     */
    captureEvent(event: Event, hint?: EventHint, scope?: Scope): string;
    /**
     *
     * @inheritdoc
     */
    close(timeout?: number): PromiseLike<boolean>;
    /** Method that initialises an instance of SessionFlusher on Client */
    initSessionFlusher(): void;
    /**
     * Method responsible for capturing/ending a request session by calling `incrementSessionStatusCount` to increment
     * appropriate session aggregates bucket
     */
    protected _captureRequestSession(): void;
    /**
     * @inheritDoc
     */
    protected _prepareEvent(event: Event, hint: EventHint, scope?: Scope, isolationScope?: Scope): PromiseLike<Event | null>;
}
//# sourceMappingURL=server-runtime-client.d.ts.map
