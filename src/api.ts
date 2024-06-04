import { HostComponent } from "./dsn";
import { StackLineParser, StackLineParserFn, StackParser, createStackParser } from "./types/stacktrace";
import { urlEncode } from "./utils/url";

const RIBBAN_API_VERSION = '1';

function getBaseAPIEndpoint(host: HostComponent): string {
    const protocol = host.protocol ? `${host.protocol}:` : '';
    const port = host.port ? `:${host.port}` : '';
    return `${protocol}//${host.host}${port}${host.path ? `/${host.path}` : ''}/api/`;
};

function _encodedAuthentication(host: HostComponent): string {
    return urlEncode({
        ribban_key: host.publicKey,
        ribban_version: RIBBAN_API_VERSION,
    });
};

function _getIngestEndpoint(dsn: HostComponent): string {
    return `${getBaseAPIEndpoint(dsn)}${dsn.projectId}/envelope`;
}

export function getEnvelopeEndpointWithUrlEncodedAuth(dsn: HostComponent, tunnel?: string): string {
    return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuthentication(dsn)}`;
}

export type GetModuleFn = (filename: string | undefined) => string | undefined;

/**
 * Does this filename look like it's part of the app code?
 */
export function filenameIsInApp(filename: string, isNative: boolean = false): boolean {
    const isInternal =
      isNative ||
      (filename &&
        // It's not internal if it's an absolute linux path
        !filename.startsWith('/') &&
        // It's not internal if it's an absolute windows path
        !filename.match(/^[A-Z]:/) &&
        // It's not internal if the path is starting with a dot
        !filename.startsWith('.') &&
        // It's not internal if the frame has a protocol. In node, this is usually the case if the file got pre-processed with a bundler like webpack
        !filename.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//)); // Schema from: https://stackoverflow.com/a/3641782
        
    // in_app is all that's not an internal Node function or a module within node_modules
    // note that isNative appears to return true even for node core libraries
        
    return !isInternal && filename !== undefined && !filename.includes('node_modules/');
}

export function node(getModule?: GetModuleFn): StackLineParserFn {
    const FILENAME_MATCH = /^\s*[-]{4,}$/;
    const FULL_MATCH = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/;
  
    // eslint-disable-next-line complexity
    return (line: string) => {
      const lineMatch = line.match(FULL_MATCH);
  
      if (lineMatch) {
        let object: string | undefined;
        let method: string | undefined;
        let functionName: string | undefined;
        let typeName: string | undefined;
        let methodName: string | undefined;
  
        if (lineMatch[1]) {
          functionName = lineMatch[1];
  
          let methodStart = functionName.lastIndexOf('.');
          if (functionName[methodStart - 1] === '.') {
            methodStart--;
          }
  
          if (methodStart > 0) {
            object = functionName.slice(0, methodStart);
            method = functionName.slice(methodStart + 1);
            const objectEnd = object.indexOf('.Module');
            if (objectEnd > 0) {
              functionName = functionName.slice(objectEnd + 1);
              object = object.slice(0, objectEnd);
            }
          }
          typeName = undefined;
        }
  
        if (method) {
          typeName = object;
          methodName = method;
        }
  
        if (method === '<anonymous>') {
          methodName = undefined;
          functionName = undefined;
        }
  
        if (functionName === undefined) {
          methodName = methodName || '?';
          functionName = typeName ? `${typeName}.${methodName}` : methodName;
        }
  
        let filename = lineMatch[2] && lineMatch[2].startsWith('file://') ? lineMatch[2].slice(7) : lineMatch[2];
        const isNative = lineMatch[5] === 'native';
  
        // If it's a Windows path, trim the leading slash so that `/C:/foo` becomes `C:/foo`
        if (filename && filename.match(/\/[A-Z]:/)) {
          filename = filename.slice(1);
        }
  
        if (!filename && lineMatch[5] && !isNative) {
          filename = lineMatch[5];
        }
  
        return {
          filename,
          module: getModule ? getModule(filename) : undefined,
          function: functionName,
          lineno: parseInt(lineMatch[3], 10) || undefined,
          colno: parseInt(lineMatch[4], 10) || undefined,
          in_app: filenameIsInApp(filename, isNative),
        };
      }
  
      if (line.match(FILENAME_MATCH)) {
        return {
          filename: line,
        };
      }
  
      return undefined;
    };
}
  