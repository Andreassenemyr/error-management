const splitPathRe = /^(\S+:\\|\/?)([\s\S]*?)((?:\.{1,2}|[^/\\]+?|)(\.[^./\\]*|))(?:[/\\]*)$/;
/** JSDoc */
function splitPath(filename: string): string[] {
    // Truncate files names greater than 1024 characters to avoid regex dos
    // https://github.com/getsentry/sentry-javascript/pull/8737#discussion_r1285719172
    const truncated = filename.length > 1024 ? `<truncated>${filename.slice(-1024)}` : filename;
    const parts = splitPathRe.exec(truncated);
    return parts ? parts.slice(1) : [];
}

export function dirname(path: string): string {
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

  