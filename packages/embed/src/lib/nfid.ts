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
          console.debug('NFID.initIframe: iframe loaded');
          NFID.isIframeInstantiated = true;
          NFID.nfidIframe = nfidIframe;
          resolve(true);
        },
      });
    });
  }

  static async init(params: NFIDConfig) {
    const { origin = 'https://nfid.one', ...nfidConfig } = params;

    console.debug('NFID.init', { origin, ...nfidConfig });
    await NFID.initIframe({ origin, ...nfidConfig });
    NFID._authClient = await NfidAuthClient.create();
    return new this({ origin, ...nfidConfig });
  }

  async updateGlobalDelegation(options: {
    targets: string[];
    maxTimeToLive?: bigint;
  }) {
    console.log('NFID.renewDelegation');
    const delegationType = NFID._authClient.getDelegationType();
    if (delegationType === DelegationType.ANONYMOUS)
      throw new Error('You can not update delegation from anonymous user');

    const response = await NFID._authClient.renewDelegation(options);
    if ('error' in response) throw new Error((response as any).error.message);

    return response;
  }

  async getDelegation(options?: {
    targets?: string[];
    maxTimeToLive?: bigint;
    derivationOrigin?: string | URL;
  }) {
    console.debug('NFID.connect');
    if (!NFID.isIframeInstantiated)
      throw new Error('NFID iframe not instantiated');
    showIframe();
    return new Promise<Identity>((resolve, reject) => {
      NFID._authClient
        .login(options)
        .then((identity) => resolve(identity))
        .catch((e) => reject({ error: e.message }))
        .finally(hideIframe);
    });
  }

  public getDelegationType() {
    return NFID._authClient.getDelegationType();
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
    console.log('NFID.requestCanisterCall');
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
