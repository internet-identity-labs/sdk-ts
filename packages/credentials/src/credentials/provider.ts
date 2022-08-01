import {
    ClientEvents,
    postMessageToClient,
    validateEventOrigin,
    CredentialResult,
} from '..';

export type ProviderEvents =
    | { kind: 'Ready' }
    | {
          kind: 'PhoneNumberCredentialResponse';
          result: CredentialResult | undefined;
      };

export function registerPhoneNumberCredentialHandler(
    handler: () => Promise<CredentialResult | undefined>
) {
    const p = new Promise<string>(res => {
        window.addEventListener(
            'message',
            async (event: MessageEvent<ClientEvents>) => {
                // if (!validateEventOrigin(event, window.opener.origin)) return;

                // We accept credential requests from the client
                if (event.data.kind === 'RequestPhoneNumberCredential') {
                    res(event.data.hostname);
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
