import { postMessageToClient, validateSameOrigin } from '@nfid/core';
import { ClientEvents, CredentialResult } from '.';

export type ProviderEvents =
  | { kind: 'Ready' }
  | {
      kind: 'PhoneNumberCredentialResponse';
      result: CredentialResult;
    };

export function registerPhoneNumberCredentialHandler(
  handler: () => Promise<CredentialResult>
) {
  const p = new Promise<number[]>((res) => {
    window.addEventListener(
      'message',
      async (event: MessageEvent<ClientEvents>) => {
        if (!validateSameOrigin(event, window.opener)) return;

        // We accept credential requests from the client
        if (event.data.kind === 'RequestPhoneNumberCredential') {
          res(event.data.token);
          console.info(
            `Phone number credential request received, triggering handler.`,
            event
          );
          postMessageToClient({
            kind: 'PhoneNumberCredentialResponse',
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
