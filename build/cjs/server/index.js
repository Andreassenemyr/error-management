Object.defineProperty(exports, '__esModule', { value: true });

const isBuild = require('../common/isBuild.js');
const init$1 = require('../init.js');
const withRibbanConfig = require('../config/withRibbanConfig.js');
require('fs');
require('path');
require('resolve');
const index = require('../index.js');

function init(options) {
    if (isBuild.isBuild()) {
        return;
    }

    init$1.init(options);
}

exports.withRibbanConfig = withRibbanConfig.withRibbanConfig;
exports.captureException = index.captureException;
exports.init = init;
//# sourceMappingURL=index.js.map
