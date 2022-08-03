/**
 * Extract string expected by NFID personas from URL.
 */
export function getPersonaDomain(location: URL | Location): string {
    const url = new URL(location.toString());
    return `${url.protocol}//${url.host}`;
}
