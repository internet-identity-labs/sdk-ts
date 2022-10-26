import { postMessageToClient } from '@nfid/core';
import {
  ClientEvents,
  RequestTransferParams,
  RequestTransferResult,
} from './wallet';

export type ProviderEvents =
  | { kind: 'Ready' }
  | {
      kind: 'RequestTransferResponse';
      result: RequestTransferResult;
    };

export function registerRequestTransferHandler(
  handler: () => Promise<RequestTransferResult>
) {
  const p = new Promise<RequestTransferParams>((resolve) => {
    window.addEventListener(
      'message',
      async (event: MessageEvent<ClientEvents>) => {
        // if (!validateEventOrigin(event, window.opener.origin)) return;

        // We accept RequestTransfer requests from the client
        if (event.data.kind === 'RequestTransfer') {
          resolve(event.data.params);
          console.info(
            `Request transfer request received, triggering handler.`,
            event
          );
          postMessageToClient({
            kind: 'RequestTransferResponse',
            result: await handler(),
          });
          window.close();
        }
      }
    );
  });

  postMessageToClient({ kind: 'Ready' });
  return p;
}
