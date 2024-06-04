Object.defineProperty(exports, '__esModule', { value: true });

const logger = require('./utils/logger.js');

const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;

function isValidProtocol(protocol) {
    return protocol === 'http' || protocol === 'https';
}

function dsnToString(dsn, withPassword = false) {
    const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
    return (
      `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ''}` +
      `@${host}${port ? `:${port}` : ''}/${path ? `${path}/` : path}${projectId}`
    );
}

function dsnFromString(str) {
    const match = DSN_REGEX.exec(str);

    if (!match) {
        // This should be logged to the console
        logger.consoleSandbox(() => {
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
        projectId = split.pop() ;
    }

    if (projectId) {
        const projectMatch = projectId.match(/^\d+/);
        if (projectMatch) {
            projectId = projectMatch[0];
        }
    }

    return dsnFromComponents({ host, pass, path, projectId, port, protocol: protocol , publicKey });
}

function dsnFromComponents(components) {
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

function validateDsn(dsn) {
    const { port, projectId, protocol } = dsn;

    const requiredComponents = ['protocol', 'publicKey', 'host', 'projectId'];
    const hasMissingRequiredComponent = requiredComponents.find(component => {
        if (!dsn[component]) {
            logger.logger.error(`Invalid Ribban Dsn: ${component} missing`);
            return true;
        }

        return false;
    });

    if (hasMissingRequiredComponent) {
        return false;
    }

    if (!projectId.match(/^\d+$/)) {
        logger.logger.error(`Invalid Ribban Dsn: Invalid projectId ${projectId}`);
        return false;
    }

    if (!isValidProtocol(protocol)) {
        logger.logger.error(`Invalid Ribban Dsn: Invalid protocol ${protocol}`);
        return false;
    }

    if (port && isNaN(parseInt(port, 10))) {
        logger.logger.error(`Invalid Ribban Dsn: Invalid port ${port}`);
        return false;
    }

    return true;
}

function createDSN(from) {
    const components = typeof from === 'string' ? dsnFromString(from) : dsnFromComponents(from);
    if (!components || !validateDsn(components)) {
        return undefined;
    }

    return components;
}

exports.createDSN = createDSN;
exports.dsnFromString = dsnFromString;
exports.dsnToString = dsnToString;
//# sourceMappingURL=dsn.js.map
