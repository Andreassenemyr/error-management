import { v4 } from 'uuid';
import { isPlainObject } from './utils/object.js';

class Scope  {
    /** Flag if notifying is happening. */

    /** Callback for client to receive scope changes. */

    /** Tags */

    /** Extra */

    /**
     * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
     * sent to Ribban
     */

    /** Fingerprint */

    /**
     * Transaction Name
     *
     * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
     * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
     */

    /** Session */

    /** Request Mode Session Status */

    /** The client on this scope */

    // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.

     constructor() {
      this._notifyingListeners = false;
      this._scopeListeners = [];
      this._tags = {};
      this._extra = {};
      this._sdkProcessingMetadata = {};
    }

    /**
     * @inheritDoc
     */
     clone() {
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
     getClient() {
      return this._client ;
    }

    /**
     * @inheritDoc
     */
     getRequestSession() {
      return this._requestSession;
    }

    /**
     * @inheritDoc
     */
     setRequestSession(requestSession) {
      this._requestSession = requestSession;
      return this;
    }

    addScopeListener(callback) {
      this._scopeListeners.push(callback);
    }

     setClient(client) {
        this._client = client;
    }

    /**
     * @inheritDoc
     */
     setTags(tags) {
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
     setTag(key, value) {
      this._tags = { ...this._tags, [key]: value };
      this._notifyScopeListeners();
      return this;
    }

    /**
     * @inheritDoc
     */
     setExtras(extras) {
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
     setExtra(key, extra) {
      this._extra = { ...this._extra, [key]: extra };
      return this;
    }

    /**
     * @inheritDoc
     */
     setFingerprint(fingerprint) {
      this._fingerprint = fingerprint;
      return this;
    }

    /**
     * @inheritDoc
     */
     setLevel(level) {
      this._level = level;
      this._notifyScopeListeners();
      return this;
    }

    /**
     * @inheritDoc
     */
     setTransactionName(name) {
      this._transactionName = name;
      this._notifyScopeListeners();
      return this;
    }

    /**
     * @inheritDoc
     */
     setSession(session) {
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
     getSession() {
      return this._session;
    }

    /**
     * @inheritDoc
     */
     update(captureContext) {
      if (!captureContext) {
        return this;
      }

      const scopeToMerge = typeof captureContext === 'function' ? captureContext(this) : captureContext;

      const [scopeInstance, requestSession] =
        scopeToMerge instanceof Scope
          ? [scopeToMerge.getScopeData(), scopeToMerge.getRequestSession()]
          : isPlainObject(scopeToMerge)
            ? [captureContext , (captureContext ).requestSession]
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
     clear() {
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
     getScopeData() {
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
     setSDKProcessingMetadata(newData) {
      this._sdkProcessingMetadata = { ...this._sdkProcessingMetadata, ...newData };

      return this;
    }

    /**
     * @inheritDoc
     */
     captureException(exception, hint) {
      const eventId = hint && hint.event_id ? hint.event_id : v4();

      if (!this._client) {
        console.warn('No client configured on scope - will not capture exception!');
        return eventId;
      }

      const syntheticException = new Error('Ribban syntheticException');

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
     captureMessage(message, level, hint) {
      const eventId = hint && hint.event_id ? hint.event_id : v4();

      if (!this._client) {
        console.warn('No client configured on scope - will not capture message!');
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
     captureEvent(event, hint) {
      const eventId = hint && hint.event_id ? hint.event_id : v4();

      if (!this._client) {
        console.warn('No client configured on scope - will not capture event!');
        return eventId;
      }

      this._client.captureEvent(event, { ...hint, event_id: eventId }, this);

      return eventId;
    }

    /**
     * This will be called on every set call.
     */
     _notifyScopeListeners() {
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

export { Scope };
//# sourceMappingURL=scope.js.map
