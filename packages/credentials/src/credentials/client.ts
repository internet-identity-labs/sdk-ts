import { provider, validateEventOrigin } from '.';
import { createWindow, postMessageToProvider } from '../window';
import { ProviderEvents } from './provider';

export type ClientEvents = { kind: 'RequestPhoneNumberCredential' };

export interface CredentialResult {
    credential: string;
    result: boolean;
}

let handler: (event: MessageEvent<ProviderEvents>) => void;

export async function requestPhoneNumberCredential(): Promise<CredentialResult> {
    return new Promise(resolve => {
        handler = getHandler(resolve);
        window.addEventListener('message', handler);
        createWindow(provider.toString());
    });
}

function getHandler(resolve: (x: CredentialResult) => void) {
    return function (event: MessageEvent<ProviderEvents>) {
        if (!validateEventOrigin(event, provider.origin)) return;

        if (event.data.kind === 'Ready') {
            console.info('Credential provider is ready, request credential.');
            postMessageToProvider({ kind: 'RequestPhoneNumberCredential' });
        }

        if (event.data.kind === 'PhoneNumberCredentialResponse') {
            console.info('Credential flow is complete.');
            window.removeEventListener('message', handler);
            resolve(event.data.result);
        }
    };
}
