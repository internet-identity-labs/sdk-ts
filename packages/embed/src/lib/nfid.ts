import { fromEvent, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { NFIDEthInpageProvider } from './inpage-provider/eth';
import { buildIframe } from './iframe/make-iframe';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { NFIDIcInpageProvider } from './inpage-provider/ic';
import { Identity } from '@dfinity/agent';
import { NfidAuthClient } from './authentication';
import { getIframe } from './iframe/get-iframe';
import { request } from './postmsg-rpc';

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
        hideIframe();
        resolve(true);
      });
    });
  },

  async disconnect() {
    console.debug('NFID.disconnect');
  },
};

export class NFID {
  static _authClient: NfidAuthClient;
  static isAuthenticated = false;
  static isIframeInstantiated = false;

  static nfidIframe?: HTMLIFrameElement;

  constructor() {
    console.debug('NFID.constructor', { origin });
  }

  static async initIframe(origin: string) {
    console.debug('NFID.initIframe');
    return new Promise<boolean>((resolve) => {
      const nfidIframe = buildIframe({
        origin,
        onLoad: () => {
          console.debug('NFID.initIframe: iframe loaded');
          NFID.isIframeInstantiated = true;
          NFID.nfidIframe = nfidIframe;
          resolve(true);
        },
      });
    });
  }

  static async init({ origin = 'https://nfid.one' }: NFIDConfig) {
    console.debug('NFID.init', { origin });
    await NFID.initIframe(origin);
    NFID._authClient = await NfidAuthClient.create();
    return new this();
  }

  async renewDelegation({ targets }: { targets: string[] }) {
    console.log('NFID.renewDelegation');
    const response = await NFID._authClient.renewDelegation({
      targets,
    });
    if ('error' in response) throw new Error((response as any).error.message);

    return response;
  }

  async getDelegation(options?: { targets?: string[] }) {
    console.debug('NFID.connect');
    if (!NFID.nfidIframe) throw new Error('NFID iframe not instantiated');
    showIframe();
    return new Promise<Identity>((resolve, reject) => {
      const source = fromEvent(window, 'message');
      if (!NFID.isAuthenticated) {
        console.debug('NFID.connect: not authenticated');
        const events = source.pipe(
          first(
            (event: any) =>
              event.data && event.data.type === 'nfid_authenticated'
          )
        );
        events.subscribe(async () => {
          console.debug('NFID.connect: authenticated');
          NFID.isAuthenticated = true;
          await NFID._authClient
            .login(options)
            .then((identity) => resolve(identity))
            .catch((e) => reject({ error: e.message }))
            .finally(hideIframe);
        });
      } else {
        console.debug('NFID.connect: already authenticated');
        NFID._authClient
          .login(options)
          .then((identity) => resolve(identity))
          .catch((e) => reject({ error: e.message }))
          .finally(hideIframe);
      }
    });
  }
  async logout() {
    return NFID._authClient.logout();
  }

  async requestTransferFT({
    receiver,
    amount,
  }: {
    receiver: string;
    amount: string;
  }) {
    console.log('NFID.requestTransferFT');
    if (!NFID.nfidIframe) throw new Error('NFID iframe not instantiated');
    showIframe();
    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_requestTransfer',
      params: [
        {
          receiver,
          amount,
        },
      ],
    });
    hideIframe();

    if ('error' in response) {
      throw Error(response.error.message);
    }

    return response.result;
  }

  async requestTransferNFT({
    receiver,
    tokenId,
  }: {
    receiver: string;
    tokenId: string;
  }) {
    console.log('NFID.requestTransferNFT');
    if (!NFID.nfidIframe) throw new Error('NFID iframe not instantiated');
    showIframe();
    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_requestTransfer',
      params: [
        {
          receiver,
          tokenId,
        },
      ],
    });
    hideIframe();

    if ('error' in response) {
      throw Error(response.error.message);
    }

    return response.result;
  }

  async requestCanisterCall({
    method,
    canisterId,
    parameters,
  }: {
    method: string;
    canisterId: string;
    parameters?: string;
  }) {
    console.log('NFID.requestTransferNFT');
    if (!NFID.nfidIframe) throw new Error('NFID iframe not instantiated');
    showIframe();
    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_canisterCall',
      params: [
        {
          method,
          canisterId,
          parameters,
        },
      ],
    });
    hideIframe();

    if ('error' in response) {
      throw Error(response.error.message);
    }
    return response.result;
  }

  public get isAuthenticated() {
    return NFID._authClient.isAuthenticated;
  }

  public getIdentity() {
    return NFID._authClient.getIdentity();
  }
}
