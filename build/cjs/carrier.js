Object.defineProperty(exports, '__esModule', { value: true });

const worldwide = require('./worldwide.js');

function getMainCarrier() {
    // This ensures a Ribban carrier exists
    getRibbanCarrier(worldwide.GLOBAL_OBJ);
    return worldwide.GLOBAL_OBJ;
}

function getRibbanCarrier(carrier) {
    if (!carrier.__RIBBAN__) {
        carrier.__RIBBAN__ = {
            extensions: {},
        };
    }
    return carrier.__RIBBAN__;
}

exports.getMainCarrier = getMainCarrier;
exports.getRibbanCarrier = getRibbanCarrier;
//# sourceMappingURL=carrier.js.map
