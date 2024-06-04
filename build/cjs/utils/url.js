Object.defineProperty(exports, '__esModule', { value: true });

function urlEncode(object) {
    return Object.keys(object)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`)
        .join('&');
}

exports.urlEncode = urlEncode;
//# sourceMappingURL=url.js.map
