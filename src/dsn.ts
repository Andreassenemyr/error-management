import { consoleSandbox, logger } from "./utils/logger";

export type DsnProtocol = 'http' | 'https';

const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;

export interface HostComponent {
    protocol: DsnProtocol;
    publicKey?: string;
    pass?: string; /* Deprected / Optional */
    // Hostname till denna Ribban Log Instance
    host: string;
    // Port
    port: string;
    // Sub path
    path?: string;
    // ID till projektet
    projectId: string;
}

function isValidProtocol(protocol?: string): protocol is DsnProtocol {
    return protocol === 'http' || protocol === 'https';
}
  

export function dsnToString(dsn: HostComponent, withPassword: boolean = false): string {
    const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
    return (
      `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ''}` +
      `@${host}${port ? `:${port}` : ''}/${path ? `${path}/` : path}${projectId}`
    );
}

export function dsnFromString(str: string): HostComponent | undefined {
    const match = DSN_REGEX.exec(str);
  
    if (!match) {
        // This should be logged to the console
        consoleSandbox(() => {
            // eslint-disable-next-line no-console
            console.error(`Invalid Ribban Dsn: ${str}`);
        });

        return undefined;
    }
  
    const [protocol, publicKey, pass = '', host, port = '', lastPath] = match.slice(1);
    let path = '';
    let projectId = lastPath;
  
    const split = projectId.split('/');
    if (split.length > 1) {
        path = split.slice(0, -1).join('/');
        projectId = split.pop() as string;
    }
  
    if (projectId) {
        const projectMatch = projectId.match(/^\d+/);
        if (projectMatch) {
            projectId = projectMatch[0];
        }
    }
  
    return dsnFromComponents({ host, pass, path, projectId, port, protocol: protocol as DsnProtocol, publicKey });
}

function dsnFromComponents(components: HostComponent): HostComponent {
    return {
      protocol: components.protocol,
      publicKey: components.publicKey || '',
      pass: components.pass || '',
      host: components.host,
      port: components.port || '',
      path: components.path || '',
      projectId: components.projectId,
    };
}
  
function validateDsn(dsn: HostComponent): boolean {
    const { port, projectId, protocol } = dsn;
  
    const requiredComponents: ReadonlyArray<keyof HostComponent> = ['protocol', 'publicKey', 'host', 'projectId'];
    const hasMissingRequiredComponent = requiredComponents.find(component => {
        if (!dsn[component]) {
            logger.error(`Invalid Ribban Dsn: ${component} missing`);
            return true;
        }

        return false;
    });
  
    if (hasMissingRequiredComponent) {
        return false;
    }
  
    if (!projectId.match(/^\d+$/)) {
        logger.error(`Invalid Ribban Dsn: Invalid projectId ${projectId}`);
        return false;
    }
  
    if (!isValidProtocol(protocol)) {
        logger.error(`Invalid Ribban Dsn: Invalid protocol ${protocol}`);
        return false;
    }
  
    if (port && isNaN(parseInt(port, 10))) {
        logger.error(`Invalid Ribban Dsn: Invalid port ${port}`);
        return false;
    }
  
    return true;
}
  

export function createDSN(from: string | HostComponent): HostComponent | undefined {
    const components = typeof from === 'string' ? dsnFromString(from) : dsnFromComponents(from);
    if (!components || !validateDsn(components)) {
        return undefined;
    }

    return components;
}