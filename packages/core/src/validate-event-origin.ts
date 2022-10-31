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

export function validateSameOrigin(
  event: MessageEvent,
  origin: Window
): boolean {
  console.debug('validateSameOrigin', {
    origin,
    event,
  });
  if (event.source !== origin) {
    console.warn(`WARNING: expected same origin (ignoring)`, { event, origin });
    return false;
  }
  return true;
}
