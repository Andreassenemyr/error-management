import { GLOBAL_OBJ } from './worldwide.js';

function getMainCarrier() {
    // This ensures a Ribban carrier exists
    getRibbanCarrier(GLOBAL_OBJ);
    return GLOBAL_OBJ;
}

function getRibbanCarrier(carrier) {
    if (!carrier.__RIBBAN__) {
        carrier.__RIBBAN__ = {
            extensions: {},
        };
    }
    return carrier.__RIBBAN__;
}

export { getMainCarrier, getRibbanCarrier };
//# sourceMappingURL=carrier.js.map
