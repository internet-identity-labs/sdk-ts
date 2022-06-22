export * from './client';
export * from './provider';

export const provider = new URL(`${window.location.origin}/provider`);

export function validateEventOrigin(
    event: MessageEvent,
    origin: string
): boolean {
    if (event.origin !== origin) {
        console.warn(
            `WARNING: expected origin '${origin}', got '${event.origin}' (ignoring)`
        );
        return false;
    }
    return true;
}
