import {
    ClientEvents,
    postMessageToClient,
    validateEventOrigin,
    CredentialResult,
} from '..';

export type ProviderEvents =
    | { kind: 'Ready' }
    | { kind: 'PhoneNumberCredentialResponse'; result: CredentialResult };

export function registerPhoneNumberCredentialHandler(
    handler: () => Promise<CredentialResult>
) {
    window.addEventListener(
        'message',
        async (event: MessageEvent<ClientEvents>) => {
            // if (!validateEventOrigin(event, window.opener.origin)) return;

            // We accept credential requests from the client
            if (event.data.kind === 'RequestPhoneNumberCredential') {
                console.info(
                    `Phone number credential request received, triggering handler.`
                );
                postMessageToClient({
                    kind: 'PhoneNumberCredentialResponse',
                    result: await handler(),
                });
                window.close();
            }
        }
    );

    postMessageToClient({ kind: 'Ready' });
}
