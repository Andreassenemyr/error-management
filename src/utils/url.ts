export function urlEncode(object: { [key: string]: any }): string {
    return Object.keys(object)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`)
        .join('&');
};