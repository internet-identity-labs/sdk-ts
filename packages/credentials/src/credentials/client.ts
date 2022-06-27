import { Principal } from '@dfinity/principal';
import { defaultProvider, validateEventOrigin } from '.';
import {
    createWindow,
    done,
    postMessageToProvider,
    WindowFeatures,
} from '../window';
import { ProviderEvents } from './provider';

export type ClientEvents = { kind: 'RequestPhoneNumberCredential' };

export interface CredentialResult {
    phoneNumber: string;
    client: Principal;
    domain: string;
    createdDate: Date;
}

export type CredentialProviderConf =
    | {
          windowFeatures?: WindowFeatures;
          provider: URL;
      }
    | undefined;

export async function requestPhoneNumberCredential(
    { provider, windowFeatures }: CredentialProviderConf = {
        provider: defaultProvider,
    }
): Promise<CredentialResult> {
    return new Promise((resolve, reject) => {
        handler = getHandler(resolve, provider);
        window.addEventListener('message', handler);
        window.onbeforeunload = () => {
            window.removeEventListener('message', handler);
        };
        createWindow(provider.toString(), reject, windowFeatures);
    });
}

let handler: (event: MessageEvent<ProviderEvents>) => void;

function getHandler(resolve: (x: CredentialResult) => void, provider: URL) {
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
            done();
        }
    };
}
