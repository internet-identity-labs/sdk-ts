import { Actor, HttpAgent } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import { defaultProvider, validateEventOrigin } from '.';
import {
    createWindow,
    defaultWindowFeatures,
    done,
    postMessageToProvider,
    WindowFeatures,
} from '../window';
import { ProviderEvents } from './provider';
import { _SERVICE as Verifier } from '../declarations/verifier.did.d';
import { idlFactory as verifierIDL } from '../declarations/verifier.did';
import { getPersonaDomain } from '../common';

export type ClientEvents = {
    kind: 'RequestPhoneNumberCredential';
    token: number[];
};

export interface CredentialResult {
    domain: string;
    clientPrincipal: string;
    phoneNumberSha2?: string;
    createdDate: Date;
}

export type CredentialProviderConf = {
    windowFeatures?: WindowFeatures;
    provider?: URL;
};

const VERIFIER_CANISTER_ID = 'gzqxf-kqaaa-aaaak-qakba-cai';

export async function requestPhoneNumberCredential(
    identity: DelegationIdentity,
    config?: CredentialProviderConf
): Promise<CredentialResult | undefined> {
    const provider = config?.provider || defaultProvider;
    const windowFeatures = config?.windowFeatures || defaultWindowFeatures;
    return new Promise(async (resolve, reject) => {
        handler = await getHandler(resolve, provider, identity);
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

async function getHandler(
    resolve: (x: CredentialResult | undefined) => void,
    provider: URL,
    identity: DelegationIdentity
) {
    return async function (event: MessageEvent<ProviderEvents>) {
        if (!validateEventOrigin(event, provider.origin)) return;

        if (event.data.kind === 'Ready') {
            console.info(
                'Creating certificate with app delegation to await resolution from NFID delegation.'
            );
            const token = await Actor.createActor<Verifier>(verifierIDL, {
                canisterId: VERIFIER_CANISTER_ID,
                agent: new HttpAgent({ identity, host: 'https://ic0.app' }),
            })
                .generate_pn_token(getPersonaDomain(window.location))
                .then(r => Array.from(r));
            console.info('Credential provider is ready, request credential.');
            postMessageToProvider({
                kind: 'RequestPhoneNumberCredential',
                token,
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
