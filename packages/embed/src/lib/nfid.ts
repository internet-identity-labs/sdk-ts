import { fromEvent, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { NFIDEthInpageProvider } from './inpage-provider/eth';
import { buildIframe } from './iframe/make-iframe';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { Signature, ethers } from 'ethers';
import { NFIDIcInpageProvider } from './inpage-provider/ic';
import { request } from './postmsg-rpc';
import {
  Delegation,
  DelegationChain,
  DelegationIdentity,
  Ed25519KeyIdentity,
} from '@dfinity/identity';
import { getIframe } from './iframe/get-iframe';
import { DerEncodedPublicKey } from '@dfinity/agent';

type NFIDConfig = {
  origin: string | undefined;
};

interface NFIDObservable {
  origin?: string;
  provider?: NFIDEthInpageProvider;
  ic?: NFIDIcInpageProvider;
  nfidIframe?: HTMLIFrameElement;
  isAuthenticated: boolean;
  isIframeInstantiated: boolean;
}

const nfidBehaviorSubject$ = new BehaviorSubject<NFIDObservable>({
  isAuthenticated: false,
  isIframeInstantiated: false,
});

nfidBehaviorSubject$.subscribe({
  next(value) {
    console.debug('nfidBehavioorSubject: new state', { value });
  },
  error(err) {
    console.error('nfidBehavioorSubject: something went wrong:', { err });
  },
  complete() {
    console.debug('nfidBehavioorSubject done');
  },
});

const initProvider = async (rpcUrl: string) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const chainId = (await provider.getNetwork()).chainId;
  const nfidInpageProvider = new NFIDEthInpageProvider(chainId, provider);
  const icInpageProvider = new NFIDIcInpageProvider();

  nfidBehaviorSubject$.next({
    ...nfidBehaviorSubject$.value,
    provider: nfidInpageProvider,
    ic: icInpageProvider,
  });

  return;
};

export const nfid = {
  get provider() {
    return nfidBehaviorSubject$.value.provider;
  },
  get ic() {
    return nfidBehaviorSubject$.value.ic;
  },
  get isAuthenticated() {
    return nfidBehaviorSubject$.value.isAuthenticated;
  },
  get isIframeInstantiated() {
    return nfidBehaviorSubject$.value.isIframeInstantiated;
  },

  async init({ origin = 'https://nfid.one' }: NFIDConfig) {
    console.debug('NFID.init', { origin });

    console.debug('NFID.init: inpage providers instantiated');
    return new Promise<boolean>((resolve) => {
      const nfidIframe = buildIframe({
        origin,
        onLoad: () => {
          nfidBehaviorSubject$.next({
            ...nfidBehaviorSubject$.value,
            isIframeInstantiated: true,
            nfidIframe,
          });
          resolve(true);
        },
      });
    });
  },

  /**
   * @deprecated - use connect() instead
   */
  async login() {
    this.connect();
  },

  async connect() {
    if (!nfidBehaviorSubject$.value.nfidIframe)
      throw new Error('NFID iframe not instantiated');
    showIframe();
    return new Promise<boolean>((resolve) => {
      const source = fromEvent(window, 'message');
      const events = source.pipe(
        first(
          (event: any) => event.data && event.data.type === 'nfid_authenticated'
        )
      );
      events.subscribe(() => {
        console.debug('NFID.connect: authenticated');
        nfidBehaviorSubject$.next({
          ...nfidBehaviorSubject$.value,
          isAuthenticated: true,
        });
        resolve(true);
      });
    });
  },

  async disconnect() {
    console.debug('NFID.disconnect');
  },
};

export class NFID {
  public isAuthenticated = false;
  public isIframeInstantiated = false;

  private nfidIframe?: HTMLIFrameElement;

  constructor(public nfidOrigin: string) {
    this.initIframe(nfidOrigin);
  }

  // Move to iFrameManager? Separate class?
  async initIframe(origin: string) {
    return new Promise<boolean>((resolve) => {
      const nfidIframe = buildIframe({
        origin,
        onLoad: () => {
          this.isIframeInstantiated = true;
          this.nfidIframe = nfidIframe;
          resolve(true);
        },
      });
    });
  }

  static init({ origin = 'https://nfid.one' }: NFIDConfig) {
    return new this(origin);
  }

  async getDelegation() {
    console.debug('NFID.getDelegation');
    const iframe = getIframe();
    const sessionKey = Ed25519KeyIdentity.generate();
    const response = await request(iframe, {
      method: 'ic_getDelegation',
      params: [
        {
          sessionPublicKey: new Uint8Array(
            sessionKey.getPublicKey().toDer() as ArrayBuffer
          ),
          maxTimeToLive: BigInt(Date.now() + 6 * 30 * 24 * 60 * 60 * 1e9),
          targets: ['a', 'b', 'c'],
        },
      ],
    });
    console.debug('NFID.getDelegation', { response });
    const delegations = response.result.delegations.map(
      (signedDelegation: any) => {
        return {
          delegation: new Delegation(
            signedDelegation.delegation.pubkey,
            signedDelegation.delegation.expiration,
            signedDelegation.delegation.targets
          ),
          signature: signedDelegation.signature.buffer as Signature,
        };
      }
    );
    const delegationChain = DelegationChain.fromDelegations(
      delegations,
      response.result.userPublicKey.buffer as DerEncodedPublicKey
    );
    const identity = DelegationIdentity.fromDelegation(
      sessionKey,
      delegationChain
    );
    console.debug('NFID.getDelegation: identity', {
      principalId: identity.getPrincipal().toString(),
    });
    hideIframe();
  }

  async renewDelegation() {
    const iframe = getIframe();
    const sessionKey = Ed25519KeyIdentity.generate();
    await request(iframe, {
      method: 'ic_renewDelegation',
      params: [
        {
          sessionPublicKey: new Uint8Array(
            sessionKey.getPublicKey().toDer() as ArrayBuffer
          ),
          maxTimeToLive: BigInt(Date.now() + 6 * 30 * 24 * 60 * 60 * 1e9),
          targets: ['a', 'b', 'c'],
        },
      ],
    });
  }

  async connect() {
    console.log('NFID.connect');
    if (!this.nfidIframe) throw new Error('NFID iframe not instantiated');
    showIframe();
    return new Promise<boolean>((resolve) => {
      const source = fromEvent(window, 'message');
      const events = source.pipe(
        first(
          (event: any) => event.data && event.data.type === 'nfid_authenticated'
        )
      );
      events.subscribe(() => {
        console.debug('NFID.connect: authenticated');
        this.isAuthenticated = true;
        this.getDelegation();
        resolve(true);
      });
    });
  }
}
