import { postMessageToClient, validateSameOrigin } from '@nfid/core';
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
      async function nfidHandler(event: MessageEvent<ClientEvents>) {
        if (!validateSameOrigin(event, window.opener)) return;

        // We accept RequestTransfer requests from the client
        if (event.data.kind === 'RequestTransfer') {
          resolve(event.data.params);
          console.debug(
            `registerRequestTransferHandler: request received, triggering handler.`,
            event
          );
          postMessageToClient({
            kind: 'RequestTransferResponse',
            result: await handler(),
          });
          window.removeEventListener('message', nfidHandler);
          window.close();
        }
      }
    );
  });

  postMessageToClient({ kind: 'Ready' });
  return p;
}
