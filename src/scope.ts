import { logger } from "./utils/logger";
import { CaptureContext, Extra, Extras, ScopeContext, Scope as ScopeInterface } from "./index";
import { RequestSession, Session } from "./session";
import { Client } from "./client";
import { Event, EventHint, SeverityLevel } from "./types";
import { v4 as uuid4 } from "uuid";
import { isPlainObject } from "./utils/object";

export interface ScopeData {
  tags: { [key: string]: Primitive };
  extra: Extras;
  sdkProcessingMetadata: { [key: string]: unknown };
  fingerprint: string[];
  level?: SeverityLevel;
  transactionName?: string;
}

export type Primitive = number | string | boolean | bigint | symbol | null | undefined;

export class Scope implements ScopeInterface {
    /** Flag if notifying is happening. */
    protected _notifyingListeners: boolean;
  
    /** Callback for client to receive scope changes. */
    protected _scopeListeners: Array<(scope: Scope) => void>;

    protected _level?: SeverityLevel;
  
    /** Tags */
    protected _tags: { [key: string]: Primitive };
  
    /** Extra */
    protected _extra: Extras;
  
    /**
     * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
     * sent to Sentry
     */
    protected _sdkProcessingMetadata: { [key: string]: unknown };
  
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
  
    // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
  
    public constructor() {
      this._notifyingListeners = false;
      this._scopeListeners = [];
      this._tags = {};
      this._extra = {};
      this._sdkProcessingMetadata = {};
    }
  
    /**
     * @inheritDoc
     */
    public clone(): Scope {
      const newScope = new Scope();
      newScope._tags = { ...this._tags };
      newScope._extra = { ...this._extra };
      newScope._session = this._session;
      newScope._transactionName = this._transactionName;
      newScope._fingerprint = this._fingerprint;
      newScope._requestSession = this._requestSession;
      newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
      newScope._client = this._client;
    
      return newScope;
    }
  
  
    /**
     * @inheritDoc
     */
    public getClient<C extends Client>(): C | undefined {
      return this._client as C | undefined;
    }
  
    /**
     * @inheritDoc
     */
    public getRequestSession(): RequestSession | undefined {
      return this._requestSession;
    }
  
    /**
     * @inheritDoc
     */
    public setRequestSession(requestSession?: RequestSession): this {
      this._requestSession = requestSession;
      return this;
    }

    addScopeListener(callback: (scope: ScopeInterface) => void): void {
      this._scopeListeners.push(callback);
    }

    public setClient(client: Client | undefined): void {
        this._client = client;
    }
  
    /**
     * @inheritDoc
     */
    public setTags(tags: { [key: string]: Primitive }): this {
      this._tags = {
        ...this._tags,
        ...tags,
      };
      this._notifyScopeListeners();
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setTag(key: string, value: Primitive): this {
      this._tags = { ...this._tags, [key]: value };
      this._notifyScopeListeners();
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setExtras(extras: Extras): this {
      this._extra = {
        ...this._extra,
        ...extras,
      };
      this._notifyScopeListeners();
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setExtra(key: string, extra: Extra): this {
      this._extra = { ...this._extra, [key]: extra };
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setFingerprint(fingerprint: string[]): this {
      this._fingerprint = fingerprint;
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setLevel(level: SeverityLevel): this {
      this._level = level;
      this._notifyScopeListeners();
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setTransactionName(name?: string): this {
      this._transactionName = name;
      this._notifyScopeListeners();
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public setSession(session?: Session): this {
      if (!session) {
        delete this._session;
      } else {
        this._session = session;
      }
      this._notifyScopeListeners();
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public getSession(): Session | undefined {
      return this._session;
    }
  
    /**
     * @inheritDoc
     */
    public update(captureContext?: CaptureContext): this {
      if (!captureContext) {
        return this;
      }
  
      const scopeToMerge = typeof captureContext === 'function' ? captureContext(this) : captureContext;
  
      const [scopeInstance, requestSession] =
        scopeToMerge instanceof Scope
          ? [scopeToMerge.getScopeData(), scopeToMerge.getRequestSession()]
          : isPlainObject(scopeToMerge)
            ? [captureContext as ScopeContext, (captureContext as ScopeContext).requestSession]
            : [];
  
      const { tags, extra, level, fingerprint = [] } = scopeInstance || {};
  
      this._tags = { ...this._tags, ...tags };
      this._extra = { ...this._extra, ...extra };
  
  
      if (level) {
        this._level = level;
      }
  
      if (fingerprint.length) {
        this._fingerprint = fingerprint;
      }
  
      if (requestSession) {
        this._requestSession = requestSession;
      }
  
      return this;
    }
  
    /**
     * @inheritDoc
     */
    public clear(): this {
      // client is not cleared here on purpose!
      this._tags = {};
      this._extra = {};
      this._level = undefined;
      this._transactionName = undefined;
      this._fingerprint = undefined;
      this._requestSession = undefined;
      this._session = undefined;

      this._notifyScopeListeners();
      return this;
    }

    /** @inheritDoc */
    public getScopeData(): ScopeData {
      return {
        tags: this._tags,
        extra: this._extra,
        level: this._level,
        fingerprint: this._fingerprint || [],
        sdkProcessingMetadata: this._sdkProcessingMetadata,
        transactionName: this._transactionName,
      };
    }
  
    /**
     * @inheritDoc
     */
    public setSDKProcessingMetadata(newData: { [key: string]: unknown }): this {
      this._sdkProcessingMetadata = { ...this._sdkProcessingMetadata, ...newData };
  
      return this;
    }

  
    /**
     * @inheritDoc
     */
    public captureException(exception: unknown, hint?: EventHint): string {
      const eventId = hint && hint.event_id ? hint.event_id : uuid4();
  
      if (!this._client) {
        logger.warn('No client configured on scope - will not capture exception!');
        return eventId;
      }
  
      const syntheticException = new Error('Sentry syntheticException');
  
      this._client.captureException(
        exception,
        {
          originalException: exception,
          syntheticException,
          ...hint,
          event_id: eventId,
        },
        this,
      );
  
      return eventId;
    }
  
    /**
     * @inheritDoc
     */
    public captureMessage(message: string, level?: SeverityLevel, hint?: EventHint): string {
      const eventId = hint && hint.event_id ? hint.event_id : uuid4();
  
      if (!this._client) {
        logger.warn('No client configured on scope - will not capture message!');
        return eventId;
      }
  
      const syntheticException = new Error(message);
  
      this._client.captureMessage(
        message,
        level,
        {
          originalException: message,
          syntheticException,
          ...hint,
          event_id: eventId,
        },
        this,
      );
  
      return eventId;
    }
  
    /**
     * @inheritDoc
     */
    public captureEvent(event: Event, hint?: EventHint): string {
      const eventId = hint && hint.event_id ? hint.event_id : uuid4();
  
      if (!this._client) {
        logger.warn('No client configured on scope - will not capture event!');
        return eventId;
      }
  
      this._client.captureEvent(event, { ...hint, event_id: eventId }, this);
  
      return eventId;
    }
  
    /**
     * This will be called on every set call.
     */
    protected _notifyScopeListeners(): void {
      // We need this check for this._notifyingListeners to be able to work on scope during updates
      // If this check is not here we'll produce endless recursion when something is done with the scope
      // during the callback.
      if (!this._notifyingListeners) {
        this._notifyingListeners = true;
        this._scopeListeners.forEach(callback => {
          callback(this);
        });
        this._notifyingListeners = false;
      }
    }
}
