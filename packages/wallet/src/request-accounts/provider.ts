import { postMessageToClient, validateSameOrigin } from '@nfid/core';
import {
  RequestAccountsClientEvents,
  RequestAccountsResult,
} from './request-accounts';

export type RequestAccountsProviderEvents =
  | { kind: 'Ready' }
  | {
      kind: 'RequestAccountsResponse';
      result: RequestAccountsResult;
    };

export function registerRequestAccountsHandler(
  handler: () => Promise<RequestAccountsResult>
) {
  const p = new Promise<string>((resolve) => {
    window.addEventListener(
      'message',
      async function nfidHandler(
        event: MessageEvent<RequestAccountsClientEvents>
      ) {
        if (!validateSameOrigin(event, window.opener)) return;

        // We accept RequestAccounts requests from the client
        if (event.data.kind === 'RequestAccounts') {
          resolve(event.data.kind);
          console.debug(
            `registerRequestAccountsHandler: request received, triggering handler.`,
            event
          );
          postMessageToClient({
            kind: 'RequestAccountsResponse',
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
