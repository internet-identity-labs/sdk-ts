import { buildIframe } from './iframe/make-iframe';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { Identity } from '@dfinity/agent';
import { DelegationType, NfidAuthClient } from './authentication';
import { getIframe } from './iframe/get-iframe';
import { request } from './postmsg-rpc';
import { NFIDConfig } from './types';

export class NFID {
  static _authClient: NfidAuthClient;
  static isIframeInstantiated = false;

  static nfidIframe?: HTMLIFrameElement;

  constructor(private _nfidConfig?: NFIDConfig) {
    console.debug('NFID.constructor', { _nfidConfig });
  }

  private static async initIframe(nfidConfig: { origin: string } & NFIDConfig) {
    console.debug('NFID.initIframe', { nfidConfig });
    return new Promise<boolean>((resolve) => {
      const nfidIframe = buildIframe({
        origin: nfidConfig.origin,
        applicationName: nfidConfig.application?.name,
        applicationLogo: nfidConfig.application?.logo,
        onLoad: () => {
          NFID.isIframeInstantiated = true;
          NFID.nfidIframe = nfidIframe;
          console.debug('NFID.initIframe: iframe loaded', { nfidIframe });
          resolve(true);
        },
      });
    });
  }

  static async init(params: NFIDConfig) {
    const { origin = 'https://nfid.one', ...nfidConfig } = params;

    console.debug('NFID.init', { origin, ...nfidConfig });
    await NFID.initIframe({ origin, ...nfidConfig });
    console.debug('NFID.init iframe initiated');
    NFID._authClient = await NfidAuthClient.create({
      identity: nfidConfig.identity,
      storage: nfidConfig.storage,
      keyType: nfidConfig.keyType,
      idleOptions: nfidConfig.idleOptions,
    });

    await new Promise((resolve, reject) => {
      const removeEventListener = () => {
        window.removeEventListener('message', handleReadyEvent);
      }
      const handleReadyEvent = (event: MessageEvent<{ type: string }>) => {
        console.debug('NFID.init received event', { event });
        if (event.data.type === 'nfid_ready') {
          console.debug('NFID.init received nfid_ready event!');
          removeEventListener()
          resolve(true);
        }
      };

      setTimeout(() => {
        removeEventListener()
        reject(new Error('NFID.init iframe did not respond in time')); 
      }, 30000);
      
      window.addEventListener('message', handleReadyEvent);
    });

    console.debug('NFID.init authClient initiated');
    return new this({ origin, ...nfidConfig });
  }

  /**
   * Retrieves a delegation from the NFID iframe.
   * @param options An optional object containing the following properties:
   * @param options.targets An array of target strings.
   * @param options.targets:
   * @param options.maxTimeToLive: The maximum time to live as a BigInt.
   * @param options.derivationOrigin: The derivation origin as a string or URL.
   * @returns A promise that resolves with an Identity object or rejects with an error object.
   * @throws An error if the NFID iframe is not instantiated.
   */
  async getDelegation(options?: {
    targets?: string[];
    maxTimeToLive?: bigint;
    derivationOrigin?: string | URL;
  }) {
    console.debug('NFID.connect');
    const derivationOrigin =
      options?.derivationOrigin || this._nfidConfig?.ic?.derivationOrigin;

    if (!NFID.isIframeInstantiated)
      throw new Error('NFID iframe not instantiated');
    showIframe();
    return new Promise<Identity>((resolve, reject) => {
      NFID._authClient
        .login({ ...options, derivationOrigin })
        .then((identity) => resolve(identity))
        .catch((e) => reject({ error: e.message }))
        .finally(hideIframe);
    });
  }

  /**
   * Updates the global delegation for the current user.
   * @param options - The options for the delegation update.
   * @param options.targets - The targets for the delegation update.
   * @param options.maxTimeToLive - The maximum time to live for the delegation update.
   * @returns A Promise that resolves with the delegation update response.
   * @throws Any error that occurs during the delegation update.
   */
  async updateGlobalDelegation(options: {
    targets: string[];
    maxTimeToLive?: bigint;
    derivationOrigin?: string | URL;
  }) {
    const derivationOrigin =
      options?.derivationOrigin || this._nfidConfig?.ic?.derivationOrigin;

    console.debug('NFID.renewDelegation');
    const delegationType = NFID._authClient.getDelegationType();
    if (delegationType === DelegationType.ANONYMOUS)
      throw new Error('You can not update delegation from anonymous user');

    const response = await NFID._authClient.renewDelegation({
      ...options,
      derivationOrigin,
    });
    if ('error' in response) throw new Error((response as any).error.message);

    return response;
  }

  public getDelegationType() {
    return NFID._authClient.getDelegationType();
  }

  async logout() {
    return NFID._authClient.logout();
  }

  async requestTransferFT(options: {
    receiver: string;
    amount: string;
    memo?: bigint;
    derivationOrigin?: string | URL;
  }) {
    console.debug('NFID.requestTransferFT');
    const derivationOrigin =
      options?.derivationOrigin || this._nfidConfig?.ic?.derivationOrigin;

    const delegationType = NFID._authClient.getDelegationType();

    if (delegationType === DelegationType.ANONYMOUS)
      throw new Error('You can not call requestTransferFT from anonymous user');

    if (!NFID.nfidIframe) throw new Error('NFID iframe not instantiated');

    showIframe();
    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_requestTransfer',
      params: [
        {
          receiver: options.receiver,
          amount: options.amount,
          memo: options.memo,
          derivationOrigin,
        },
      ],
    });
    hideIframe();

    if ('error' in response) {
      throw Error(response.error.message);
    }

    return response.result;
  }

  async requestTransferNFT(options: {
    receiver: string;
    tokenId: string;
    derivationOrigin?: string | URL;
  }) {
    console.debug('NFID.requestTransferNFT');
    const derivationOrigin =
      options?.derivationOrigin || this._nfidConfig?.ic?.derivationOrigin;

    const delegationType = NFID._authClient.getDelegationType();
    if (delegationType === DelegationType.ANONYMOUS)
      throw new Error(
        'You can not call requestTransferNFT from anonymous user'
      );

    if (!NFID.nfidIframe) throw new Error('NFID iframe not instantiated');
    showIframe();
    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_requestTransfer',
      params: [
        {
          receiver: options.receiver,
          tokenId: options.tokenId,
          derivationOrigin,
        },
      ],
    });
    hideIframe();

    if ('error' in response) {
      throw Error(response.error.message);
    }

    return response.result;
  }

  /**
   * Sends a request to a 3rd party canister.
   * @param method - The method to call on the canister.
   * @param canisterId - The ID of the canister to call.
   * @param parameters - Optional parameters to pass to the canister method.
   * @param derivationOrigin - Optional derivation origin to use for the request.
   * @returns A Promise that resolves with the result of the canister call.
   */
  async requestCanisterCall({
    method,
    canisterId,
    parameters,
    derivationOrigin,
  }: {
    method: string;
    canisterId: string;
    parameters?: string;
    derivationOrigin?: string | URL;
  }) {
    console.debug('NFID.requestCanisterCall', {
      method,
      canisterId,
      parameters,
      derivationOrigin,
    });
    const delegationType = NFID._authClient.getDelegationType();
    if (delegationType === DelegationType.ANONYMOUS)
      throw new Error(
        'You can not call requestCanisterCall from anonymous user'
      );

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
          derivationOrigin:
            derivationOrigin || this._nfidConfig?.ic?.derivationOrigin,
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
