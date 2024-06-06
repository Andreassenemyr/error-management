Object.defineProperty(exports, '__esModule', { value: true });

const splitPathRe = /^(\S+:\\|\/?)([\s\S]*?)((?:\.{1,2}|[^/\\]+?|)(\.[^./\\]*|))(?:[/\\]*)$/;
/** JSDoc */
function splitPath(filename) {
    // Truncate files names greater than 1024 characters to avoid regex dos
    const truncated = filename.length > 1024 ? `<truncated>${filename.slice(-1024)}` : filename;
    const parts = splitPathRe.exec(truncated);
    return parts ? parts.slice(1) : [];
}

function dirname(path) {
    const result = splitPath(path);
    const root = result[0];
    let dir = result[1];

    if (!root && !dir) {
      // No dirname whatsoever
      return '.';
    }

    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.slice(0, dir.length - 1);
    }

    return root + dir;
}

exports.dirname = dirname;
//# sourceMappingURL=path.js.map
