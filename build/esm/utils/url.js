function urlEncode(object) {
    return Object.keys(object)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`)
        .join('&');
}

export { urlEncode };
//# sourceMappingURL=url.js.map
