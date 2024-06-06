Object.defineProperty(exports, '__esModule', { value: true });

const stacktrace = require('../../types/stacktrace.js');
const path = require('../../utils/path.js');
const nodeStackTrace = require('../utils/node-stack-trace.js');
const node_path = require('node:path');

function normalizeWindowsPath(path) {
    return path
        .replace(/^[A-Z]:/, '') // remove Windows-style prefix
        .replace(/\\/g, '/'); // replace all `\` instances with `/`
}

/** Creates a function that gets the module name from a filename */
function createGetModuleFromFilename(
    basePath = process.argv[1] ? path.dirname(process.argv[1]) : process.cwd(),
    isWindows = node_path.sep === '\\',
) {
    const normalizedBase = isWindows ? normalizeWindowsPath(basePath) : basePath;

    return (filename) => {
        if (!filename) {
            return;
        }

        const normalizedFilename = isWindows ? normalizeWindowsPath(filename) : filename;

        // eslint-disable-next-line prefer-const
        let { dir, base: file, ext } = node_path.posix.parse(normalizedFilename);

        if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
            file = file.slice(0, ext.length * -1);
        }

        if (!dir) {
            // No dirname whatsoever
            dir = '.';
        }

        const n = dir.lastIndexOf('/node_modules');
        if (n > -1) {
            return `${dir.slice(n + 14).replace(/\//g, '.')}:${file}`;
        }

        // Let's see if it's a part of the main module
        // To be a part of main module, it has to share the same base
        if (dir.startsWith(normalizedBase)) {
            let moduleName = dir.slice(normalizedBase.length + 1).replace(/\//g, '.');

            if (moduleName) {
                moduleName += ':';
            }
            moduleName += file;

            return moduleName;
        }

        return file;
    };
}

const defaultStackParser = stacktrace.createStackParser(nodeStackTrace.nodeStackLineParser(createGetModuleFromFilename()));

exports.createGetModuleFromFilename = createGetModuleFromFilename;
exports.defaultStackParser = defaultStackParser;
//# sourceMappingURL=api.js.map
