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
