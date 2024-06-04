import { isBuild } from '../common/isBuild.js';
import { init as init$1 } from '../init.js';
export { withRibbanConfig } from '../config/withRibbanConfig.js';
import 'fs';
import 'path';
import 'resolve';
export { captureException } from '../index.js';

function init(options) {
    if (isBuild()) {
        return;
    }

    init$1(options);
}

export { init };
//# sourceMappingURL=index.js.map
