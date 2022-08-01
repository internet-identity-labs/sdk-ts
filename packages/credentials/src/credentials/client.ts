import { Actor } from '@dfinity/agent';
import { defaultProvider, validateEventOrigin } from '.';
import {
    createWindow,
    done,
    postMessageToProvider,
    WindowFeatures,
} from '../window';
import { ProviderEvents } from './provider';
import { _SERVICE as Verifier } from '../declarations/verifier.did.d';
import { idlFactory as verifierIDL } from '../declarations/verifier.did';

export type ClientEvents = {
    kind: 'RequestPhoneNumberCredential';
    hostname: string;
};

export interface CredentialResult {
    domain: string;
    clientPrincipal: string;
    phoneNumberSha2?: string;
    createdDate: Date;
}

export type CredentialProviderConf =
    | {
          windowFeatures?: WindowFeatures;
          provider: URL;
      }
    | undefined;

const VERIFIER_CANISTER_ID = 'gzqxf-kqaaa-aaaak-qakba-cai';

export async function requestPhoneNumberCredential(
    { provider, windowFeatures }: CredentialProviderConf = {
        provider: defaultProvider,
    }
): Promise<CredentialResult | undefined> {
    return new Promise((resolve, reject) => {
        handler = getHandler(resolve, provider);
        window.addEventListener('message', handler);
        window.onbeforeunload = () => {
            window.removeEventListener('message', handler);
        };
        createWindow(provider.toString(), reject, windowFeatures);
    });
}

export async function verifyPhoneNumberCredential(ownerPrincipal: string) {
    console.debug(verifyPhoneNumberCredential.name, {
        ownerPrincipal,
        VERIFIER_CANISTER_ID,
    });
    const verifier = Actor.createActor<Verifier>(verifierIDL, {
        canisterId: VERIFIER_CANISTER_ID,
    });
    const result = await verifier.is_phone_number_approved(ownerPrincipal);
    console.debug(verifyPhoneNumberCredential.name, {
        ownerPrincipal,
        result,
    });
    return result.data[0];
}

let handler: (event: MessageEvent<ProviderEvents>) => void;

function getHandler(
    resolve: (x: CredentialResult | undefined) => void,
    provider: URL
) {
    return function (event: MessageEvent<ProviderEvents>) {
        if (!validateEventOrigin(event, provider.origin)) return;

        if (event.data.kind === 'Ready') {
            console.info('Credential provider is ready, request credential.');
            postMessageToProvider({
                kind: 'RequestPhoneNumberCredential',
                hostname: `${window.location.protocol}//${window.location.host}`,
            });
        }

        if (event.data.kind === 'PhoneNumberCredentialResponse') {
            console.info('Credential flow is complete.', event.data.result);
            window.removeEventListener('message', handler);
            resolve(event.data.result);
            done();
        }
    };
}
