Object.defineProperty(exports, '__esModule', { value: true });

const carrier = require('./carrier.js');
const currentScopes = require('./current-scopes.js');
const scope = require('./scope.js');
const syncpromise = require('./transport/syncpromise.js');

/**
   * Get the current async context strategy.
   * If none has been setup, the default will be used.
   */
function getAsyncContextStrategy(carrier$1) {
    const ribban = carrier.getRibbanCarrier(carrier$1);

    if (ribban.acs) {
      return ribban.acs;
    }

    // Otherwise, use the default one (stack)
    return getStackAsyncContextStrategy();
}

class AsyncContextStack {

     constructor(scope$1, isolationScope) {
      let assignedScope;
      if (!scope$1) {
        assignedScope = new scope.Scope();
      } else {
        assignedScope = scope$1;
      }

      let assignedIsolationScope;
      if (!isolationScope) {
        assignedIsolationScope = new scope.Scope();
      } else {
        assignedIsolationScope = isolationScope;
      }

      this._stack = [{ scope: assignedScope }];
      this._isolationScope = assignedIsolationScope;
    }

    /**
     * Fork a scope for the stack.
     */
     withScope(callback) {
      const scope = this._pushScope();

      let maybePromiseResult;
      try {
        maybePromiseResult = callback(scope);
      } catch (e) {
        this._popScope();
        throw e;
      }

      if (syncpromise.isThenable(maybePromiseResult)) {
        // @ts-expect-error - isThenable returns the wrong type
        return maybePromiseResult.then(
          res => {
            this._popScope();
            return res;
          },
          e => {
            this._popScope();
            throw e;
          },
        );
      }

      this._popScope();
      return maybePromiseResult;
    }

    /**
     * Get the client of the stack.
     */
     getClient() {
      return this.getStackTop().client ;
    }

    /**
     * Returns the scope of the top stack.
     */
     getScope() {
      return this.getStackTop().scope;
    }

    /**
     * Get the isolation scope for the stack.
     */
     getIsolationScope() {
      return this._isolationScope;
    }

    /**
     * Returns the scope stack for domains or the process.
     */
     getStack() {
      return this._stack;
    }

    /**
     * Returns the topmost scope layer in the order domain > local > process.
     */
     getStackTop() {
      return this._stack[this._stack.length - 1];
    }

    /**
     * Push a scope to the stack.
     */
     _pushScope() {
      // We want to clone the content of prev scope
      const scope = this.getScope().clone();
      this.getStack().push({
        client: this.getClient(),
        scope,
      });
      return scope;
    }

    /**
     * Pop a scope from the stack.
     */
     _popScope() {
      if (this.getStack().length <= 1) return false;
      return !!this.getStack().pop();
    }
}

function getAsyncContextStack() {
    const registry = carrier.getMainCarrier();

    // For now we continue to keep this as `hub` on the ACS,
    // as e.g. the Loader Script relies on this.
    // Eventually we may change this if/when we update the loader to not require this field anymore
    // Related, we also write to `hub` in {@link ./../sdk.ts registerClientOnGlobalHub}
    const ribban = carrier.getRibbanCarrier(registry) ;

    if (ribban.hub) {
      return ribban.hub;
    }

    ribban.hub = new AsyncContextStack(currentScopes.getDefaultCurrentScope(), currentScopes.getDefaultIsolationScope());
    return ribban.hub;
}

function withScope(callback) {
    return getAsyncContextStack().withScope(callback);
}

function withSetScope(scope, callback) {
    const hub = getAsyncContextStack() ;
    return hub.withScope(() => {
      hub.getStackTop().scope = scope;
      return callback(scope);
    });
}

function withIsolationScope(callback) {
    return getAsyncContextStack().withScope(() => {
        return callback(getAsyncContextStack().getIsolationScope());
    });
}

function getStackAsyncContextStrategy() {
    return {
        withIsolationScope,
        withScope,
        withSetScope,
        withSetIsolationScope: (_isolationScope, callback) => {
          return withIsolationScope(callback);
        },
        getCurrentScope: () => getAsyncContextStack().getScope(),
        getIsolationScope: () => getAsyncContextStack().getIsolationScope(),
    };
}

exports.AsyncContextStack = AsyncContextStack;
exports.getAsyncContextStrategy = getAsyncContextStrategy;
exports.getStackAsyncContextStrategy = getStackAsyncContextStrategy;
//# sourceMappingURL=async-context.js.map
