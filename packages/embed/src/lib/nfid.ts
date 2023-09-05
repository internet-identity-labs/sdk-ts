import { fromEvent, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { NFIDEthInpageProvider } from './inpage-provider/eth';
import { buildIframe } from './iframe/make-iframe';
import { showIframe } from './iframe/mount-iframe';
import { ethers } from 'ethers';
import { NFIDIcInpageProvider } from './inpage-provider/ic';

type NFIDConfig = {
  origin: string | undefined;
  rpcUrl: string;
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

  async init({ origin = 'https://nfid.one', rpcUrl }: NFIDConfig) {
    console.debug('NFID.init', { origin, rpcUrl });

    await initProvider(rpcUrl);

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

  constructor(
    public ic: NFIDIcInpageProvider,
    public provider: NFIDEthInpageProvider,
    public nfidOrigin: string
  ) {
    this.initIframe(nfidOrigin);
  }

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

  static async init({ origin = 'https://nfid.one', rpcUrl }: NFIDConfig) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const chainId = (await provider.getNetwork()).chainId;
    const nfidInpageProvider = new NFIDEthInpageProvider(chainId, provider);
    const ic = new NFIDIcInpageProvider();

    return new this(ic, nfidInpageProvider, origin);
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
        resolve(true);
      });
    });
  }

  /**
   * Disconnects user from all chains
   */
  async disconnect() {
    this.ic.disconnect();
  }
}
