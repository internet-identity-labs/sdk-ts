import { Actor, HttpAgent } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import { defaultProvider } from '.';
import {
  createWindow,
  defaultWindowFeatures,
  done,
  NFIDProviderConf,
  postMessageToProvider,
  validateEventOrigin,
} from '@nfid/core';
import { ProviderEvents } from './provider';
import { _SERVICE as Verifier } from '../declarations/verifier.did.d';
import { idlFactory as verifierIDL } from '../declarations/verifier.did';
import { getPersonaDomain } from '../common';

export type ClientEvents = {
  kind: 'RequestPhoneNumberCredential';
  token: number[];
};

export type CredentialResult =
  | { status: 'SUCCESS' }
  | { status: 'REJECTED'; message: string }
  | { status: 'ERROR'; message: string };

export interface CredentialProviderConf extends NFIDProviderConf {
  verifier?: string;
}

export const VERIFIER_CANISTER_ID_DEV = 'gzqxf-kqaaa-aaaak-qakba-cai';
export const VERIFIER_CANISTER_ID_PROD = 'sgk26-7yaaa-aaaan-qaovq-cai';
const defaultVerifier = VERIFIER_CANISTER_ID_PROD;

export async function requestPhoneNumberCredential(
  identity: DelegationIdentity,
  config?: CredentialProviderConf
): Promise<CredentialResult> {
  const provider = config?.provider || defaultProvider;
  const windowFeatures = config?.windowFeatures || defaultWindowFeatures;
  const verifier = config?.verifier || defaultVerifier;
  return new Promise((resolve) => {
    const handler = getHandler(resolve, provider, verifier, identity);
    window.addEventListener('message', handler);
    window.onbeforeunload = () => {
      window.removeEventListener('message', handler);
    };
    createWindow(
      provider.toString(),
      () =>
        resolve({
          status: 'ERROR',
          message: 'Terminated by user',
        }),
      windowFeatures
    );
  });
}

export async function verifyPhoneNumberCredential(
  ownerPrincipal: string,
  verifier: string = defaultVerifier
) {
  console.debug('verifyPhoneNumberCredential', {
    ownerPrincipal,
    verifier,
  });
  const actor = Actor.createActor<Verifier>(verifierIDL, {
    canisterId: verifier,
  });
  const result = await actor.is_phone_number_approved(ownerPrincipal);
  console.debug('verifyPhoneNumberCredential', {
    ownerPrincipal,
    result,
  });
  return result.data[0];
}

function getHandler(
  resolve: (x: CredentialResult) => void,
  provider: URL,
  verifier: string,
  identity: DelegationIdentity
) {
  return async function handler(event: MessageEvent<ProviderEvents>) {
    if (!validateEventOrigin(event, provider.origin)) return;

    if (event.data.kind === 'Ready') {
      console.info(
        'Creating certificate with app delegation to await resolution from NFID delegation.'
      );
      const token = await Actor.createActor<Verifier>(verifierIDL, {
        canisterId: verifier,
        agent: new HttpAgent({ identity, host: 'https://ic0.app' }),
      })
        .generate_pn_token(getPersonaDomain(window.location))
        .then((r) => Array.from(r));
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
