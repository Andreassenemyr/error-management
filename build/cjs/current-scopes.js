Object.defineProperty(exports, '__esModule', { value: true });

const worldwide = require('./worldwide.js');
const scope = require('./scope.js');
const carrier = require('./carrier.js');
const asyncContext = require('./async-context.js');

function getDefaultCurrentScope() {
    return worldwide.getGlobalSingleton('defaultCurrentScope', () => new scope.Scope());
}

function getDefaultIsolationScope() {
    return worldwide.getGlobalSingleton('defaultIsolationScope', () => new scope.Scope());
}

function getClient() {
    return getCurrentScope().getClient();
}

function getCurrentScope() {
    const carrier$1 = carrier.getMainCarrier();
    const acs = asyncContext.getAsyncContextStrategy(carrier$1);
    return acs.getCurrentScope();
}

function getIsolationScope() {
    const carrier$1 = carrier.getMainCarrier();
    const acs = asyncContext.getAsyncContextStrategy(carrier$1);
    return acs.getIsolationScope();
}

exports.getClient = getClient;
exports.getCurrentScope = getCurrentScope;
exports.getDefaultCurrentScope = getDefaultCurrentScope;
exports.getDefaultIsolationScope = getDefaultIsolationScope;
exports.getIsolationScope = getIsolationScope;
//# sourceMappingURL=current-scopes.js.map
