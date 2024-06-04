import { CaptureContext, Extra, Extras, Scope as ScopeInterface } from "./index";
import { RequestSession, Session } from "./session";
import { Client } from "./client";
import { Event, EventHint, SeverityLevel } from "./types";
export interface ScopeData {
    tags: {
        [key: string]: Primitive;
    };
    extra: Extras;
    sdkProcessingMetadata: {
        [key: string]: unknown;
    };
    fingerprint: string[];
    level?: SeverityLevel;
    transactionName?: string;
}
export type Primitive = number | string | boolean | bigint | symbol | null | undefined;
export declare class Scope implements ScopeInterface {
    /** Flag if notifying is happening. */
    protected _notifyingListeners: boolean;
    /** Callback for client to receive scope changes. */
    protected _scopeListeners: Array<(scope: Scope) => void>;
    protected _level?: SeverityLevel;
    /** Tags */
    protected _tags: {
        [key: string]: Primitive;
    };
    /** Extra */
    protected _extra: Extras;
    /**
     * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
     * sent to Ribban
     */
    protected _sdkProcessingMetadata: {
        [key: string]: unknown;
    };
    /** Fingerprint */
    protected _fingerprint?: string[];
    /**
     * Transaction Name
     *
     * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
     * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
     */
    protected _transactionName?: string;
    /** Session */
    protected _session?: Session;
    /** Request Mode Session Status */
    protected _requestSession?: RequestSession;
    /** The client on this scope */
    protected _client?: Client;
    constructor();
    /**
     * @inheritDoc
     */
    clone(): Scope;
    /**
     * @inheritDoc
     */
    getClient<C extends Client>(): C | undefined;
    /**
     * @inheritDoc
     */
    getRequestSession(): RequestSession | undefined;
    /**
     * @inheritDoc
     */
    setRequestSession(requestSession?: RequestSession): this;
    addScopeListener(callback: (scope: ScopeInterface) => void): void;
    setClient(client: Client | undefined): void;
    /**
     * @inheritDoc
     */
    setTags(tags: {
        [key: string]: Primitive;
    }): this;
    /**
     * @inheritDoc
     */
    setTag(key: string, value: Primitive): this;
    /**
     * @inheritDoc
     */
    setExtras(extras: Extras): this;
    /**
     * @inheritDoc
     */
    setExtra(key: string, extra: Extra): this;
    /**
     * @inheritDoc
     */
    setFingerprint(fingerprint: string[]): this;
    /**
     * @inheritDoc
     */
    setLevel(level: SeverityLevel): this;
    /**
     * @inheritDoc
     */
    setTransactionName(name?: string): this;
    /**
     * @inheritDoc
     */
    setSession(session?: Session): this;
    /**
     * @inheritDoc
     */
    getSession(): Session | undefined;
    /**
     * @inheritDoc
     */
    update(captureContext?: CaptureContext): this;
    /**
     * @inheritDoc
     */
    clear(): this;
    /** @inheritDoc */
    getScopeData(): ScopeData;
    /**
     * @inheritDoc
     */
    setSDKProcessingMetadata(newData: {
        [key: string]: unknown;
    }): this;
    /**
     * @inheritDoc
     */
    captureException(exception: unknown, hint?: EventHint): string;
    /**
     * @inheritDoc
     */
    captureMessage(message: string, level?: SeverityLevel, hint?: EventHint): string;
    /**
     * @inheritDoc
     */
    captureEvent(event: Event, hint?: EventHint): string;
    /**
     * This will be called on every set call.
     */
    protected _notifyScopeListeners(): void;
}
//# sourceMappingURL=scope.d.ts.map
