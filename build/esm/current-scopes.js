import { getGlobalSingleton } from './worldwide.js';
import { Scope } from './scope.js';
import { getMainCarrier } from './carrier.js';
import { getAsyncContextStrategy } from './async-context.js';

function getDefaultCurrentScope() {
    return getGlobalSingleton('defaultCurrentScope', () => new Scope());
}

function getDefaultIsolationScope() {
    return getGlobalSingleton('defaultIsolationScope', () => new Scope());
}

function getClient() {
    return getCurrentScope().getClient();
}

function getCurrentScope() {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    return acs.getCurrentScope();
}

function getIsolationScope() {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    return acs.getIsolationScope();
}

export { getClient, getCurrentScope, getDefaultCurrentScope, getDefaultIsolationScope, getIsolationScope };
//# sourceMappingURL=current-scopes.js.map
