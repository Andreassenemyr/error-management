Object.defineProperty(exports, '__esModule', { value: true });

const worldwide = require('../worldwide.js');

const CONSOLE_LEVELS = [
    'debug',
    'info',
    'warn',
    'error',
    'log',
    'assert',
    'trace',
] ;

const originalConsoleMethods

 = {};

/**
 * Temporarily disable Ribban console instrumentations.
 *
 * @param callback The function to run against the original `console` messages
 * @returns The results of the callback
 */
function consoleSandbox(callback) {
    if (!('console' in worldwide.GLOBAL_OBJ)) {
        return callback();
    }

    const console = worldwide.GLOBAL_OBJ.console ;
    const wrappedFuncs = {};

    const wrappedLevels = Object.keys(originalConsoleMethods) ;

    // Restore all wrapped console methods
    wrappedLevels.forEach(level => {
        const originalConsoleMethod = originalConsoleMethods[level] ;
        wrappedFuncs[level] = console[level] ;
        console[level] = originalConsoleMethod;
    });

    try {
        return callback();
    } finally {
        // Revert restoration to wrapped state
        wrappedLevels.forEach(level => {
          console[level] = wrappedFuncs[level] ;
        });
    }
}

function makeLogger() {
    let enabled = false;
    const logger = {
      enable: () => {
        enabled = true;
      },
      disable: () => {
        enabled = false;
      },
      isEnabled: () => enabled,
    };

    CONSOLE_LEVELS.forEach(name => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger[name] = (...args) => {
          if (enabled) {
            consoleSandbox(() => {
              worldwide.GLOBAL_OBJ.console[name](`RIBBAN [${name}]:`, ...args);
            });
          }
        };
    });

    return logger ;
}

const logger = makeLogger();

exports.CONSOLE_LEVELS = CONSOLE_LEVELS;
exports.consoleSandbox = consoleSandbox;
exports.logger = logger;
exports.originalConsoleMethods = originalConsoleMethods;
//# sourceMappingURL=logger.js.map
