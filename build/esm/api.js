import { urlEncode } from './utils/url.js';

const RIBBAN_API_VERSION = '1';

function getBaseAPIEndpoint(host) {
    const protocol = host.protocol ? `${host.protocol}:` : '';
    const port = host.port ? `:${host.port}` : '';
    return `${protocol}//${host.host}${port}${host.path ? `/${host.path}` : ''}/api/`;
}
function _encodedAuthentication(host) {
    return urlEncode({
        ribban_key: host.publicKey,
        ribban_version: RIBBAN_API_VERSION,
    });
}
function _getIngestEndpoint(dsn) {
    return `${getBaseAPIEndpoint(dsn)}${dsn.projectId}/envelope`;
}

function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel) {
    return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuthentication(dsn)}`;
}

export { getEnvelopeEndpointWithUrlEncodedAuth };
//# sourceMappingURL=api.js.map
