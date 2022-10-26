import { postMessageToClient } from '@nfid/core';
import { RequestTransferEvents, RequestTransferResult } from './wallet';

export type ProviderEvents =
  | { kind: 'Ready' }
  | {
      kind: 'RequestTransferResponse';
      result: RequestTransferResult;
    };

export function registerRequestTransferHandler(
  handler: () => Promise<RequestTransferResult>
) {
  const p = new Promise<void>((resolve) => {
    window.addEventListener(
      'message',
      async (event: MessageEvent<RequestTransferEvents>) => {
        // if (!validateEventOrigin(event, window.opener.origin)) return;

        // We accept RequestTransfer requests from the client
        if (event.data.kind === 'RequestTransferResponse') {
          console.info(
            `Request transfer request received, triggering handler.`,
            event
          );
          postMessageToClient({
            kind: 'RequestTransferResponse',
            result: await handler(),
          });
          resolve();
          window.close();
        }
      }
    );
  });

  postMessageToClient({ kind: 'Ready' });
  return p;
}
